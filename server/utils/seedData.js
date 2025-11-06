// server/utils/seedData.js

// EMI helper (annuity)
function monthlyEmi(principal, months, annualRatePct = 24) {
  const r = annualRatePct / 12 / 100;
  if (r === 0) return Math.round(principal / months);
  const x = Math.pow(1 + r, months);
  return Math.round((principal * r * x) / (x - 1));
}

// Borrower generator helper
function genBorrower({
  name,
  phone,
  language,
  loan,
  tenure,
  monthsPaid,
  risk,
  offsetMonths,
  persona = "neutral",
}) {
  const emi = monthlyEmi(loan, tenure, 24);
  const today = new Date();
  const next = new Date(
    today.getFullYear(),
    today.getMonth() + offsetMonths,
    10 // pick 10th as due-date to be visually clear; DPD logic uses this exact date
  );

  // amount_due: if due date in the past => emi, else 0 (demo-simple)
  const dueToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const amount_due = dueToday > next ? emi : 0;

  return {
    name,
    phone,
    language, // enum now allows "ta"
    total_loan_amount: loan,
    emi_amount: emi,
    loan_tenure_months: tenure,
    months_paid: monthsPaid,
    next_due_date: next,
    amount_due,
    hardship_flag: false,
    dispute_flag: false,
    persona,
    risk_level: risk,
    active_ptp: false,
    active_offer: false,
    broken_ptp: 0,
    last_outcome: null,
    segments: [],
  };
}

export const borrowers = [
  // Low Risk x3 (upcoming)
  genBorrower({
    name: "Ravi Kumar",
    phone: "9000000001",
    language: "hi",
    loan: 10000,
    tenure: 12,
    monthsPaid: 8,
    risk: "low",
    offsetMonths: +1,
  }),
  genBorrower({
    name: "Krishna Patel",
    phone: "9000000004",
    language: "hi",
    loan: 14000,
    tenure: 12,
    monthsPaid: 9,
    risk: "low",
    offsetMonths: +1,
  }),
  genBorrower({
    name: "Meera Shah",
    phone: "9000000005",
    language: "en",
    loan: 12000,
    tenure: 12,
    monthsPaid: 7,
    risk: "low",
    offsetMonths: +1,
  }),

  // Medium Risk x3 (current month due)
  genBorrower({
    name: "Sita Rao",
    phone: "9000000002",
    language: "te",
    loan: 25000,
    tenure: 12,
    monthsPaid: 6,
    risk: "medium",
    offsetMonths: 0,
  }),
  genBorrower({
    name: "Aarav Singh",
    phone: "9000000006",
    language: "hi",
    loan: 20000,
    tenure: 12,
    monthsPaid: 5,
    risk: "medium",
    offsetMonths: 0,
  }),
  genBorrower({
    name: "Priya Menon",
    phone: "9000000007",
    language: "ta",
    loan: 18000,
    tenure: 12,
    monthsPaid: 7,
    risk: "medium",
    offsetMonths: 0,
  }),

  // High Risk x4 (overdue)
  genBorrower({
    name: "Aman Verma",
    phone: "9000000003",
    language: "en",
    loan: 8000,
    tenure: 12,
    monthsPaid: 4,
    risk: "high",
    offsetMonths: -1,
  }),
  genBorrower({
    name: "John Fernandes",
    phone: "9000000008",
    language: "en",
    loan: 20000,
    tenure: 12,
    monthsPaid: 3,
    risk: "high",
    offsetMonths: -2,
    persona: "avoider",
  }),
  genBorrower({
    name: "Lakshmi Devi",
    phone: "9000000009",
    language: "te",
    loan: 15000,
    tenure: 12,
    monthsPaid: 4,
    risk: "high",
    offsetMonths: -2,
    persona: "distressed",
  }),
  genBorrower({
    name: "Vikram Das",
    phone: "9000000010",
    language: "hi",
    loan: 22000,
    tenure: 12,
    monthsPaid: 2,
    risk: "high",
    offsetMonths: -3,
    persona: "aggressive",
  }),
];

export const defaultPolicy = {
  name: "default_collections",
  config: {
    quiet_hours: "21:00-08:00",
    max_daily_nudges: 3,
    tones: { en: "empathetic", hi: "vinamra", te: "vinayam", ta: "manithar" },
  },
};
