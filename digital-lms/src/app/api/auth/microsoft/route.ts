import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getSettings } from "@/models/Settings";
import { appBaseUrl } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await connectDB();
  const settings = await getSettings();
  const clientId = settings.microsoftClientId || process.env.MICROSOFT_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(
      new URL("/login?error=microsoft_not_configured", req.nextUrl.origin)
    );
  }

  const redirectUri = `${appBaseUrl()}/api/auth/microsoft/callback`;
  const state = Buffer.from(
    JSON.stringify({ next: req.nextUrl.searchParams.get("next") || "/dashboard" })
  ).toString("base64url");

  const tenant = process.env.MICROSOFT_TENANT || "common";
  const url = new URL(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize`);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_mode", "query");
  url.searchParams.set("scope", "openid email profile User.Read");
  url.searchParams.set("state", state);

  return NextResponse.redirect(url.toString());
}
