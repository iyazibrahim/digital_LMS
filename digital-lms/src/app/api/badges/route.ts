import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Badge, UserBadge } from "@/models/Certificate";
import { requireSession, jsonError } from "@/lib/auth";
import { PRIVILEGED_ROLES } from "@/lib/constants";

export async function GET() {
  try {
    await requireSession(PRIVILEGED_ROLES);
    await connectDB();
    const badges = await Badge.find().sort({ createdAt: -1 }).populate("courseId", "title").lean();
    return NextResponse.json({ badges });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession(PRIVILEGED_ROLES);
    await connectDB();
    const body = await req.json();
    const badge = await Badge.create({
      name: body.name,
      description: body.description || "",
      imageUrl: body.imageUrl || "",
      courseId: body.courseId || undefined,
      autoAwardOnCourseComplete: body.autoAwardOnCourseComplete !== false,
      createdBy: session.sub,
    });
    return NextResponse.json({ badge }, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireSession(["admin"]);
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await Badge.findByIdAndDelete(id);
    await UserBadge.deleteMany({ badgeId: id });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
