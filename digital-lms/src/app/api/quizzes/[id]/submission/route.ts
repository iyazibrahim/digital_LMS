import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { QuizSubmission } from "@/models/Quiz";
import { requireSession, jsonError } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Latest submission for the current user on this quiz (optionally scoped to lesson/course). */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;
    await connectDB();

    const courseId = req.nextUrl.searchParams.get("courseId");
    const lessonId = req.nextUrl.searchParams.get("lessonId");
    const filter: Record<string, unknown> = {
      quizId: id,
      userId: session.sub,
    };
    if (courseId) filter.courseId = courseId;
    if (lessonId) filter.lessonId = lessonId;

    let submission = await QuizSubmission.findOne(filter).sort({ submittedAt: -1 }).lean();
    // Fallback: any attempt on this quiz by the user
    if (!submission && (courseId || lessonId)) {
      submission = await QuizSubmission.findOne({
        quizId: id,
        userId: session.sub,
      })
        .sort({ submittedAt: -1 })
        .lean();
    }

    if (!submission) {
      return NextResponse.json({ submission: null });
    }

    return NextResponse.json({
      submission: {
        _id: String(submission._id),
        score: submission.score,
        maxScore: submission.maxScore,
        percent: submission.percent,
        passed: submission.passed,
        status: submission.status || (submission.passed ? "auto_graded" : "auto_graded"),
        answers: submission.answers,
        submittedAt: submission.submittedAt,
        feedback: submission.feedback,
      },
    });
  } catch (err) {
    return jsonError(err);
  }
}
