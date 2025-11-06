import mongoose from "mongoose";

const PolicySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    active: { type: Boolean, default: true },
    config: { type: Object, required: true }, // JSON of rules
  },
  { timestamps: true }
);

export default mongoose.model("Policy", PolicySchema);
