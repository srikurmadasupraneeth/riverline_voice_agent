// server/routes/reports.js
import express from "express";
import { eodReport } from "../controllers/reportController.js";
const router = express.Router();

router.get("/eod", eodReport);
export default router;
