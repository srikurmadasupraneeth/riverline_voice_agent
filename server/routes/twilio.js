// server/routes/twilio.js
import { Router } from "express";
import { voiceWebhook } from "../controllers/twilioController.js";

const r = Router();

// This is the main webhook Twilio will call for voice interactions
r.post("/voice", voiceWebhook);

export default r;
