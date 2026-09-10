import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { Course } from "@/models/Course";
import { Enrollment } from "@/models/Enrollment";
import { requireSession, jsonError } from "@/lib/auth";
import { countLessons, awardCourseBadges, issueCertificate } from "@/lib/progress";
import { percent } from "@/lib/utils";

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

    const lessonId = chapterId; // SCORM chapter uses chapter id as progress key
    void lessonId;
    const lp = enrollment.lessonProgress.find(
      (p: { lessonId: { toString(): string } }) => String(p.lessonId) === chapterId
    );
    if (!lp) {
      enrollment.lessonProgress.push({
        lessonId: new Types.ObjectId(chapterId),
        chapterId: new Types.ObjectId(chapterId),
        completed: !!body.completed,
        completedAt: body.completed ? new Date() : undefined,
        videoWatchSeconds: 0,
        scormData: body.scormData || {},
      });
    } else {
      lp.scormData = body.scormData || lp.scormData;
      if (body.completed) {
        lp.completed = true;
        lp.completedAt = new Date();
      }
    }

    if (
      body.completed &&
      !enrollment.completedLessonIds.some(
        (id: { toString(): string }) => String(id) === chapterId
      )
    ) {
      enrollment.completedLessonIds.push(new Types.ObjectId(chapterId));
    }

    const total = countLessons(course);
    enrollment.progressPercent = percent(enrollment.completedLessonIds.length, total);
    if (total > 0 && enrollment.completedLessonIds.length >= total) {
      enrollment.completed = true;
      enrollment.completedAt = new Date();
      if (course.enableCertification && !enrollment.certificateId) {
        const cert = await issueCertificate(session.sub, courseId);
        enrollment.certificateId = cert._id;
      }
      await awardCourseBadges(session.sub, courseId);
    }
    await enrollment.save();
    return NextResponse.json(enrollment);
  } catch (err) {
    return jsonError(err);
  }
}
