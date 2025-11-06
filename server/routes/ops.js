// server/routes/ops.js
import { Router } from "express";
import {
  getPriorityQueue,
  recoveryForBorrower,
  recoveryDashboard,
  leaderboard,
  complianceCheck,
  startTwilioCall, // ✅ IMPORT THE NEW FUNCTION
} from "../controllers/opsController.js";

const r = Router();
r.get("/queue", getPriorityQueue);
r.get("/recovery/:id", recoveryForBorrower);
r.get("/dashboard", recoveryDashboard);
r.get("/leaderboard", leaderboard);
r.get("/compliance-check", complianceCheck);

// ✅ ADD THIS NEW ROUTE
r.post("/start-twilio-call/:id", startTwilioCall);

export default r;
