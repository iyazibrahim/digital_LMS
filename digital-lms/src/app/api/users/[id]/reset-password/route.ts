import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { requireSession, jsonError, hashPassword } from "@/lib/auth";
import { generateTempPassword } from "@/lib/temp-password";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession(["admin"]);
    const { id } = await params;
    await connectDB();
    const user = await User.findById(id);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const temporaryPassword = generateTempPassword();
    user.passwordHash = await hashPassword(temporaryPassword);
    user.mustChangePassword = true;
    await user.save();

    return NextResponse.json({
      temporaryPassword,
      user: {
        _id: String(user._id),
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    return jsonError(err);
  }
}
