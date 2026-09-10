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
    });
  } catch (err) {
    return jsonError(err);
  }
}
