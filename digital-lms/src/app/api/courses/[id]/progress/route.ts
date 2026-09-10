import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Enrollment } from "@/models/Enrollment";
import { requireSession, jsonError } from "@/lib/auth";
import { markLessonComplete } from "@/lib/progress";
import { evaluateLessonGate, type GateStatus } from "@/lib/lesson-criteria";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;
    await connectDB();
    const enrollment = await Enrollment.findOne({ userId: session.sub, courseId: id });

    const { searchParams } = new URL(req.url);
    const chapterId = searchParams.get("chapterId");
    const lessonId = searchParams.get("lessonId");
    let gate: GateStatus | null = null;
    if (chapterId && lessonId) {
      gate = await evaluateLessonGate(session.sub, id, chapterId, lessonId);
    }

    return NextResponse.json({ enrollment, gate });
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

    try {
      const enrollment = await markLessonComplete(
        session.sub,
        id,
        body.chapterId,
        body.lessonId
      );
      return NextResponse.json({ enrollment });
    } catch (e) {
      const err = e as Error & { status?: number; reasons?: string[] };
      if (err.status === 400) {
        return NextResponse.json(
          { error: err.message, reasons: err.reasons || [err.message] },
          { status: 400 }
        );
      }
      throw e;
    }
  } catch (err) {
    return jsonError(err);
  }
}
