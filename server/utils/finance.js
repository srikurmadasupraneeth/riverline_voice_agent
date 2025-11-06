// Simple settlement recommendation by DPD tiers.
// Tune these multipliers quickly to look realistic in a demo.
export function recommendSettlement({ dpd, outstanding }) {
  let pct = 1.0; // 100% default
  if (dpd > 30 && dpd <= 60) pct = 0.85; // 15% discount
  if (dpd > 60 && dpd <= 90) pct = 0.75; // 25% discount
  if (dpd > 90) pct = 0.6; // 40% discount
  const recommended = Math.max(0, Math.round(outstanding * pct));
  return { recommended, pct };
}

export function daysBetween(a, b) {
  return Math.floor((a - b) / (1000 * 60 * 60 * 24));
}

export function computeOutstanding({ total, emi, months_paid }) {
  // simple linear outstanding for demo (not amortization)
  return Math.max(0, Number(total) - Number(emi) * Number(months_paid));
}
