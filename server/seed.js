// server/seed.js
import mongoose from "mongoose";
import { config } from "./config.js";
import Borrower from "./models/Borrower.js";
import Policy from "./models/Policy.js";
import { borrowers, defaultPolicy } from "./utils/seedData.js";

// ✅ MongoDB TLS Fix applied here too
const mongooseOptions = {
  tlsAllowInvalidCertificates: true,
};

(async () => {
  try {
    await mongoose.connect(config.mongoUri, mongooseOptions);
    console.log("✅ Connected to MongoDB");

    await Borrower.deleteMany({});
    await Policy.deleteMany({});

    await Borrower.insertMany(borrowers);
    await Policy.create({
      name: defaultPolicy.name,
      config: defaultPolicy.config,
      active: true,
    });

    console.log("✅ Seeded borrowers & policy");
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 DB disconnected");
  }
})();
