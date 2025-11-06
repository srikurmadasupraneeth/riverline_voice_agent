// server/controllers/promiseController.js
import PromiseModel from "../models/Promise.js";
import Borrower from "../models/Borrower.js";

// ✅ DEFINE LEGAL ESCALATION THRESHOLD
const LEGAL_ESCALATION_THRESHOLD = 3; // e.g., Escalate after 3 broken promises

export async function listPromises(req, res) {
  const { borrower_id } = req.query;
  const q = borrower_id ? { borrower_id } : {};
  const rows = await PromiseModel.find(q).sort({ createdAt: -1 }).lean();
  res.json(rows);
}

export async function markKept(req, res) {
  const { id } = req.params;
  const p = await PromiseModel.findById(id);
  if (!p) return res.status(404).json({ error: "Not found" });

  p.status = "KEPT";
  await p.save();

  // borrower has no longer an active PTP if all PTPs are KEPT/BROKEN
  const borrower = await Borrower.findById(p.borrower_id);
  const stillActive = await PromiseModel.exists({
    borrower_id: p.borrower_id,
    status: "PTP",
  });
  borrower.active_ptp = !!stillActive;
  await borrower.save();

  res.json({ ok: true });
}

export async function markBroken(req, res) {
  const { id } = req.params;
  const p = await PromiseModel.findById(id);
  if (!p) return res.status(404).json({ error: "Not found" });

  p.status = "BROKEN";
  await p.save();

  const borrower = await Borrower.findById(p.borrower_id);
  borrower.broken_ptp = (borrower.broken_ptp || 0) + 1; // ✅ penalty counter
  const stillActive = await PromiseModel.exists({
    borrower_id: p.borrower_id,
    status: "PTP",
  });
  borrower.active_ptp = !!stillActive;

  // ✅ 6.5 LEGAL ESCALATION
  if (borrower.broken_ptp >= LEGAL_ESCALATION_THRESHOLD) {
    borrower.legal_escalation_flag = true;
  }

  await borrower.save();

  res.json({ ok: true });
}
