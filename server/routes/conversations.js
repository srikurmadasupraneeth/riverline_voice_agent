import express from "express";
import {
  startConversation,
  postUtter,
  getConversation,
  setOutcome,
  scheduleFollowup,
  convSummary,
  todayQueue,
} from "../controllers/conversationController.js";

const router = express.Router();

router.post("/start", startConversation);
router.post("/utter", postUtter);
router.post("/outcome", setOutcome);
router.post("/followup", scheduleFollowup);
router.get("/summary/:conv_id", convSummary);
router.get("/queue/today", todayQueue);
router.get("/:id", getConversation);

export default router;
