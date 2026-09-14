import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getSettings } from "@/models/Settings";
import { appBaseUrl } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await connectDB();
  const settings = await getSettings();
  const clientId = settings.googleClientId || process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(
      new URL("/login?error=google_not_configured", req.nextUrl.origin)
    );
  }

  const redirectUri = `${appBaseUrl()}/api/auth/google/callback`;
  const state = Buffer.from(
    JSON.stringify({ next: req.nextUrl.searchParams.get("next") || "/dashboard" })
  ).toString("base64url");

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("access_type", "online");
  url.searchParams.set("prompt", "select_account");

  return NextResponse.redirect(url.toString());
}
