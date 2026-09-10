import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Enrollment } from "@/models/Enrollment";
import { Certificate } from "@/models/Certificate";
import { requireSession, jsonError, hashPassword } from "@/lib/auth";

export async function GET() {
  try {
    const session = await requireSession();
    await connectDB();
    const user = await User.findById(session.sub).select("-passwordHash").lean();
    const enrollments = await Enrollment.find({ userId: session.sub })
      .populate("courseId", "title slug")
      .lean();
    const certificates = await Certificate.find({ userId: session.sub })
      .sort({ issuedAt: -1 })
      .lean();
    return NextResponse.json({ user, enrollments, certificates });
  } catch (err) {
    return jsonError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireSession();
    await connectDB();
    const body = await req.json();
    const updates: Record<string, unknown> = {};
    for (const key of [
      "name",
      "bio",
      "headline",
      "phone",
      "skills",
      "education",
      "workExperience",
      "avatarUrl",
    ]) {
      if (body[key] !== undefined) updates[key] = body[key];
    }
    if (body.password) {
      if (String(body.password).length < 6) {
        return NextResponse.json(
          { error: "Password must be at least 6 characters" },
          { status: 400 }
        );
      }
      updates.passwordHash = await hashPassword(body.password);
      updates.mustChangePassword = false;
    }
    const user = await User.findByIdAndUpdate(session.sub, { $set: updates }, { new: true }).select(
      "-passwordHash"
    );
    return NextResponse.json({ user });
  } catch (err) {
    return jsonError(err);
  }
}
