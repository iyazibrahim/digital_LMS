import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { getSettings } from "@/models/Settings";
import {
  hashPassword,
  signAccessToken,
  signRefreshToken,
  setAuthCookies,
  safeNextPath,
} from "@/lib/auth";
import { Role } from "@/lib/constants";
import { appBaseUrl } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const stateRaw = req.nextUrl.searchParams.get("state");
  let nextPath = "/dashboard";
  try {
    if (stateRaw) {
      const parsed = JSON.parse(Buffer.from(stateRaw, "base64url").toString("utf8"));
      nextPath = safeNextPath(parsed.next, "/dashboard");
    }
  } catch {
    /* ignore */
  }

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=google_denied", req.nextUrl.origin));
  }

  await connectDB();
  const settings = await getSettings();
  const clientId = settings.googleClientId || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = settings.googleClientSecret || process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL("/login?error=google_not_configured", req.nextUrl.origin)
    );
  }

  const redirectUri = `${appBaseUrl()}/api/auth/google/callback`;
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  const tokenData = await tokenRes.json();
  if (!tokenRes.ok || !tokenData.access_token) {
    console.error("[google oauth]", tokenData);
    return NextResponse.redirect(new URL("/login?error=google_token", req.nextUrl.origin));
  }

  const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const profile = await profileRes.json();
  if (!profile?.email) {
    return NextResponse.redirect(new URL("/login?error=google_profile", req.nextUrl.origin));
  }

  const email = String(profile.email).toLowerCase();
  let user = await User.findOne({
    $or: [{ googleId: profile.id }, { email }],
  });
  if (!user) {
    user = await User.create({
      email,
      name: profile.name || email.split("@")[0],
      passwordHash: await hashPassword(crypto.randomBytes(24).toString("hex")),
      roles: ["student"],
      googleId: profile.id,
      avatarUrl: profile.picture,
      mustChangePassword: false,
    });
  } else {
    if (!user.googleId) user.googleId = profile.id;
    if (!user.isActive) {
      return NextResponse.redirect(new URL("/login?error=disabled", req.nextUrl.origin));
    }
    user.lastLoginAt = new Date();
    await user.save();
  }

  const roles = Array.from(user.roles || ["student"]).map(String) as Role[];
  const payload = {
    sub: String(user._id),
    email: String(user.email),
    name: String(user.name),
    roles,
  };
  const access = await signAccessToken(payload);
  const refresh = await signRefreshToken(payload);
  const res = NextResponse.redirect(new URL(nextPath, req.nextUrl.origin));
  setAuthCookies(res, access, refresh, req);
  return res;
}
