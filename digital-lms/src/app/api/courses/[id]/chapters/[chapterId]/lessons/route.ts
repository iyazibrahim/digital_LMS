import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Course } from "@/models/Course";
import { requireSession, jsonError } from "@/lib/auth";
import { PRIVILEGED_ROLES } from "@/lib/constants";
import { slugify } from "@/lib/utils";

export async function POST(
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
    const base = slugify(body.title || "lesson");
    let slug = base;
    let n = 1;
    while (chapter.lessons.some((l: { slug: string }) => l.slug === slug)) slug = `${base}-${n++}`;
    chapter.lessons.push({
      title: body.title || "New lesson",
      slug,
      contentHtml: body.contentHtml || "",
      content: body.content || null,
      videoUrl: body.videoUrl,
      pdfUrl: body.pdfUrl,
      quizId: body.quizId || null,
      assignmentId: body.assignmentId || null,
      programmingExerciseId: body.programmingExerciseId || null,
      durationMinutes: body.durationMinutes || 0,
      order: chapter.lessons.length,
      isPreview: !!body.isPreview,
    } as never);
    await course.save();
    return NextResponse.json(course);
  } catch (err) {
    return jsonError(err);
  }
}
