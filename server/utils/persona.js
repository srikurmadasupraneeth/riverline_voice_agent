// server/utils/persona.js
// Heuristic persona classifier
export function classifyPersona({
  dpd = 0,
  kept = 0,
  broken = 0,
  outcomes = [],
}) {
  const keptRate = kept + broken === 0 ? 0 : kept / (kept + broken);
  const noAnswer = outcomes.filter((o) => o === "no_answer").length;
  const connected = outcomes.filter((o) => o === "connected").length;

  if (dpd <= 0 && keptRate >= 0.75) return "friendly";
  if (dpd > 30 && noAnswer >= 2) return "avoider";
  if (broken >= 2 || keptRate < 0.25) return "aggressive";
  if (dpd > 0 && keptRate < 0.5) return "distressed";
  return "neutral";
}
