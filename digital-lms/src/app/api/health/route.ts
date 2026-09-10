import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

export const dynamic = "force-dynamic";

export async function GET() {
  const mongoUriSet = Boolean(process.env.MONGODB_URI);
  try {
    await connectDB();
    const users = await User.countDocuments();
    return NextResponse.json({
      ok: true,
      mongo: {
        readyState: mongoose.connection.readyState,
        uriConfigured: mongoUriSet,
        host: mongoose.connection.host,
        name: mongoose.connection.name,
      },
      users,
      hint:
        users === 0
          ? "No users yet — seed should create admin on connect. Check SEED_ADMIN_* and mongo logs."
          : "DB OK. Use SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD to sign in.",
    });
  } catch (err) {
    console.error("[health]", err);
    return NextResponse.json(
      {
        ok: false,
        mongo: { uriConfigured: mongoUriSet, readyState: mongoose.connection.readyState },
        error: err instanceof Error ? err.message : "health check failed",
        dokploy:
          "Domain port must be 3000 (Next.js inside the container). MONGODB_URI should be mongodb://mongo:27017/digital-lms",
      },
      { status: 503 }
    );
  }
}
