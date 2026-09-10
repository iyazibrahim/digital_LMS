import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Course } from "@/models/Course";
import { requireSession, jsonError, getSession } from "@/lib/auth";
import { PRIVILEGED_ROLES } from "@/lib/constants";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();
    const course = await Course.findById(id).populate("instructors", "name email").lean();
    if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!course.published) {
      const session = await getSession();
      if (!session?.roles?.some((r) => PRIVILEGED_ROLES.includes(r))) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
    }
    return NextResponse.json(course);
  } catch (err) {
    return jsonError(err);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession(PRIVILEGED_ROLES);
    const { id } = await params;
    await connectDB();
    const body = await req.json();
    if (body.published === true && !body.publishedAt) body.publishedAt = new Date();
    const course = await Course.findByIdAndUpdate(id, { $set: body }, { new: true });
    if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(course);
  } catch (err) {
    return jsonError(err);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession(["admin"]);
    const { id } = await params;
    await connectDB();
    await Course.findByIdAndDelete(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
