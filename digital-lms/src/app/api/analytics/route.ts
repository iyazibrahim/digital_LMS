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

export async function GET() {
  try {
    await requireSession(STAFF_ROLES);
    await connectDB();
    const [
      users,
      courses,
      enrollments,
      completions,
      batches,
      certificates,
      applications,
      quizSubs,
    ] = await Promise.all([
      User.countDocuments(),
      Course.countDocuments(),
      Enrollment.countDocuments(),
      Enrollment.countDocuments({ completed: true }),
      Batch.countDocuments(),
      Certificate.countDocuments(),
      JobApplication.countDocuments(),
      QuizSubmission.countDocuments(),
    ]);

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(7)
      .select("createdAt")
      .lean();

    const byDay: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      byDay[key] = 0;
    }
    for (const u of recentUsers) {
      const key = new Date(u.createdAt).toISOString().slice(0, 10);
      if (key in byDay) byDay[key] += 1;
    }

    return NextResponse.json({
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
      signupsByDay: Object.entries(byDay).map(([date, count]) => ({ date, count })),
    });
  } catch (err) {
    return jsonError(err);
  }
}
