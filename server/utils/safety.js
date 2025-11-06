// server/utils/safety.js

// 6.3 Abuse / harassment detection
const ABUSE_KEYWORDS = [
  "abuse",
  "idiot",
  "stupid",
  "fraud",
  "scam",
  "cheat",
  "harass",
  "chor",
  "pagal", // hindi
  "mosam",
  "donga", // telugu
  // Add more expletives as needed
];

export function detectAbuse(text) {
  const s = text.toLowerCase();
  for (const keyword of ABUSE_KEYWORDS) {
    if (s.includes(keyword)) {
      return true;
    }
  }
  return false;
}

// 6.4 Fake number detection
export function detectFakeNumber(phone) {
  // Pattern 1: Simple repeated digits (e.g., 9999999999, 8888888888)
  if (/^(\d)\1{9}$/.test(phone)) {
    return true;
  }
  // Pattern 2: Simple sequential digits (e.g., 1234567890, 9876543210)
  if (/^1234567890$|^9876543210$/.test(phone)) {
    return true;
  }
  // Pattern 3: Invalid start (Indian numbers don't start with 0-5)
  if (/^[0-5]/.test(phone)) {
    return true;
  }
  return false;
}
