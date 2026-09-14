import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Quiz, QuizSubmission } from "@/models/Quiz";
import { requireSession, jsonError } from "@/lib/auth";
import { STAFF_ROLES } from "@/lib/constants";
import { notifyUser } from "@/lib/notify";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession(STAFF_ROLES);
    const { id } = await params;
    const body = await req.json();
    await connectDB();

    const submission = await QuizSubmission.findById(id);
    if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const percent =
      typeof body.percent === "number" ? body.percent : submission.percent;
    const passed = typeof body.passed === "boolean" ? body.passed : percent >= 70;
    submission.percent = percent;
    submission.passed = passed;
    submission.score = Math.round((percent / 100) * (submission.maxScore || 100));
    submission.status = "graded";
    submission.feedback = body.feedback;
    submission.gradedBy = session.sub as never;
    submission.gradedAt = new Date();
    await submission.save();

    const quiz = await Quiz.findById(submission.quizId).select("title").lean();
    await notifyUser({
      userId: submission.userId,
      type: "assignment_graded",
      title: `Quiz graded: ${quiz?.title || "Quiz"}`,
      body: passed
        ? `You passed with ${percent}%.`
        : `Score ${percent}%. ${body.feedback || ""}`,
      href: "/dashboard",
      email: true,
    });

    return NextResponse.json(submission);
  } catch (err) {
    return jsonError(err);
  }
}
