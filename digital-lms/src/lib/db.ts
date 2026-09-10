import mongoose from "mongoose";
import { ensureSeed } from "@/lib/ensure-seed";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/digital-lms";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? { conn: null, promise: null };
global.mongooseCache = cached;

export async function connectDB() {
  if (cached.conn) {
    await ensureSeed().catch((err) => console.error("[seed]", err));
    return cached.conn;
  }
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 8000,
      })
      .catch((err) => {
        cached.promise = null;
        throw err;
      });
  }
  cached.conn = await cached.promise;
  await ensureSeed().catch((err) => console.error("[seed]", err));
  return cached.conn;
}
