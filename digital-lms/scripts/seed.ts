/**
 * CLI seed entrypoint. Prefer auto-seed via connectDB() in the running app.
 * Usage: MONGODB_URI=... npm run seed
 */
import "dotenv/config";
import { connectDB } from "../src/lib/db";

async function main() {
  await connectDB();
  console.log("Seed complete (ensureSeed ran via connectDB).");
  const adminEmail = (process.env.SEED_ADMIN_EMAIL || "").trim();
  console.log(adminEmail ? `Admin seeded from SEED_ADMIN_EMAIL (${adminEmail})` : "Admin not seeded (set SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD)");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
