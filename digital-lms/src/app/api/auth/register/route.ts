import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { getSettings } from "@/models/Settings";
import {
  hashPassword,
  signAccessToken,
  signRefreshToken,
  setAuthCookies,
  jsonError,
  AuthError,
} from "@/lib/auth";
import { Role } from "@/lib/constants";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: NextRequest) {
  try {
    const limited = rateLimit(`register:${clientIp(req)}`, { limit: 5, windowMs: 60_000 });
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Too many registration attempts. Try again later." },
        { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } }
      );
    }

    const body = schema.parse(await req.json());
    await connectDB();
    const settings = await getSettings();
    if (!settings.allowSignup) {
      throw new AuthError("Public registration is disabled", 403);
    }
    const exists = await User.findOne({ email: body.email.toLowerCase() });
    if (exists) throw new AuthError("Email already registered", 409);

    const user = await User.create({
      name: body.name,
      email: body.email.toLowerCase(),
      passwordHash: await hashPassword(body.password),
      roles: ["student"] as Role[],
    });

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
      return NextResponse.json({ error: err.issues[0]?.message }, { status: 400 });
    }
    return jsonError(err);
  }
}
