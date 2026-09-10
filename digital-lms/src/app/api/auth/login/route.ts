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
  safeNextPath,
} from "@/lib/auth";
import { Role } from "@/lib/constants";
import { ensureSeed } from "@/lib/ensure-seed";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  next: z.string().optional(),
});

function fail(message: string, status: number, detail?: unknown) {
  const body: Record<string, unknown> = { error: message };
  if (process.env.SHOW_ERROR_DETAILS === "1" && detail) {
    body.detail = detail instanceof Error ? detail.message : String(detail);
  }
  return NextResponse.json(body, { status });
}

async function writeCookies(
  res: NextResponse,
  access: string,
  refresh: string,
  req: NextRequest
) {
  setAuthCookies(res, access, refresh, req);
  // Also set via cookies() API (more reliable in some Next/proxy setups)
  try {
    const jar = await cookies();
    const secure =
      process.env.COOKIE_SECURE === "0"
        ? false
        : process.env.COOKIE_SECURE === "1" ||
          req.headers.get("x-forwarded-proto")?.includes("https") ||
          (process.env.NEXT_PUBLIC_APP_URL || "").startsWith("https://");
    jar.set("dp_access", access, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    jar.set("dp_refresh", refresh, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  } catch (err) {
    console.error("[login] cookies().set failed", err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let email = "";
    let password = "";
    let nextPath = "/studio";
    let wantsRedirect = false;

    if (contentType.includes("application/json")) {
      const body = schema.parse(await req.json());
      email = body.email;
      password = body.password;
      nextPath = safeNextPath(body.next, "/studio");
    } else {
      // Classic form POST — most reliable way to set cookies through proxies
      wantsRedirect = true;
      const form = await req.formData();
      email = String(form.get("email") || "");
      password = String(form.get("password") || "");
      nextPath = safeNextPath(String(form.get("next") || "/studio"), "/studio");
    }

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

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user?.passwordHash) {
      throw new AuthError("Invalid email or password", 401);
    }

    const ok = await verifyPassword(password, user.passwordHash);
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

    if (wantsRedirect) {
      const dest = new URL(nextPath, req.nextUrl.origin);
      const res = NextResponse.redirect(dest, 303);
      await writeCookies(res, access, refresh, req);
      return res;
    }

    const res = NextResponse.json({
      user: {
        id: String(user._id),
        name: String(user.name),
        email: String(user.email),
        roles,
      },
      // Client persists these when Set-Cookie is stripped by CDN/proxy
      accessToken: access,
      refreshToken: refresh,
    });
    await writeCookies(res, access, refresh, req);
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
