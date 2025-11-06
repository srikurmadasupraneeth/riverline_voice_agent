// server/utils/queue.js
import { detectFakeNumber } from "./safety.js"; // ✅ IMPORT FAKE NUMBER DETECTOR

export function computeDPD(b, today = new Date()) {
  const due = new Date(b.next_due_date);
  const T = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (T <= due) return 0;
  return Math.max(0, Math.floor((T - due) / (1000 * 60 * 60 * 24)));
}

export function scoreBorrower(b) {
  // ✅ 6.3 & 6.5: De-prioritize locked accounts
  // If in safe mode or legal escalation, set score to minimum so they
  // drop out of the active queue.
  if (b.safe_mode_flag || b.legal_escalation_flag) {
    return { dpd: computeDPD(b), score: -999 };
  }

  // ✅ 6.4: Check for invalid number
  if (b.invalid_number_flag) {
    return { dpd: computeDPD(b), score: -999 };
  }

  const dpd = computeDPD(b);
  let score = 0;

  // DPD severity
  score += dpd > 90 ? 60 : dpd > 60 ? 45 : dpd > 30 ? 30 : dpd > 0 ? 15 : 0;

  // Promise behavior
  if (b.broken_ptp) score += Math.min(35, 10 + 8 * b.broken_ptp);
  if (b.active_ptp) score -= 15;

  // Settlement
  if (b.active_offer) score -= 10;

  // Recent outcome
  switch (b.last_outcome) {
    case "no_answer":
      score += 8;
      break;
    case "voicemail":
      score += 4;
      break;
    case "busy":
      score += 2;
      break;
    case "connected":
      score -= 5;
      break;
  }

  // Persona
  const mod = { aggressive: +18, avoider: +12, friendly: -5, distressed: -8 };
  score += mod[b.persona] || 0;

  // Risk baseline
  score += b.risk_level === "high" ? 6 : b.risk_level === "medium" ? 3 : 0;

  return { dpd, score };
}

export function buildQueue(borrowers) {
  return borrowers
    .map((b) => {
      const obj = b.toObject ? b.toObject() : b;

      // ✅ 6.4: Run fake number check during queue build
      // This is an approximation of a "batch" check for the demo
      if (!obj.invalid_number_flag) {
        obj.invalid_number_flag = detectFakeNumber(obj.phone);
        // Note: This doesn't save to DB, just flags for this queue run
      }

      const { dpd, score } = scoreBorrower(obj);
      return { ...obj, dpd, priority_score: score };
    })
    .sort((a, b) => b.priority_score - a.priority_score);
}
