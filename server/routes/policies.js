import { Router } from "express";
import { listPolicies, upsertPolicy } from "../controllers/policyController.js";
const r = Router();
r.get("/", listPolicies);
r.post("/", upsertPolicy);
export default r;
