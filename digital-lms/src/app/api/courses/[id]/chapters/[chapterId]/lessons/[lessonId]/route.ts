import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Course } from "@/models/Course";
import { requireSession, jsonError } from "@/lib/auth";
import { PRIVILEGED_ROLES } from "@/lib/constants";
import { slugify } from "@/lib/utils";

export async function PATCH(
  req: NextRequest,
  {
    params,
  }: { params: Promise<{ id: string; chapterId: string; lessonId: string }> }
) {
  try {
    await requireSession(PRIVILEGED_ROLES);
    const { id, chapterId, lessonId } = await params;
    const body = await req.json();
    await connectDB();
    const course = await Course.findById(id);
    if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const chapter = course.chapters.id(chapterId);
    const lesson = chapter?.lessons.id(lessonId);
    if (!lesson) return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    if (body.title && body.title !== lesson.title) {
      body.slug = slugify(body.title);
    }
    Object.assign(lesson, body);
    await course.save();
    return NextResponse.json(course);
  } catch (err) {
    return jsonError(err);
  }
}

export async function DELETE(
  _req: NextRequest,
  {
    params,
  }: { params: Promise<{ id: string; chapterId: string; lessonId: string }> }
) {
  try {
    await requireSession(PRIVILEGED_ROLES);
    const { id, chapterId, lessonId } = await params;
    await connectDB();
    const course = await Course.findById(id);
    if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const chapter = course.chapters.id(chapterId);
    chapter?.lessons.id(lessonId)?.deleteOne();
    await course.save();
    return NextResponse.json(course);
  } catch (err) {
    return jsonError(err);
  }
}
