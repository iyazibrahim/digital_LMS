import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import {
  verifyPassword,
  signAccessToken,
  signRefreshToken,
  setAuthCookies,
  jsonError,
  AuthError,
} from "@/lib/auth";
import { Role } from "@/lib/constants";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json());
    await connectDB();
    const user = await User.findOne({ email: body.email.toLowerCase() });
    if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
      throw new AuthError("Invalid email or password", 401);
    }
    if (!user.isActive) throw new AuthError("Account disabled", 403);

    user.lastLoginAt = new Date();
    await user.save();

    const payload = {
      sub: String(user._id),
      email: user.email,
      name: user.name,
      roles: user.roles as Role[],
    };
    const access = await signAccessToken(payload);
    const refresh = await signRefreshToken(payload);
    const res = NextResponse.json({
      user: { id: user._id, name: user.name, email: user.email, roles: user.roles },
    });
    setAuthCookies(res, access, refresh);
    return res;
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message }, { status: 400 });
    }
    return jsonError(err);
  }
}
