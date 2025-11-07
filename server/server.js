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

// ✅ --- BRUTE FORCE CORS FIX ---
// This ensures all your Vercel URLs are allowed.
const allowedOrigins = [
  "http://localhost:3000",
  "https"s://riverline-voice-agent-j2np.vercel.app",
  "https://riverline-voice-agent-j2np-73x03pt9c.vercel.app",
  "https://riverline-voice-agent-j2np-d8ifsavpl.vercel.app", // The one from your error log
  "https://riverline-voice-agent-git-a5ac6e-srikurmadasupraneeths-projects.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
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

// ✅ --- THIS IS THE CRITICAL FIX ---
// Added the SSL fix options to the main server connection
const mongooseOptions = {
  tlsAllowInvalidCertificates: true,
};

mongoose
  .connect(config.mongoUri, mongooseOptions) // ✅ PASS THE OPTIONS HERE
  .then(() =>
    app.listen(config.port, () =>
      console.log(`✅ Server running at http://localhost:${config.port}`)
    )
  )
  .catch((err) => {
    console.error("❌ MongoDB Connection Error", err.message);
    process.exit(1);
  });