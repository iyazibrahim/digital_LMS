import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();
    const ready = mongoose.connection.readyState === 1;
    return NextResponse.json({
      ok: ready,
      status: ready ? "healthy" : "degraded",
    });
  } catch (err) {
    console.error("[health]", err);
    return NextResponse.json({ ok: false, status: "unhealthy" }, { status: 503 });
  }
}
