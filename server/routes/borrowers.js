// server/routes/borrowers.js
import { Router } from "express";
import {
  listBorrowers,
  getBorrower,
  setFlag,
  recomputePersona,
} from "../controllers/borrowerController.js";

const r = Router();

r.get("/", listBorrowers);
r.get("/:id", getBorrower);
r.post("/:id/flags", setFlag);
r.post("/:id/persona/recompute", recomputePersona);

export default r;
