// server/controllers/reportController.js
import Borrower from "../models/Borrower.js";
import PromiseModel from "../models/Promise.js";
import Settlement from "../models/Settlement.js";
import Conversation from "../models/Conversation.js";

export async function eodReport(req, res) {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const borrowers = await Borrower.find({});
    const convsToday = await Conversation.find({
      createdAt: { $gte: start, $lte: end },
    });
    const ptpToday = await PromiseModel.find({
      createdAt: { $gte: start, $lte: end },
    });
    const keptToday = await PromiseModel.find({
      status: "KEPT",
      updatedAt: { $gte: start, $lte: end },
    });
    const brokenToday = await PromiseModel.find({
      status: "BROKEN",
      updatedAt: { $gte: start, $lte: end },
    });
    const offersToday = await Settlement.find({
      createdAt: { $gte: start, $lte: end },
    });
    const acceptedToday = await Settlement.find({
      status: "ACCEPTED",
      updatedAt: { $gte: start, $lte: end },
    });

    const totals = {
      borrowers: borrowers.length,
      conversations: convsToday.length,
      ptp_created: ptpToday.length,
      ptp_kept: keptToday.length,
      ptp_broken: brokenToday.length,
      offers: offersToday.length,
      offers_accepted: acceptedToday.length,
    };

    // simple funnel rates
    const conversion = {
      ptp_keep_rate: totals.ptp_created
        ? Math.round((totals.ptp_kept / totals.ptp_created) * 100)
        : 0,
      offer_accept_rate: totals.offers
        ? Math.round((totals.offers_accepted / totals.offers) * 100)
        : 0,
    };

    res.json({ date: new Date(), totals, conversion });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
}
