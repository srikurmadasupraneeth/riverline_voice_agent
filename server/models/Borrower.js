// server/models/Borrower.js
import mongoose from "mongoose";

const BorrowerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true, index: true },
    language: { type: String, enum: ["en", "hi", "te", "ta"], default: "en" },

    // Loan Details
    total_loan_amount: { type: Number, required: true },
    emi_amount: { type: Number, required: true },
    next_due_date: { type: Date, required: true },
    loan_tenure_months: { type: Number, required: true },
    months_paid: { type: Number, default: 0 },

    // Collections Logic
    dpd: { type: Number, default: 0 }, // Days Past Due (derived, but keep for caching)
    amount_due: { type: Number, required: true, default: 0 },
    min_settlement_pct: { type: Number, default: 50 },
    hardship_flag: { type: Boolean, default: false },
    dispute_flag: { type: Boolean, default: false },
    risk_level: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },

    // Behavior & state used by queue
    persona: {
      type: String,
      enum: ["neutral", "friendly", "avoider", "distressed", "aggressive"],
      default: "neutral",
    },
    active_ptp: { type: Boolean, default: false },
    active_offer: { type: Boolean, default: false },
    broken_ptp: { type: Number, default: 0 },
    last_outcome: {
      type: String,
      enum: ["connected", "no_answer", "busy", "voicemail", null],
      default: null,
    },

    // ✅ NEW COMPLIANCE FLAGS
    safe_mode_flag: { type: Boolean, default: false }, // 6.3 Abuse
    invalid_number_flag: { type: Boolean, default: false }, // 6.4 Fake Number
    legal_escalation_flag: { type: Boolean, default: false }, // 6.5 Legal

    // Segmentation
    segments: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.model("Borrower", BorrowerSchema);
