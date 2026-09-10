import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Course } from "@/models/Course";
import { requireSession, jsonError } from "@/lib/auth";
import { PRIVILEGED_ROLES } from "@/lib/constants";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; chapterId: string }> }
) {
  try {
    await requireSession(PRIVILEGED_ROLES);
    const { id, chapterId } = await params;
    const body = await req.json();
    await connectDB();
    const course = await Course.findById(id);
    if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const chapter = course.chapters.id(chapterId);
    if (!chapter) return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    Object.assign(chapter, body);
    await course.save();
    return NextResponse.json(course);
  } catch (err) {
    return jsonError(err);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; chapterId: string }> }
) {
  try {
    await requireSession(PRIVILEGED_ROLES);
    const { id, chapterId } = await params;
    await connectDB();
    const course = await Course.findById(id);
    if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });
    course.chapters.id(chapterId)?.deleteOne();
    await course.save();
    return NextResponse.json(course);
  } catch (err) {
    return jsonError(err);
  }
}
