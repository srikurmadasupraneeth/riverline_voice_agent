import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema(
  {
    borrower_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Borrower",
      required: true,
    },
    amount: { type: Number, required: true },
    at: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("Payment", PaymentSchema);
