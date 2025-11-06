// server/routes/promises.js
import { Router } from "express";
import {
  listPromises,
  markKept,
  markBroken,
} from "../controllers/promiseController.js";

const r = Router();
r.get("/", listPromises);
r.post("/:id/kept", markKept);
r.post("/broken/:id", markBroken);

export default r;
