import Policy from "../models/Policy.js";

export async function listPolicies(req, res) {
  const items = await Policy.find({}).lean();
  res.json(items);
}

export async function upsertPolicy(req, res) {
  const { name, config, active = true } = req.body;
  const p = await Policy.findOneAndUpdate(
    { name },
    { name, config, active },
    { new: true, upsert: true }
  );
  res.json(p);
}
