// server/server.js
import express from "express";
import morgan from "morgan";
import cors from "cors";
import mongoose from "mongoose";
import { config } from "./config.js";

import settlementRoutes from "./routes/settlements.js";
import borrowerRoutes from "./routes/borrowers.js";
import convRoutes from "./routes/conversations.js";
import promiseRoutes from "./routes/promises.js";
import policyRoutes from "./routes/policies.js";
import paymentRoutes from "./routes/payments.js";
import reportRoutes from "./routes/reports.js";
import opsRoutes from "./routes/ops.js";
import twilioRoutes from "./routes/twilio.js";

const app = express();

// ✅ --- BRUTE FORCE CORS FIX (Corrected URLs) ---
// We are hardcoding all your Vercel URLs to be 100% certain.
const allowedOrigins = [
  "http://localhost:3000",
  "https://riverline-voice-agent-j2np.vercel.app", // Your main URL
  "https://riverline-voice-agent-j2np-73x03pt9c.vercel.app", // Your previous URL
  "https://riverline-voice-agent-git-a5ac6e-srikurmadasupraneeths-projects.vercel.app", // Your Git branch URL
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like Postman) or from our allowed list
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        // Log the blocked origin for debugging
        console.warn(`CORS Error: Blocked origin -> ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);
// --- END OF FIX ---

app.use(express.urlencoded({ extended: false }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

// Routes
app.use("/api/borrowers", borrowerRoutes);
app.use("/api/conversations", convRoutes);
app.use("/api/promises", promiseRoutes);
app.use("/api/policies", policyRoutes);
app.use("/api/settlements", settlementRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/ops", opsRoutes);
app.use("/api/twilio", twilioRoutes);

app.get("/", (_, res) =>
  res.json({ ok: true, service: "riverline-voice-agent" })
);

// This SSL fix should already be in your file
const mongooseOptions = {
  tlsAllowInvalidCertificates: true,
};

mongoose
  .connect(config.mongoUri, mongooseOptions)
  .then(() =>
    app.listen(config.port, () =>
      console.log(`✅ Server running at http://localhost:${config.port}`)
    )
  )
  .catch((err) => {
    console.error("❌ MongoDB Connection Error", err.message);
    process.exit(1);
  });
