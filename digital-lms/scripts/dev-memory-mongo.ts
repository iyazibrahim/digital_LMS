/**
 * Dev helper: start an in-memory MongoDB when Docker Mongo is unavailable,
 * then run seed. Usage: npx tsx scripts/dev-memory-mongo.ts
 */
import { MongoMemoryServer } from "mongodb-memory-server";
import { spawn } from "child_process";

async function main() {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri("digital-lms");
  console.log("Memory MongoDB at", uri);
  process.env.MONGODB_URI = uri;

  await new Promise<void>((resolve, reject) => {
    const child = spawn("npx", ["tsx", "scripts/seed.ts"], {
      stdio: "inherit",
      env: { ...process.env, MONGODB_URI: uri },
      shell: true,
    });
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`seed ${code}`))));
  });

  console.log("Keeping memory Mongo alive. Start the app with:");
  console.log(`  set MONGODB_URI=${uri}`);
  console.log("  npm run dev");
  // keep process alive
  await new Promise(() => {});
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
