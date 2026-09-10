import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { Course } from "@/models/Course";
import { Enrollment } from "@/models/Enrollment";
import { requireSession, jsonError } from "@/lib/auth";
import { markLessonComplete } from "@/lib/progress";
import { evaluateLessonGate } from "@/lib/lesson-criteria";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string; chapterId: string }> }
) {
  try {
    const session = await requireSession();
    const { courseId, chapterId } = await params;
    const body = await req.json();
    await connectDB();
    const course = await Course.findById(courseId);
    if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });

    let enrollment = await Enrollment.findOne({ userId: session.sub, courseId });
    if (!enrollment) {
      enrollment = await Enrollment.create({
        userId: session.sub,
        courseId,
        source: "self",
      });
    }

    const lp = enrollment.lessonProgress.find(
      (p: { lessonId: { toString(): string } }) => String(p.lessonId) === chapterId
    );
    if (!lp) {
      enrollment.lessonProgress.push({
        lessonId: new Types.ObjectId(chapterId),
        chapterId: new Types.ObjectId(chapterId),
        completed: false,
        videoWatchSeconds: 0,
        watchedSeconds: 0,
        durationSeconds: 0,
        readDwellSeconds: 0,
        reachedEnd: false,
        scormData: body.scormData || {},
      });
    } else {
      lp.scormData = body.scormData || lp.scormData;
    }
    await enrollment.save();

    if (body.completed) {
      const gate = await evaluateLessonGate(session.sub, courseId, chapterId, chapterId);
      if (!gate.ready) {
        return NextResponse.json(
          { error: gate.reasons[0] || "Requirements not met", reasons: gate.reasons, enrollment },
          { status: 400 }
        );
      }
      try {
        enrollment = await markLessonComplete(session.sub, courseId, chapterId, chapterId);
      } catch (e) {
        const err = e as Error & { status?: number; reasons?: string[] };
        if (err.status === 400) {
          return NextResponse.json(
            { error: err.message, reasons: err.reasons },
            { status: 400 }
          );
        }
        throw e;
      }
    }

    return NextResponse.json(enrollment);
  } catch (err) {
    return jsonError(err);
  }
}
