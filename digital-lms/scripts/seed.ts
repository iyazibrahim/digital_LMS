/**
 * CLI seed entrypoint. Prefer auto-seed via connectDB() in the running app.
 * Usage: MONGODB_URI=... npm run seed
 */
import "dotenv/config";
import { connectDB } from "../src/lib/db";

async function main() {
  await connectDB();
  console.log("Seed complete (ensureSeed ran via connectDB).");
  console.log("Admin:", process.env.SEED_ADMIN_EMAIL || "admin@digitalpenang.my");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
