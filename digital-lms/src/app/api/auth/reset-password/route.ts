import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { PasswordResetToken } from "@/models/PasswordReset";
import { hashPassword } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { notifyUser } from "@/lib/notify";

export const dynamic = "force-dynamic";

const schema = z.object({
  token: z.string().min(20),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: NextRequest) {
  const limited = rateLimit(`reset:${clientIp(req)}`, { limit: 10, windowMs: 60_000 });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many requests. Try again later." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } }
    );
  }

  try {
    const body = schema.parse(await req.json());
    await connectDB();
    const tokenHash = crypto.createHash("sha256").update(body.token).digest("hex");
    const record = await PasswordResetToken.findOne({
      tokenHash,
      usedAt: { $exists: false },
      expiresAt: { $gt: new Date() },
    });

    if (!record) {
      return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 });
    }

    const user = await User.findById(record.userId);
    if (!user || !user.isActive) {
      return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 });
    }

    user.passwordHash = await hashPassword(body.password);
    user.mustChangePassword = false;
    await user.save();

    record.usedAt = new Date();
    await record.save();
    await PasswordResetToken.deleteMany({ userId: user._id, _id: { $ne: record._id } });

    await notifyUser({
      userId: user._id,
      type: "password_reset",
      title: "Password updated",
      body: "Your password was changed successfully. If this wasn't you, contact an administrator.",
      href: "/login",
      email: true,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message || "Invalid input" }, { status: 400 });
    }
    console.error("[reset-password]", err);
    return NextResponse.json({ error: "Reset failed" }, { status: 500 });
  }
}
