// server/models/Settlement.js
import mongoose from "mongoose";

const SettlementSchema = new mongoose.Schema(
  {
    borrower_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Borrower",
      required: true,
    },
    dpd_at_offer: { type: Number, required: true },
    principal_outstanding: { type: Number, required: true },
    recommended_amount: { type: Number, required: true },
    offered_amount: { type: Number, required: true }, // what we send to borrower
    status: {
      type: String,
      enum: ["OFFERED", "ACCEPTED", "EXPIRED", "REJECTED"],
      default: "OFFERED",
    },
    valid_until: { type: Date, required: true },
    accepted_at: { type: Date },
    notes: { type: String },

    // ✅ NEW: Audit trail for logging WA messages
    audit: [{ type: Object, default: {} }],
  },
  { timestamps: true }
);

export default mongoose.model("Settlement", SettlementSchema);
