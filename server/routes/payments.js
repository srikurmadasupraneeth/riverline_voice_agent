import express from "express";
import { collectPayment } from "../controllers/paymentController.js";

const router = express.Router();

router.post("/collect", collectPayment);

export default router;
