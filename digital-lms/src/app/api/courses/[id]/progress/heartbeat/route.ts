import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Enrollment } from "@/models/Enrollment";
import { requireSession, jsonError } from "@/lib/auth";
import { getOrCreateLp, evaluateLessonGate } from "@/lib/lesson-criteria";

/**
 * Client heartbeats while watching/reading.
 * Caps increments to elapsed wall time so seeking cannot fake watch %.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id: courseId } = await params;
    const body = await req.json();
    const chapterId = String(body.chapterId || "");
    const lessonId = String(body.lessonId || "");
    if (!chapterId || !lessonId) {
      return NextResponse.json({ error: "chapterId and lessonId required" }, { status: 400 });
    }

    await connectDB();
    let enrollment = await Enrollment.findOne({ userId: session.sub, courseId });
    if (!enrollment) {
      enrollment = await Enrollment.create({
        userId: session.sub,
        courseId,
        source: "self",
      });
    }

    const lp = getOrCreateLp(enrollment, chapterId, lessonId);
    const now = Date.now();
    const last = lp.lastHeartbeatAt ? lp.lastHeartbeatAt.getTime() : 0;
    const wallElapsed = last ? Math.max(0, (now - last) / 1000) : 5;
    const reportedWatch = Math.max(0, Number(body.watchedDelta) || 0);
    const reportedRead = Math.max(0, Number(body.readDwellDelta) || 0);
    const maxDelta = Math.min(15, wallElapsed + 1);

    if (reportedWatch > 0) {
      lp.watchedSeconds = (lp.watchedSeconds || 0) + Math.min(reportedWatch, maxDelta);
      lp.videoWatchSeconds = lp.watchedSeconds;
    }
    if (reportedRead > 0) {
      lp.readDwellSeconds = (lp.readDwellSeconds || 0) + Math.min(reportedRead, maxDelta);
    }
    if (typeof body.durationSeconds === "number" && body.durationSeconds > 0) {
      lp.durationSeconds = Math.max(lp.durationSeconds || 0, body.durationSeconds);
    }
    if (body.reachedEnd === true) {
      lp.reachedEnd = true;
    }
    lp.lastHeartbeatAt = new Date();
    enrollment.markModified("lessonProgress");
    await enrollment.save();

    const gate = await evaluateLessonGate(session.sub, courseId, chapterId, lessonId);
    return NextResponse.json({
      progress: {
        watchedSeconds: lp.watchedSeconds,
        durationSeconds: lp.durationSeconds,
        readDwellSeconds: lp.readDwellSeconds,
        reachedEnd: lp.reachedEnd,
      },
      gate,
    });
  } catch (err) {
    return jsonError(err);
  }
}
