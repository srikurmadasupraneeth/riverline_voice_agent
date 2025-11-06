import Borrower from "../models/Borrower.js";
import PromiseModel from "../models/Promise.js";
import Settlement from "../models/Settlement.js";
import Conversation from "../models/Conversation.js";
import { buildQueue, computeDPD } from "../utils/queue.js";
import { makeCall } from "../utils/twilio.js";
import { config } from "../config.js";

// --- Helper functions for recoveryForBorrower (unchanged core math) ---
function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}
function ptpReliability({ kept = 0, broken = 0 }) {
  const t = kept + broken;
  return t ? kept / t : 0.5;
}
function offerAcceptProb({ dpd = 0, hasOffer = false }) {
  let base = dpd > 90 ? 0.5 : dpd > 60 ? 0.4 : dpd > 30 ? 0.3 : 0.15;
  if (hasOffer) base += 0.1;
  return Math.min(0.9, Math.max(0.05, base));
}
function engagementScore({ outcomes = [] }) {
  const conn = outcomes.filter((o) => o === "connected").length;
  const noans = outcomes.filter((o) => o === "no_answer").length;
  const busy = outcomes.filter((o) => o === "busy").length;
  return Math.max(
    0,
    Math.min(1, 0.5 + 0.15 * conn - 0.1 * noans - 0.05 * busy)
  );
}
function expectedRecovery_7_30d({
  outstanding,
  emi,
  dpd,
  keptRate,
  acceptProb,
  engage,
}) {
  const short = outstanding
    ? (0.35 * keptRate +
        0.25 * acceptProb +
        0.2 * engage +
        0.2 * sigmoid((30 - dpd) / 20)) *
      emi
    : 0;
  const long = outstanding
    ? (0.25 * keptRate +
        0.35 * acceptProb +
        0.2 * engage +
        0.2 * sigmoid((60 - dpd) / 30)) *
      Math.min(outstanding, 2 * emi)
    : 0;
  return { exp7: Math.round(short), exp30: Math.round(short + long) };
}
function bestContactTimeIST(history = []) {
  const b = new Array(24).fill(0);
  history.forEach((ts) => {
    const d = new Date(ts);
    b[d.getHours()] += 1;
  });
  let hour = 19,
    max = 0;
  b.forEach((v, i) => {
    if (v > max) {
      max = v;
      hour = i;
    }
  });
  if (hour < 8) hour = 8;
  if (hour > 19) hour = 19;
  return {
    hour,
    window: `${String(hour).padStart(2, "0")}:00–${String(hour + 1).padStart(
      2,
      "0"
    )}:00`,
  };
}
function channelMixRecommendation({ outcomes = [] }) {
  const noans = outcomes.filter((o) => o === "no_answer").length;
  const vm = outcomes.filter((o) => o === "voicemail").length;
  if (noans >= 2) return ["whatsapp", "sms", "voice"];
  if (vm >= 2) return ["whatsapp", "voice"];
  return ["voice", "whatsapp"];
}

export async function getPriorityQueue(req, res) {
  const borrowers = await Borrower.find({});
  const queue = buildQueue(borrowers);
  res.json(queue);
}

export async function recoveryForBorrower(req, res) {
  const { id } = req.params;
  const b = await Borrower.findById(id).lean();
  if (!b) return res.status(404).json({ error: "Not found" });

  const dpd = computeDPD(b);
  const ptps = await PromiseModel.find({ borrower_id: id }).lean();
  const kept = ptps.filter((p) => p.status === "KEPT").length;
  const broken = ptps.filter((p) => p.status === "BROKEN").length;
  const keptRate = ptpReliability({ kept, broken });

  const convs = await Conversation.find({ borrower_id: id })
    .sort({ createdAt: -1 })
    .limit(15)
    .lean();
  const outcomes = convs.map((c) => c.outcome).filter(Boolean);
  const engage = engagementScore({ outcomes });

  const hasOffer = !!b.active_offer;
  const emi = Number(b.emi_amount);
  const remainingMonths = Math.max(
    0,
    Number(b.loan_tenure_months) - Number(b.months_paid)
  );
  const outstanding = Math.max(0, remainingMonths * emi);

  const acceptProb = offerAcceptProb({ dpd, hasOffer });
  const { exp7, exp30 } = expectedRecovery_7_30d({
    outstanding,
    emi,
    dpd,
    keptRate,
    acceptProb,
    engage,
  });

  const bestTime = bestContactTimeIST(
    convs.filter((c) => c.outcome === "connected").map((c) => c.createdAt)
  );
  const channels = channelMixRecommendation({ outcomes });

  res.json({ exp7, exp30, keptRate, acceptProb, engage, bestTime, channels });
}

export async function recoveryDashboard(req, res) {
  const borrowers = await Borrower.find({}).lean();
  const ptps = await PromiseModel.find({}).lean();
  const settlements = await Settlement.find({}).lean();
  const convs = await Conversation.find({}).lean();

  const kept = ptps.filter((p) => p.status === "KEPT").length;
  const broken = ptps.filter((p) => p.status === "BROKEN").length;
  const created = ptps.length;
  const accepted = settlements.filter((s) => s.status === "ACCEPTED").length;

  const promisedAmt = ptps.reduce((s, p) => s + Number(p.amount || 0), 0);
  const acceptedAmt = settlements
    .filter((s) => s.status === "ACCEPTED")
    .reduce((s, p) => s + Number(p.offered_amount || 0), 0);

  const byRisk = { low: 0, medium: 0, high: 0 };
  borrowers.forEach((b) => {
    byRisk[b.risk_level || "low"] = (byRisk[b.risk_level || "low"] || 0) + 1;
  });

  const outcomesCount = convs.reduce((m, c) => {
    if (c.outcome) m[c.outcome] = (m[c.outcome] || 0) + 1;
    return m;
  }, {});

  res.json({
    totals: {
      borrowers: borrowers.length,
      conversations: convs.length,
      ptp_created: created,
      ptp_kept: kept,
      ptp_broken: broken,
      offers: settlements.length,
      offers_accepted: accepted,
      promised_amount: promisedAmt,
      accepted_amount: acceptedAmt,
    },
    byRisk,
    outcomes: outcomesCount,
  });
}

export async function leaderboard(req, res) {
  const convs = await Conversation.find({}).lean();
  const ptps = await PromiseModel.find({}).lean();
  const me = {
    agent: "AI-Agent-001",
    calls: convs.length,
    connected: convs.filter((c) => c.outcome === "connected").length,
    ptp: ptps.length,
    kept: ptps.filter((p) => p.status === "KEPT").length,
    kept_rate: ptps.length
      ? Math.round(
          (100 * ptps.filter((p) => p.status === "KEPT").length) / ptps.length
        )
      : 0,
  };
  res.json([me]);
}

/**
 * ✅ IST-compliant quiet hours (08:00–20:00 IST)
 * Works even if server is running in UTC or any TZ.
 */
export async function complianceCheck(req, res) {
  const fmt = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    hour12: false,
  });
  const hourIST = parseInt(fmt.format(new Date()), 10);
  res.json({
    ok: hourIST >= 8 && hourIST < 20,
    hour: hourIST,
    window: "08:00–20:00 IST",
  });
}

/**
 * ✅ Starts a Twilio outbound call (requires public WEBHOOK_BASE_URL and a voice-enabled "from" number).
 * If env not set, returns a graceful error so the UI shows a helpful alert.
 */
export async function startTwilioCall(req, res) {
  try {
    const { id } = req.params;
    const borrower = await Borrower.findById(id);
    if (!borrower) return res.status(404).json({ error: "Borrower not found" });
    if (borrower.safe_mode_flag || borrower.legal_escalation_flag) {
      return res.status(403).json({ error: "Call locked for this borrower." });
    }

    const base = config.webhookBaseUrl;
    if (!base || !/^https?:\/\//i.test(base) || base.includes("localhost")) {
      console.warn("WEBHOOK_BASE_URL is not correctly set for Twilio:", base);
      return res.status(500).json({
        ok: false,
        error:
          "WEBHOOK_BASE_URL is not configured to a public HTTPS URL. Set it to your ngrok or deployed URL.",
      });
    }

    const result = await makeCall(borrower.phone, `${base}/api/twilio/voice`);
    if (result.ok)
      return res.json({
        ok: true,
        sid: result.sid,
        message: "Call initiated.",
      });
    return res.status(500).json({ ok: false, error: result.error });
  } catch (e) {
    console.error("startTwilioCall error:", e);
    res.status(500).json({ error: "Server error" });
  }
}
