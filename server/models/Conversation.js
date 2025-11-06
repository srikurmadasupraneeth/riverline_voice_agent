// server/models/Conversation.js
import mongoose from "mongoose";

const TurnSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["borrower", "agent"], required: true },
    text: { type: String, required: true },
    language: { type: String, enum: ["en", "hi", "te"], default: "en" },
    meta: { type: Object, default: {} },
  },
  { timestamps: true }
);

const ConversationSchema = new mongoose.Schema(
  {
    borrower_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Borrower",
      required: true,
    },
    channel: {
      type: String,
      enum: ["voice", "whatsapp", "email"],
      default: "voice",
    },
    state: { type: String, default: "CONTACT" },

    entities: { type: Object, default: { amount: null, due_date: null } },

    turns: [TurnSchema],
    audit: [{ type: Object, default: {} }],

    tone: { type: String, default: "neutral" },
    outcome: { type: String, default: null },
    follow_up_at: { type: Date, default: null },
    coaching: { type: Object, default: {} },

    // ✅ NEW: Field for A/B testing
    experiments: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.model("Conversation", ConversationSchema);
