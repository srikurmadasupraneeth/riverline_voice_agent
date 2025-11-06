// server/controllers/conversationController.js
import Conversation from "../models/Conversation.js";
import Borrower from "../models/Borrower.js";
import PromiseModel from "../models/Promise.js";
import { nextTurn } from "../utils/fsm.js";
import { auditEvent } from "../utils/audit.js";
import { buildQueue } from "../utils/queue.js";
import { summarizeConversation } from "../utils/summarize.js";
import { detectAbuse } from "../utils/safety.js";
import { getLLMSuggestion } from "../utils/openai.js"; // ✅ IMPORT LLM HELPER

/* ------------------- Start Conversation ------------------- */
export async function startConversation(req, res) {
  try {
    const { borrower_id, channel = "voice", tone = "neutral" } = req.body;
    const borrower = await Borrower.findById(borrower_id);
    if (!borrower) return res.status(404).json({ error: "Borrower not found" });

    if (borrower.safe_mode_flag || borrower.legal_escalation_flag) {
      return res.status(403).json({ error: "Call locked for this borrower." });
    }

    // ✅ NEW: A/B Testing Logic
    const experiments = [];
    // 50% chance to be in the "urgent tone" test group
    if (Math.random() < 0.5) {
      experiments.push("tone_urgent_test");
    }
    // You could add more tests here

    // Override tone if in the experiment group
    const effectiveTone = experiments.includes("tone_urgent_test")
      ? "urgent"
      : tone;

    const conv = new Conversation({
      borrower_id,
      channel,
      state: "CONTACT",
      tone: effectiveTone, // Use the (possibly experimental) tone
      turns: [
        // The FSM will now pick up the localized greeting
      ],
      audit: [],
      entities: {},
      experiments, // Save which tests this conversation is part of
    });

    // ✅ Run the FSM's *first* turn to get the localized greeting
    const { response, nextState } = nextTurn({
      state: "CONTACT",
      borrower,
      text: "",
      tone: effectiveTone,
      convEntities: {},
    });

    conv.state = nextState;
    conv.turns.push({
      role: "agent",
      text: response,
      language: borrower.language,
    });

    auditEvent(conv, "CONV_START", {
      channel,
      tone: effectiveTone,
      experiments,
      at: new Date(),
    });
    await conv.save();
    res.json(conv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

/* ------------------- Helper: Coaching AI ------------------- */
function simpleSentiment(s) {
  const neg = [
    "problem",
    "issue",
    "cant",
    "cannot",
    "nahi",
    "broke",
    "hardship",
    "late",
    "later",
    "angry",
  ];
  const pos = [
    "ok",
    "yes",
    "haan",
    "sure",
    "confirm",
    "pay",
    "payment",
    "done",
  ];
  let score = 0;
  neg.forEach((k) => s.includes(k) && score--);
  pos.forEach((k) => s.includes(k) && score++);
  return score > 0 ? "positive" : score < 0 ? "negative" : "neutral";
}

function noiseScore(s) {
  const dots = (s.match(/\.\.\./g) || []).length;
  const uh = (s.match(/\b(uh|um|hmm)\b/g) || []).length;
  return Math.min(1, (dots + uh) / 5);
}

function getCoaching(lastTxt) {
  const sent = simpleSentiment(lastTxt);
  const noise = noiseScore(lastTxt);
  const tips = [];

  if (sent === "negative")
    tips.push("Acknowledge hardship and slow down tone.");
  if (noise > 0.5)
    tips.push("Line noisy — repeat key info and confirm details.");
  if (/how much|due/.test(lastTxt))
    tips.push("Answer dues clearly then ask for commitment (amount + date).");

  return { sent, noise, tips };
}

/* ------------------- Borrower Utterance Handler ------------------- */
export async function postUtter(req, res) {
  try {
    const { conv_id, text } = req.body;
    const conv = await Conversation.findById(conv_id);
    if (!conv) return res.status(404).json({ error: "Conversation not found" });

    const borrower = await Borrower.findById(conv.borrower_id);
    const borrowerTxt = text.toLowerCase();

    conv.turns.push({ role: "borrower", text, language: borrower.language });

    if (detectAbuse(borrowerTxt)) {
      borrower.safe_mode_flag = true;
      await borrower.save();
      auditEvent(conv, "ABUSE_DETECTED", { text: borrowerTxt });

      const safetyResponse =
        "I've detected abusive language. To protect our agents, this call will be locked. Please contact support.";
      conv.turns.push({
        role: "agent",
        text: safetyResponse,
        language: "en",
      });
      conv.state = "END";
      await conv.save();
      return res.json(conv);
    }

    const { nextState, response, action, entities } = nextTurn({
      state: conv.state,
      borrower,
      text,
      tone: conv.tone || "neutral",
      convEntities: conv.entities,
    });

    conv.state = nextState;
    conv.entities = entities;
    let agentReply = response; // This is the FSM's default reply

    // ✅ NEW: LLM Suggestion Layer
    // We run this in parallel, but *don't* wait for it,
    // to keep the response fast.
    const coaching = getCoaching(borrowerTxt);
    getLLMSuggestion(conv, borrowerTxt, agentReply).then((suggestion) => {
      if (suggestion) {
        // Save the better suggestion
        Conversation.findByIdAndUpdate(conv_id, {
          $set: { "coaching.llm_suggestion": suggestion },
        }).exec();
      }
    });

    // The coaching object is now built from two parts
    conv.coaching = coaching;

    conv.turns.push({
      role: "agent",
      text: agentReply, // We send the fast FSM reply
      language: borrower.language,
    });

    if (action === "CREATE_PTP") {
      const amt = entities.amount || borrower.emi_amount;
      const due = entities.due_date || new Date(Date.now() + 7 * 864e5);
      await PromiseModel.create({
        borrower_id: borrower._id,
        amount: amt,
        due_date: due,
        status: "PTP",
      });
      borrower.active_ptp = true;
      await borrower.save();
      auditEvent(conv, "PTP_CREATED", { amount: amt, due_date: due });
    }

    await conv.save();
    // Return the conversation *as it is now*
    // The LLM suggestion will be saved in the background
    res.json(await Conversation.findById(conv_id).lean());
  } catch (err) {
    console.error("postUtter error", err);
    res.status(500).json({ error: "Server error" });
  }
}

/* ------------------- Other functions ------------------- */
export async function getConversation(req, res) {
  try {
    const conv = await Conversation.findById(req.params.id).lean();
    if (!conv) return res.status(404).json({ error: "Not found" });
    res.json(conv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

export async function setOutcome(req, res) {
  try {
    const { conv_id, outcome } = req.body;
    const conv = await Conversation.findById(conv_id);
    if (!conv) return res.status(404).json({ error: "Conversation not found" });

    conv.outcome = outcome;
    await conv.save();

    const borrower = await Borrower.findById(conv.borrower_id);
    borrower.last_outcome = outcome;
    await borrower.save();

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

export async function scheduleFollowup(req, res) {
  try {
    const { conv_id, when } = req.body;
    const conv = await Conversation.findById(conv_id);
    if (!conv) return res.status(404).json({ error: "Conversation not found" });

    conv.follow_up_at = new Date(when);
    await conv.save();
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

export async function todayQueue(req, res) {
  try {
    const borrowers = await Borrower.find({}).lean();
    res.json(buildQueue(borrowers).slice(0, 20));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

export async function convSummary(req, res) {
  try {
    const conv = await Conversation.findById(req.params.conv_id).lean();
    if (!conv) return res.status(404).json({ error: "Not found" });
    res.json({ summary: summarizeConversation(conv) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}
