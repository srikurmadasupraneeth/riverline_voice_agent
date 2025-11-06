// server/utils/nlp.js
// Multilingual NLU (EN/HI/TE) with amount/date parsing, sentiment, and richer intents

// ✅ EXPANDED DICTIONARY
const POS = [
  "pay",
  "transfer",
  "ok",
  "confirm",
  "haan",
  "haanji",
  "yes",
  "dunga",
  "karunga",
  "istanu",
  "okay",
  "sure",
  "done",
  "paying",
  "payment",
  "agreed",
  "fine",
  "right",
  "correct",
  "karta hoon",
  "aa",
  "sare",
  "avunu",
];

// ✅ EXPANDED DICTIONARY
const NEG = [
  "no",
  "nahi",
  "cannot",
  "cant",
  "issue",
  "problem",
  "lost job",
  "medical",
  "ill",
  "later",
  "baad me",
  "repu",
  "delay",
  "hardship",
  "mushkil",
  "dikkat",
  "no money",
  "broke",
  "salary not",
  "paise nahi",
  "dabbu ledu",
  "kashtam",
  "udyam poindi",
  "next month",
  "agle mahine",
];

// ✅ EXPANDED DICTIONARY (more numbers)
const NUM_EN = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
};

// ✅ EXPANDED DICTIONARY (more numbers)
const NUM_HI = {
  ek: 1,
  do: 2,
  teen: 3,
  chaar: 4,
  paanch: 5,
  che: 6,
  saat: 7,
  aath: 8,
  nau: 9,
  das: 10,
  gyaarah: 11,
  baarah: 12,
  bees: 20,
  tees: 30,
  chaalees: 40,
  pachaas: 50,
  sau: 100,
  hazaar: 1000,
};

// ✅ EXPANDED DICTIONARY (more numbers)
const NUM_TE = {
  okati: 1,
  rendu: 2,
  moodu: 3,
  naalugu: 4,
  aidu: 5,
  aru: 6,
  edu: 7,
  enimidi: 8,
  tommidi: 9,
  padi: 10,
  padakondu: 11,
  pannendu: 12,
  iravai: 20,
  mupphai: 30,
  nalabhai: 40,
  yaabhai: 50,
  vanda: 100,
  veyyi: 1000,
};

function wordNum(w) {
  w = w.toLowerCase();
  if (NUM_EN[w] != null) return NUM_EN[w];
  if (NUM_HI[w] != null) return NUM_HI[w];
  if (NUM_TE[w] != null) return NUM_TE[w];
  return null;
}

function extractAmount(t) {
  // Try direct number match first
  const m = t.match(/(?:₹|rs\.?|rupees?)\s*([0-9,]+(?:\.[0-9]+)?)/i);
  if (m) return Math.round(parseFloat(m[1].replace(/,/g, "")));

  // Try standalone number
  const d = t.match(/\b([0-9,]{2,6})\b/);
  if (d) return parseInt(d[1].replace(/,/g, ""), 10);

  // Try word-based number (e.g., "paanch hazaar" or "five thousand")
  const w = t.match(
    /\b([a-z\u0900-\u097f\u0c00-\u0c7f]+)\s*(thousand|hazaar|velu|veyyi)?\b/i
  );
  if (w) {
    const n = wordNum(w[1]);
    const multiplier = w[2] ? NUM_HI[w[2]] || NUM_TE[w[2]] || 1000 : 1;
    if (n != null) return n * multiplier;
  }
  return null;
}

function addDays(d, n) {
  const t = new Date(d);
  t.setDate(t.getDate() + n);
  return t;
}
function nextDow(from, dow) {
  const d = new Date(from);
  const delta = (dow + 7 - d.getDay()) % 7 || 7;
  return addDays(d, delta);
}

// ✅ IMPROVED DATE PARSING
function parseDate(t, now = new Date()) {
  t = t.toLowerCase();
  if (/\btoday|\baaj|iivala?\b/.test(t)) return now;
  if (/\btomorrow|\bkal|repu\b/.test(t)) return addDays(now, 1);
  if (/\bday after tomorrow|\bparso|ellundi\b/.test(t)) return addDays(now, 2);

  // e.g., "next Friday"
  const m = t.match(/\bnext\s+(sun|mon|tue|wed|thu|fri|sat)\b/);
  if (m) {
    const map = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
    return nextDow(now, map[m[1]]);
  }

  // e.g., "on 15th" or "10 tarik" or "20th"
  const dayMatch = t.match(/\b([0-3]?[0-9])(st|nd|rd|th|thareek|tarik)\b/);
  if (dayMatch) {
    const day = parseInt(dayMatch[1], 10);
    if (day > 0 && day <= 31) {
      // Assume current month if day is later than today, else next month
      if (day > now.getDate()) {
        return new Date(now.getFullYear(), now.getMonth(), day);
      }
      return new Date(now.getFullYear(), now.getMonth() + 1, day);
    }
  }

  // e.g., "in 5 days" or "1 week"
  const durationMatch = t.match(/\b(in|after)\s+([0-9]+)\s+(days?|week)\b/);
  if (durationMatch) {
    const num = parseInt(durationMatch[2], 10);
    const unit = durationMatch[3];
    return addDays(now, unit === "week" ? num * 7 : num);
  }

  // e.g., 10/11/2025 or 10/11
  const dmy = t.match(/\b([0-3]?\d)[\/\-]([0-1]?\d)(?:[\/\-]([0-9]{2,4}))?\b/);
  if (dmy) {
    const d = parseInt(dmy[1], 10),
      mo = parseInt(dmy[2], 10) - 1,
      y = dmy[3] ? parseInt(dmy[3], 10) : now.getFullYear();
    return new Date(y, mo, d);
  }
  return null;
}

function sentiment(t) {
  const s = t.toLowerCase();
  let score = 0;
  POS.forEach((k) => {
    if (s.includes(k)) score += 1;
  });
  NEG.forEach((k) => {
    if (s.includes(k)) score -= 1;
  });
  if (score > 0) return "positive";
  if (score < 0) return "negative";
  return "neutral";
}

export function interpretUtterance({ text, language = "en" }) {
  const t = (text || "").toLowerCase();

  let intent = "UNKNOWN";
  const amount = extractAmount(t);
  const due = parseDate(t);

  if (/\bhello|hi|namaste|namaskar|namaskaram|hey\b/.test(t)) intent = "GREET";
  else if (/\byes|haan|haanji|ok(ay)?|confirm|sare|avunu\b/.test(t))
    intent = "CONFIRM";
  else if (/\bverify|consent|otp|agree\b/.test(t)) intent = "CONSENT";
  // Only treat "callback" when user asks for call timing — not payment timing
  else if (/\bcall\s*back|call.*later\b/.test(t)) intent = "CALLBACK";
  // "later" usually means deferred payment, not a phone call request
  else if (/\blater|baad me|repu|next month|agle mahine\b/.test(t))
    intent = "PAY_LATER";
  else if (
    /\bjob\s*lost|medical|problem|issue|hardship|mushkil|dikkat|kashtam|udyam poindi\b/.test(
      t
    )
  )
    intent = "HARDSHIP";
  else if (
    /\bcannot\s*pay|nahi\s*de|no money|broke|nahi hoga|paise nahi|dabbu ledu\b/.test(
      t
    )
  )
    intent = "CANT_PAY";
  else if (/\bpay|payment|dunga|karunga|transfer|istanu|karta hoon\b/.test(t))
    intent = "PAY_INTENT";
  else if (/what.*due|how much|kitna|amount.*due|enta\b/.test(t))
    intent = "ASK_DUE";

  const ptp =
    (intent === "PAY_INTENT" ||
      intent === "CONFIRM" ||
      intent === "PAY_LATER") &&
    (amount != null || due != null);
  const sent = sentiment(t);

  return {
    intent: ptp ? "PTP_INTENT" : intent,
    entities: { amount: amount || null, due_date: due || null },
    sentiment: sent,
  };
}
