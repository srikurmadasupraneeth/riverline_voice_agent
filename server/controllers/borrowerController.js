import Borrower from "../models/Borrower.js";
import PromiseModel from "../models/Promise.js";
import Settlement from "../models/Settlement.js";
import Conversation from "../models/Conversation.js";
import { classifyPersona } from "../utils/persona.js";
import { detectFakeNumber } from "../utils/safety.js";

/** ✅ List all borrowers
 *  Also persists invalid_number_flag if detected (quick DB hygiene).
 */
export async function listBorrowers(req, res) {
  const list = await Borrower.find().lean();

  // Persist invalid_number_flag for obviously fake numbers
  const ops = [];
  for (const b of list) {
    const isInvalid = detectFakeNumber(b.phone);
    if (isInvalid && !b.invalid_number_flag) {
      ops.push(
        Borrower.updateOne(
          { _id: b._id },
          { $set: { invalid_number_flag: true } }
        )
      );
    }
  }
  if (ops.length) {
    await Promise.allSettled(ops);
    console.log(
      `[Borrowers] Persisted invalid_number_flag on ${ops.length} records`
    );
  }

  res.json(list);
}

// ✅ Single Borrower 360 details
export async function getBorrower(req, res) {
  try {
    const id = req.params.id;
    const b = await Borrower.findById(id).lean();
    if (!b) return res.status(404).json({ error: "Not found" });

    const promises = await PromiseModel.find({ borrower_id: id }).lean();
    const settlements = await Settlement.find({ borrower_id: id }).lean();
    const conversations = await Conversation.find({ borrower_id: id }).lean();

    res.json({ ...b, promises, settlements, conversations });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
}

// ✅ Update borrower hardship/dispute flags
export async function setFlag(req, res) {
  try {
    const { hardship, dispute } = req.body;
    const b = await Borrower.findById(req.params.id);

    if (!b) return res.status(404).json({ error: "Not found" });

    if (typeof hardship === "boolean") b.hardship_flag = hardship;
    if (typeof dispute === "boolean") b.dispute_flag = dispute;

    await b.save();

    res.json({
      ok: true,
      hardship: b.hardship_flag,
      dispute: b.dispute_flag,
    });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
}

// ✅ Compute persona intelligently
export async function recomputePersona(req, res) {
  try {
    const id = req.params.id;
    const b = await Borrower.findById(id);
    if (!b) return res.status(404).json({ error: "Not found" });

    const promises = await PromiseModel.find({ borrower_id: id }).lean();
    const kept = promises.filter((p) => p.status === "KEPT").length;
    const broken = promises.filter((p) => p.status === "BROKEN").length;

    const outcomes = (
      await Conversation.find({ borrower_id: id })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean()
    )
      .map((c) => c.outcome)
      .filter(Boolean);

    const dpd = b.dpd ?? 0;
    b.persona = classifyPersona({ dpd, kept, broken, outcomes });

    await b.save();
    res.json({ persona: b.persona });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
}
