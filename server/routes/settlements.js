import express from "express";
import {
  getRecommendation,
  createOffer,
  listOffers,
  acceptOffer,
} from "../controllers/settlementController.js";

const router = express.Router();
router.get("/:borrower_id/reco", getRecommendation);
router.get("/:borrower_id", listOffers);
router.post("/:borrower_id", createOffer);
router.post("/accept/:id", acceptOffer);

export default router;
