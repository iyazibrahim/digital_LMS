import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Course } from "@/models/Course";
import { Enrollment } from "@/models/Enrollment";
import { Batch } from "@/models/Batch";
import { Certificate } from "@/models/Certificate";
import { JobApplication } from "@/models/Job";
import { QuizSubmission } from "@/models/Quiz";
import { requireSession, jsonError } from "@/lib/auth";
import { STAFF_ROLES } from "@/lib/constants";

type DayPoint = { date: string; label: string; count: number };

function emptySeries(days: number): DayPoint[] {
  const out: DayPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    out.push({ date: key, label: key.slice(5), count: 0 });
  }
  return out;
}

function fillSeries(rows: { createdAt?: Date; completedAt?: Date }[], days: number, field: "createdAt" | "completedAt") {
  const series = emptySeries(days);
  const map = Object.fromEntries(series.map((s) => [s.date, 0]));
  for (const row of rows) {
    const raw = row[field];
    if (!raw) continue;
    const key = new Date(raw).toISOString().slice(0, 10);
    if (key in map) map[key] += 1;
  }
  return series.map((s) => ({ ...s, count: map[s.date] || 0 }));
}

export async function GET() {
  try {
    await requireSession(STAFF_ROLES);
    await connectDB();

    const days = 14;
    const since = new Date();
    since.setDate(since.getDate() - (days - 1));
    since.setHours(0, 0, 0, 0);

    const [
      users,
      courses,
      enrollments,
      completions,
      batches,
      certificates,
      applications,
      quizSubs,
      recentUsers,
      recentEnrollments,
      recentCompletions,
    ] = await Promise.all([
      User.countDocuments(),
      Course.countDocuments(),
      Enrollment.countDocuments(),
      Enrollment.countDocuments({ completed: true }),
      Batch.countDocuments(),
      Certificate.countDocuments(),
      JobApplication.countDocuments(),
      QuizSubmission.countDocuments(),
      User.find({ createdAt: { $gte: since } }).select("createdAt").lean(),
      Enrollment.find({ createdAt: { $gte: since } }).select("createdAt").lean(),
      Enrollment.find({ completed: true, completedAt: { $gte: since } })
        .select("completedAt")
        .lean(),
    ]);

    const signups = fillSeries(recentUsers, days, "createdAt");
    const enrollmentSeries = fillSeries(recentEnrollments, days, "createdAt");
    const completionSeries = fillSeries(recentCompletions, days, "completedAt");

    // At-risk: no heartbeat / progress update in 7 days, incomplete, or recent quiz fails
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const activeEnrollments = await Enrollment.find({ completed: false })
      .populate("userId", "name email")
      .populate("courseId", "title slug")
      .limit(500)
      .lean();

    const atRisk: {
      userId: string;
      name?: string;
      email?: string;
      courseTitle?: string;
      courseSlug?: string;
      progressPercent: number;
      reason: string;
    }[] = [];
    for (const en of activeEnrollments) {
      const lastHb = en.lessonProgress
        ?.map((p) => p.lastHeartbeatAt)
        .filter(Boolean)
        .sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime())[0];
      const stale =
        !lastHb || new Date(lastHb) < weekAgo
          ? !en.updatedAt || new Date(en.updatedAt) < weekAgo
          : false;
      const fails = await QuizSubmission.countDocuments({
        userId: en.userId,
        courseId: en.courseId,
        passed: false,
        submittedAt: { $gte: weekAgo },
      });
      if (stale || fails >= 2 || (en.progressPercent || 0) < 10) {
        const user = en.userId as unknown as { _id?: unknown; name?: string; email?: string };
        const course = en.courseId as unknown as { title?: string; slug?: string };
        atRisk.push({
          userId: String(user?._id || en.userId),
          name: user?.name,
          email: user?.email,
          courseTitle: course?.title,
          courseSlug: course?.slug,
          progressPercent: en.progressPercent || 0,
          reason: fails >= 2 ? "quiz_fails" : stale ? "inactive_7d" : "low_progress",
        });
      }
    }

    // Optional notify for top at-risk (once per request only when ?notify=1)
    // Keep default off to avoid spam

    // Per-course completion snapshot
    const courseStats = await Course.find()
      .select("title enrolledCount")
      .limit(50)
      .lean();
    const perCourse: {
      courseId: string;
      title: string;
      enrollments: number;
      completions: number;
      completionRate: number;
    }[] = [];
    for (const c of courseStats) {
      const total = await Enrollment.countDocuments({ courseId: c._id });
      const done = await Enrollment.countDocuments({ courseId: c._id, completed: true });
      perCourse.push({
        courseId: String(c._id),
        title: c.title,
        enrollments: total,
        completions: done,
        completionRate: total ? Math.round((done / total) * 100) : 0,
      });
    }

    return NextResponse.json({
      counts: {
        users,
        courses,
        enrollments,
        completions,
        batches,
        certificates,
        applications,
        quizSubs,
        atRisk: atRisk.length,
      },
      series: {
        signups,
        enrollments: enrollmentSeries,
        completions: completionSeries,
      },
      totals: {
        users,
        courses,
        enrollments,
        completions,
        batches,
        certificates,
        applications,
        quizSubs,
      },
      signupsByDay: signups,
      atRisk: atRisk.slice(0, 50),
      perCourse,
    });
  } catch (err) {
    return jsonError(err);
  }
}
