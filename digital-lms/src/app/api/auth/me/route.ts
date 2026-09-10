import { NextRequest, NextResponse } from "next/server";
import { attachSessionCookies, getSession, cookieSecure } from "@/lib/auth";
import { isStaff } from "@/lib/constants";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      {
        user: null,
        cookieSecure: cookieSecure(req),
        hint: "No session cookie. Re-login after setting COOKIE_SECURE and stable JWT secrets.",
      },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  const res = NextResponse.json({
    user: {
      id: session.sub,
      email: session.email,
      name: session.name,
      roles: session.roles,
      isStaff: isStaff(session.roles),
    },
  });
  // Re-issue cookies so access/refresh stay in sync after login
  await attachSessionCookies(res, session, req);
  return res;
}
