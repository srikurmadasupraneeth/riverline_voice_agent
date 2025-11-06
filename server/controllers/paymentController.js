import Borrower from "../models/Borrower.js";
import Payment from "../models/Payment.js";
import { addMonthsKeepDay1 } from "../utils/date.js";

export async function collectPayment(req, res) {
  try {
    const { borrower_id, amount } = req.body;
    const b = await Borrower.findById(borrower_id);
    if (!b) return res.status(404).json({ error: "Borrower not found" });

    const amt = Math.max(0, Number(amount || 0));

    await Payment.create({
      borrower_id,
      amount: amt,
      at: new Date(),
    });

    const emi = Number(b.emi_amount);
    const applied = Math.min(emi, amt);

    if (applied >= emi) {
      b.months_paid = Number(b.months_paid) + 1;
      b.next_due_date = addMonthsKeepDay1(new Date(b.next_due_date), 1);
    }

    await b.save();

    res.json({
      ok: true,
      applied,
      next_due_date: b.next_due_date,
      months_paid: b.months_paid,
    });
  } catch (e) {
    console.error("collectPayment error", e);
    res.status(500).json({ error: "Server error" });
  }
}
