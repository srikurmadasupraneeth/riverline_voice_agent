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

// CORS — restrict on deploy if needed
app.use(
  cors({
    origin: config.corsOrigin || "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);
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

// ✅ Production-safe Mongo connect (no tlsAllowInvalidCertificates)
mongoose
  .connect(config.mongoUri)
  .then(() =>
    app.listen(config.port, () =>
      console.log(`✅ Server running at http://localhost:${config.port}`)
    )
  )
  .catch((err) => {
    console.error("❌ MongoDB Connection Error", err.message);
    process.exit(1);
  });
