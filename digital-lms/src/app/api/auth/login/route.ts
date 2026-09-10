import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import {
  verifyPassword,
  signAccessToken,
  signRefreshToken,
  setAuthCookies,
  AuthError,
} from "@/lib/auth";
import { Role } from "@/lib/constants";
import { ensureSeed } from "@/lib/ensure-seed";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function fail(message: string, status: number, detail?: unknown) {
  const body: Record<string, unknown> = { error: message };
  if (process.env.SHOW_ERROR_DETAILS === "1" && detail) {
    body.detail = detail instanceof Error ? detail.message : String(detail);
  }
  return NextResponse.json(body, { status });
}

export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json());

    try {
      await connectDB();
    } catch (dbErr) {
      console.error("[login] DB connection failed", dbErr);
      return fail(
        "Database unavailable. In Dokploy, set MONGODB_URI=mongodb://mongo:27017/digital-lms and ensure the mongo service is healthy.",
        503,
        dbErr
      );
    }

    try {
      await ensureSeed();
    } catch (seedErr) {
      console.error("[login] seed failed", seedErr);
      return fail(
        "Could not prepare admin account. Check mongo logs and SEED_* env vars.",
        503,
        seedErr
      );
    }

    if (mongoose.connection.readyState !== 1) {
      return fail("Database not connected.", 503);
    }

    const user = await User.findOne({ email: body.email.toLowerCase() });
    if (!user?.passwordHash) {
      throw new AuthError("Invalid email or password", 401);
    }

    const ok = await verifyPassword(body.password, user.passwordHash);
    if (!ok) throw new AuthError("Invalid email or password", 401);
    if (!user.isActive) throw new AuthError("Account disabled", 403);

    user.lastLoginAt = new Date();
    await user.save();

    const roles = Array.from(user.roles || ["student"]).map(String) as Role[];
    const payload = {
      sub: String(user._id),
      email: String(user.email),
      name: String(user.name),
      roles,
    };
    const access = await signAccessToken(payload);
    const refresh = await signRefreshToken(payload);
    const res = NextResponse.json({
      user: {
        id: String(user._id),
        name: String(user.name),
        email: String(user.email),
        roles,
      },
    });
    setAuthCookies(res, access, refresh, req);
    return res;
  } catch (err) {
    if (err instanceof z.ZodError) {
      return fail(err.issues[0]?.message || "Invalid input", 400);
    }
    if (err instanceof AuthError) {
      return fail(err.message, err.status);
    }
    console.error("[login] unexpected", err);
    return fail("Login failed. Check app logs and MongoDB.", 500, err);
  }
}
