import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { AssignmentSubmission } from "@/models/Assignment";
import { QuizSubmission } from "@/models/Quiz";
import { ProgrammingSubmission } from "@/models/ProgrammingExercise";
import { Enrollment } from "@/models/Enrollment";
import { requireSession, jsonError } from "@/lib/auth";
import { STAFF_ROLES } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireSession(STAFF_ROLES);
    await connectDB();
    const courseId = req.nextUrl.searchParams.get("courseId");
    const inbox = req.nextUrl.searchParams.get("inbox") === "1";
    const exportCsv = req.nextUrl.searchParams.get("export") === "csv";

    if (inbox) {
      const [assignments, quizzes] = await Promise.all([
        AssignmentSubmission.find({ status: "submitted" })
          .populate("userId", "name email")
          .populate("assignmentId", "title dueAt")
          .sort({ createdAt: -1 })
          .limit(100)
          .lean(),
        QuizSubmission.find({ status: "pending_review" })
          .populate("userId", "name email")
          .populate("quizId", "title")
          .sort({ submittedAt: -1 })
          .limit(100)
          .lean(),
      ]);
      return NextResponse.json({ assignments, quizzes });
    }

    if (courseId) {
      const enrollments = await Enrollment.find({ courseId })
        .populate("userId", "name email")
        .lean();

      const userIds = enrollments.map((e) => e.userId);
      const [quizSubs, assignSubs, exerciseSubs] = await Promise.all([
        QuizSubmission.find({ courseId, userId: { $in: userIds } })
          .populate("quizId", "title")
          .lean(),
        AssignmentSubmission.find({ courseId, userId: { $in: userIds } })
          .populate("assignmentId", "title")
          .lean(),
        ProgrammingSubmission.find({ userId: { $in: userIds } }).lean(),
      ]);

      const rows = enrollments.map((en) => {
        const uid = String((en.userId as { _id?: unknown })?._id || en.userId);
        const user = en.userId as unknown as { name?: string; email?: string };
        const quizzes = quizSubs.filter((q) => String(q.userId) === uid);
        const assignments = assignSubs.filter((a) => String(a.userId) === uid);
        const exercises = exerciseSubs.filter((x) => String(x.userId) === uid);
        return {
          userId: uid,
          name: user?.name,
          email: user?.email,
          progressPercent: en.progressPercent,
          completed: en.completed,
          quizzes: quizzes.map((q) => ({
            quizId: q.quizId,
            percent: q.percent,
            passed: q.passed,
            status: q.status,
          })),
          assignments: assignments.map((a) => ({
            assignmentId: a.assignmentId,
            status: a.status,
            grade: a.grade,
          })),
          exercisesPassed: exercises.filter((x) => x.passed).length,
          exercisesTotal: exercises.length,
        };
      });

      if (exportCsv) {
        const header = "name,email,progress,completed,quiz_avg,assignments_graded\n";
        const lines = rows.map((r) => {
          const quizAvg = r.quizzes.length
            ? Math.round(r.quizzes.reduce((s, q) => s + (q.percent || 0), 0) / r.quizzes.length)
            : "";
          const graded = r.assignments.filter((a) => a.status !== "submitted").length;
          return `"${r.name || ""}","${r.email || ""}",${r.progressPercent},${r.completed},${quizAvg},${graded}`;
        });
        return new NextResponse(header + lines.join("\n"), {
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="gradebook-${courseId}.csv"`,
          },
        });
      }

      return NextResponse.json({ rows });
    }

    return NextResponse.json({ error: "courseId or inbox=1 required" }, { status: 400 });
  } catch (err) {
    return jsonError(err);
  }
}
