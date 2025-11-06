// server/controllers/settlementController.js
import Settlement from "../models/Settlement.js";
import Borrower from "../models/Borrower.js";
import { recommendSettlement, computeOutstanding } from "../utils/finance.js";
import { sendWhatsApp } from "../utils/twilio.js"; // ✅ IMPORT TWILIO HELPER

// Helper to format currency
const INR = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);

function addMonths(d, n) {
  const t = new Date(d);
  const day = t.getDate();
  t.setMonth(t.getMonth() + n);
  if (t.getDate() < day) t.setDate(0);
  return t;
}
function computeDPD(b, today = new Date()) {
  const next = new Date(b.next_due_date);
  let overdue = null;
  if (Number(b.amount_due) > 0 && next > today) overdue = addMonths(next, -1);
  else if (next <= today) overdue = next;
  if (!overdue || today <= overdue) return 0;
  return Math.floor((today - overdue) / (1000 * 60 * 60 * 24));
}

export async function getRecommendation(req, res) {
  try {
    const { borrower_id } = req.params;
    const b = await Borrower.findById(borrower_id).lean();
    if (!b) return res.status(404).json({ error: "Borrower not found" });

    const today = new Date();
    const dpd = computeDPD(b, today);
    const outstanding = computeOutstanding({
      total: b.total_loan_amount,
      emi: b.emi_amount,
      months_paid: b.months_paid,
    });
    const { recommended, pct } = recommendSettlement({ dpd, outstanding });

    res.json({
      borrower_id,
      dpd,
      outstanding,
      recommended_amount: recommended,
      discount_pct: Math.round((1 - pct) * 100),
      roi: {
        recovered_pct: Math.round((recommended / b.total_loan_amount) * 100),
        days_to_cash: 7,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
}

export async function createOffer(req, res) {
  try {
    const { borrower_id } = req.params;
    const { offered_amount, valid_days = 7, notes = "" } = req.body;

    const b = await Borrower.findById(borrower_id);
    if (!b) return res.status(404).json({ error: "Borrower not found" });

    const dpd = computeDPD(b, new Date());
    const outstanding = computeOutstanding({
      total: b.total_loan_amount,
      emi: b.emi_amount,
      months_paid: b.months_paid,
    });

    const offer = await Settlement.create({
      borrower_id: b._id,
      dpd_at_offer: dpd,
      principal_outstanding: outstanding,
      recommended_amount: offered_amount,
      offered_amount,
      valid_until: new Date(Date.now() + valid_days * 24 * 60 * 60 * 1000),
      notes,
      audit: [], // ✅ Initialize audit trail
    });

    // small signal to queue: borrower has an offer
    b.active_offer = true;
    await b.save();

    // ✅ --- SEND WHATSAPP MESSAGE (Feature 9.2) ---
    const messageBody = `Hi ${
      b.name
    }, this is Riverline. We can settle your dues at ${INR(
      offered_amount
    )} if paid within ${valid_days} days. Reply YES to confirm.`;

    const waResult = await sendWhatsApp(b.phone, messageBody);

    // ✅ Log the result of the WhatsApp send
    if (waResult.ok) {
      offer.audit.push({
        type: "WA_OFFER_SENT",
        sid: waResult.sid,
        at: new Date(),
      });
    } else {
      offer.audit.push({
        type: "WA_OFFER_FAILED",
        error: waResult.error,
        at: new Date(),
      });
    }
    await offer.save();
    // --- End of WhatsApp Logic ---

    res.json(offer);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
}

export async function listOffers(req, res) {
  try {
    const { borrower_id } = req.params;
    const offers = await Settlement.find({ borrower_id }).sort({
      createdAt: -1,
    });
    res.json(offers);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
}

export async function acceptOffer(req, res) {
  try {
    const { id } = req.params;
    const offer = await Settlement.findById(id);
    if (!offer) return res.status(404).json({ error: "Offer not found" });
    offer.status = "ACCEPTED";
    offer.accepted_at = new Date();
    await offer.save();

    // dampen urgency in queue once accepted
    const b = await Borrower.findById(offer.borrower_id);
    b.active_offer = false;
    b.active_ptp = true; // assume acceptance implies payment promise
    await b.save();

    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
}
