// client/src/api.js
const API = process.env.REACT_APP_API || "http://localhost:5000/api";

// Borrowers
export async function fetchBorrowers() {
  const r = await fetch(`${API}/borrowers`);
  return r.json();
}
export async function fetchBorrower(id) {
  const r = await fetch(`${API}/borrowers/${id}`);
  return r.json();
}

// Conversations
export async function startConversation(
  borrower_id,
  { tone = "neutral" } = {}
) {
  const r = await fetch(`${API}/conversations/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ borrower_id, tone }),
  });
  return r.json();
}
export async function postUtter(conv_id, text) {
  const r = await fetch(`${API}/conversations/utter`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conv_id, text }),
  });
  return r.json();
}
export async function setOutcome(conv_id, outcome) {
  const r = await fetch(`${API}/conversations/outcome`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conv_id, outcome }),
  });
  return r.json();
}
export async function scheduleFollowup(conv_id, when) {
  const r = await fetch(`${API}/conversations/followup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conv_id, when }),
  });
  return r.json();
}
export async function getConvSummary(convId) {
  const r = await fetch(`${API}/conversations/summary/${convId}`);
  return r.json();
}

// Promises (PTP)
export async function listPromises(borrower_id) {
  const q = borrower_id ? `?borrower_id=${borrower_id}` : "";
  const r = await fetch(`${API}/promises${q}`);
  return r.json();
}
export async function markKept(id) {
  const r = await fetch(`${API}/promises/${id}/kept`, { method: "POST" });
  return r.json();
}
export async function markBroken(id) {
  const r = await fetch(`${API}/promises/broken/${id}`, { method: "POST" });
  return r.json();
}

// Payments
export async function collectPayment(borrower_id, amount) {
  const r = await fetch(`${API}/payments/collect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ borrower_id, amount }),
  });
  return r.json();
}

// Policies
export async function getPolicies() {
  const r = await fetch(`${API}/policies`);
  return r.json();
}
export async function upsertPolicy(body) {
  const r = await fetch(`${API}/policies`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return r.json();
}

// Settlements
export async function getSettlementReco(borrowerId) {
  const r = await fetch(`${API}/settlements/${borrowerId}/reco`);
  return r.json();
}
export async function createSettlement(
  borrowerId,
  offered_amount,
  valid_days = 7,
  notes = ""
) {
  const r = await fetch(`${API}/settlements/${borrowerId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ offered_amount, valid_days, notes }),
  });
  return r.json();
}
export async function listSettlements(borrowerId) {
  const r = await fetch(`${API}/settlements/${borrowerId}`);
  return r.json();
}
export async function acceptSettlement(offerId) {
  const r = await fetch(`${API}/settlements/accept/${offerId}`, {
    method: "POST",
  });
  return r.json();
}

// Persona & Flags
export async function recomputePersona(borrowerId) {
  const r = await fetch(`${API}/borrowers/${borrowerId}/persona/recompute`, {
    method: "POST",
  });
  return r.json();
}
export async function setFlags(borrowerId, flags) {
  const r = await fetch(`${API}/borrowers/${borrowerId}/flags`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(flags),
  });
  return r.json();
}

// Queue / Ops
export async function getPriorityQueue() {
  const r = await fetch(`${API}/ops/queue`);
  return r.json();
}

export async function getTodayQueue() {
  const r = await fetch(`${API}/ops/queue`);
  return r.json();
}

export async function getRecoveryFor(id) {
  const r = await fetch(`${API}/ops/recovery/${id}`);
  return r.json();
}
export async function getRecoveryDashboard() {
  const r = await fetch(`${API}/ops/dashboard`);
  return r.json();
}
export async function getLeaderboard() {
  const r = await fetch(`${API}/ops/leaderboard`);
  return r.json();
}
export async function complianceCheck() {
  const r = await fetch(`${API}/ops/compliance-check`);
  return r.json();
}

// ✅ NEW: Twilio Call Function
export async function startTwilioCall(borrowerId) {
  const r = await fetch(`${API}/ops/start-twilio-call/${borrowerId}`, {
    method: "POST",
  });
  return r.json();
}
