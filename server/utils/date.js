// server/utils/date.js
export function startOfMonth(d = new Date()) {
  const t = new Date(d);
  t.setHours(0, 0, 0, 0);
  t.setDate(1);
  return t;
}

export function addMonthsKeepDay1(d, n) {
  // Always returns the 1st of the target month
  const t = startOfMonth(d);
  t.setMonth(t.getMonth() + n);
  return t;
}

export function daysBetween(a, b) {
  const A = new Date(a);
  A.setHours(0, 0, 0, 0);
  const B = new Date(b);
  B.setHours(0, 0, 0, 0);
  return Math.floor((A - B) / (1000 * 60 * 60 * 24));
}
