import mongoose from "mongoose";

const ConsentSchema = new mongoose.Schema(
  {
    borrower_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Borrower",
      required: true,
    },
    whatsapp_opt_in: { type: Boolean, default: false },
    dnd: { type: Boolean, default: false },
    quiet_hours: { type: String, default: "21:00-08:00" },
  },
  { timestamps: true }
);

export default mongoose.model("Consent", ConsentSchema);
