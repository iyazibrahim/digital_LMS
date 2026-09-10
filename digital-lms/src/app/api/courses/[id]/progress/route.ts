import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Enrollment } from "@/models/Enrollment";
import { requireSession, jsonError } from "@/lib/auth";
import { markLessonComplete } from "@/lib/progress";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;
    await connectDB();
    const enrollment = await Enrollment.findOne({ userId: session.sub, courseId: id });
    return NextResponse.json({ enrollment });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const body = await req.json();
    await connectDB();
    const enrollment = await markLessonComplete(
      session.sub,
      id,
      body.chapterId,
      body.lessonId
    );
    return NextResponse.json(enrollment);
  } catch (err) {
    return jsonError(err);
  }
}
