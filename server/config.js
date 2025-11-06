import dotenv from "dotenv";
dotenv.config();

function validateUri(uri) {
  return (
    typeof uri === "string" &&
    (uri.startsWith("mongodb://") || uri.startsWith("mongodb+srv://"))
  );
}

// Priority: .env → fallback (for dev only)
let mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!validateUri(mongoUri)) {
  console.warn(
    "⚠️ Invalid or missing MONGO_URI in .env. Please set a valid Mongo connection string."
  );
  // Optional dev fallback — comment out for production hard safety
  mongoUri = "mongodb://127.0.0.1:27017/riverline_voice_agent";
}

console.log(
  "✅ MongoDB URI in use:",
  mongoUri.includes("localhost") ? "Local DB" : "Atlas Cluster"
);

export const config = {
  port: process.env.PORT || 5000,
  mongoUri,

  corsOrigin: process.env.CORS_ORIGIN || "*",

  // Twilio config
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || "",
    authToken: process.env.TWILIO_AUTH_TOKEN || "",
    whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER || "", // e.g., whatsapp:+1415xxxxxxx
    voiceNumber: process.env.TWILIO_VOICE_NUMBER || "", // your voice-enabled number (E.164)
  },

  // OpenAI
  openai: {
    apiKey: process.env.OPENAI_API_KEY || "",
  },

  // Public webhook base URL for Twilio callbacks (ngrok or deployed URL)
  webhookBaseUrl: process.env.WEBHOOK_BASE_URL || "",

  jwtSecret: process.env.JWT_SECRET || "supersecretkey",
};
