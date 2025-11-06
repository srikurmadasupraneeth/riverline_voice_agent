import mongoose from "mongoose";

const PromiseSchema = new mongoose.Schema(
  {
    borrower_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Borrower",
      required: true,
    },
    amount: { type: Number, required: true },
    due_date: { type: Date, required: true },
    status: {
      type: String,
      enum: ["PTP", "KEPT", "BROKEN", "CANCELLED"],
      default: "PTP",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Promise", PromiseSchema);
