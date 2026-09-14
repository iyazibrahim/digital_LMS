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
    return NextResponse.redirect(new URL("/login?error=microsoft_denied", req.nextUrl.origin));
  }

  await connectDB();
  const settings = await getSettings();
  const clientId = settings.microsoftClientId || process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = settings.microsoftClientSecret || process.env.MICROSOFT_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL("/login?error=microsoft_not_configured", req.nextUrl.origin)
    );
  }

  const redirectUri = `${appBaseUrl()}/api/auth/microsoft/callback`;
  const tenant = process.env.MICROSOFT_TENANT || "common";
  const tokenRes = await fetch(
    `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    }
  );
  const tokenData = await tokenRes.json();
  if (!tokenRes.ok || !tokenData.access_token) {
    console.error("[microsoft oauth]", tokenData);
    return NextResponse.redirect(new URL("/login?error=microsoft_token", req.nextUrl.origin));
  }

  const profileRes = await fetch("https://graph.microsoft.com/v1.0/me", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const profile = await profileRes.json();
  const email = String(
    profile.mail || profile.userPrincipalName || ""
  ).toLowerCase();
  if (!email) {
    return NextResponse.redirect(new URL("/login?error=microsoft_profile", req.nextUrl.origin));
  }

  let user = await User.findOne({
    $or: [{ microsoftId: profile.id }, { email }],
  });
  if (!user) {
    user = await User.create({
      email,
      name: profile.displayName || email.split("@")[0],
      passwordHash: await hashPassword(crypto.randomBytes(24).toString("hex")),
      roles: ["student"],
      microsoftId: profile.id,
      mustChangePassword: false,
    });
  } else {
    if (!user.microsoftId) user.microsoftId = profile.id;
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
