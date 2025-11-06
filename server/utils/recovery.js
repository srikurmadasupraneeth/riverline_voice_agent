// server/utils/recovery.js
// Expected-recovery math + contact-time heuristics

function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}

export function ptpReliability({ kept = 0, broken = 0 }) {
  const total = kept + broken;
  if (!total) return 0.5;
  return kept / total;
}

export function offerAcceptProb({ dpd = 0, hasOffer = false }) {
  let base = dpd > 90 ? 0.5 : dpd > 60 ? 0.4 : dpd > 30 ? 0.3 : 0.15;
  if (hasOffer) base += 0.1;
  return Math.min(0.9, Math.max(0.05, base));
}

export function engagementScore({ outcomes = [] }) {
  // connected lowers friction; no_answer increases friction
  const conn = outcomes.filter((o) => o === "connected").length;
  const noans = outcomes.filter((o) => o === "no_answer").length;
  const busy = outcomes.filter((o) => o === "busy").length;
  return Math.max(
    0,
    Math.min(1, 0.5 + 0.15 * conn - 0.1 * noans - 0.05 * busy)
  );
}

export function expectedRecovery_7_30d({
  outstanding,
  emi,
  dpd,
  keptRate,
  acceptProb,
  engage,
}) {
  // lightweight expected-cash heuristic
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

export function bestContactTimeIST(history = []) {
  // Return hour bucket with most connections
  const buckets = new Array(24).fill(0);
  history.forEach((ts) => {
    const d = new Date(ts);
    buckets[d.getHours()] += 1;
  });
  let bestHour = 19;
  let max = 0;
  buckets.forEach((v, i) => {
    if (v > max) {
      max = v;
      bestHour = i;
    }
  });
  // RBI safe window 08:00–20:00 IST
  if (bestHour < 8) bestHour = 8;
  if (bestHour > 19) bestHour = 19;
  return {
    hour: bestHour,
    window: `${String(bestHour).padStart(2, "0")}:00–${String(
      bestHour + 1
    ).padStart(2, "0")}:00`,
  };
}

export function channelMixRecommendation({ outcomes = [] }) {
  const noans = outcomes.filter((o) => o === "no_answer").length;
  const voicemail = outcomes.filter((o) => o === "voicemail").length;
  if (noans >= 2) return ["whatsapp", "sms", "voice"];
  if (voicemail >= 2) return ["whatsapp", "voice"];
  return ["voice", "whatsapp"];
}
