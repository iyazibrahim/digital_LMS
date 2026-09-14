import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { PasswordResetToken } from "@/models/PasswordReset";
import { sendEmail, appBaseUrl } from "@/lib/email";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  const limited = rateLimit(`forgot:${clientIp(req)}`, { limit: 5, windowMs: 60_000 });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many requests. Try again later." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } }
    );
  }

  try {
    const body = schema.parse(await req.json());
    await connectDB();
    const email = body.email.toLowerCase();
    const user = await User.findOne({ email, isActive: true });

    // Always return success to avoid email enumeration
    const generic = {
      ok: true,
      message: "If that email exists, we sent a reset link.",
    };

    if (!user) return NextResponse.json(generic);

    const raw = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(raw).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await PasswordResetToken.deleteMany({ userId: user._id, usedAt: { $exists: false } });
    await PasswordResetToken.create({ userId: user._id, tokenHash, expiresAt });

    const link = `${appBaseUrl()}/reset-password?token=${raw}`;
    await sendEmail({
      to: user.email,
      subject: "Reset your Digital Penang LMS password",
      html: `<p>Hi ${user.name},</p>
<p>We received a request to reset your password. This link expires in 1 hour.</p>
<p><a href="${link}">Reset password</a></p>
<p>If you did not request this, you can ignore this email.</p>`,
    });

    return NextResponse.json(generic);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message || "Invalid input" }, { status: 400 });
    }
    console.error("[forgot-password]", err);
    return NextResponse.json({ error: "Request failed" }, { status: 500 });
  }
}
