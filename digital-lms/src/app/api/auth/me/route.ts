import { NextRequest, NextResponse } from "next/server";
import {
  attachSessionCookies,
  cookieSecure,
  getSessionFromRequest,
  signAccessToken,
  signRefreshToken,
} from "@/lib/auth";
import { isStaff } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json(
      {
        user: null,
        cookieSecure: cookieSecure(req),
        hasAccessCookie: Boolean(req.cookies.get("dp_access")?.value),
        hasRefreshCookie: Boolean(req.cookies.get("dp_refresh")?.value),
      },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  const accessToken = await signAccessToken(session);
  const refreshToken = await signRefreshToken(session);

  const res = NextResponse.json(
    {
      user: {
        id: session.sub,
        email: session.email,
        name: session.name,
        roles: session.roles,
        isStaff: isStaff(session.roles),
      },
      accessToken,
      refreshToken,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
  await attachSessionCookies(res, session, req);
  return res;
}
