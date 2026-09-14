import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Quiz, QuizSubmission } from "@/models/Quiz";
import { requireSession, jsonError } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const body = await req.json();
    await connectDB();
    const quiz = await Quiz.findById(id);
    if (!quiz) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (quiz.dueAt && new Date() > new Date(quiz.dueAt)) {
      return NextResponse.json({ error: "Quiz deadline has passed" }, { status: 400 });
    }

    let score = 0;
    let maxScore = 0;
    let hasOpenPending = false;
    const graded = quiz.questions.map(
      (q: {
        _id: unknown;
        points: number;
        type: string;
        options: { isCorrect?: boolean }[];
      }) => {
        maxScore += q.points;
        const ans = (body.answers || []).find(
          (a: { questionId: string }) => String(a.questionId) === String(q._id)
        );
        let pointsAwarded = 0;
        let isCorrect: boolean | undefined = false;
        if (q.type === "open") {
          const text = (ans?.openAnswer || "").trim();
          // Open answers need instructor review — do not auto-pass
          hasOpenPending = true;
          isCorrect = undefined;
          pointsAwarded = 0;
          if (!text) {
            isCorrect = false;
          }
        } else {
          const selected: number[] = ans?.selectedOptionIndexes || [];
          const correct = q.options
            .map((o: { isCorrect?: boolean }, i: number) => (o.isCorrect ? i : -1))
            .filter((i: number) => i >= 0)
            .sort();
          const sel = [...selected].sort();
          isCorrect =
            correct.length === sel.length &&
            correct.every((v: number, i: number) => v === sel[i]);
          pointsAwarded = isCorrect ? q.points : 0;
        }
        score += pointsAwarded;
        return {
          questionId: q._id,
          selectedOptionIndexes: ans?.selectedOptionIndexes || [],
          openAnswer: ans?.openAnswer,
          isCorrect,
          pointsAwarded,
        };
      }
    );

    const percent = maxScore ? Math.round((score / maxScore) * 100) : 0;
    const status = hasOpenPending ? "pending_review" : "auto_graded";
    const passed = hasOpenPending ? false : percent >= quiz.passingScore;

    const submission = await QuizSubmission.create({
      quizId: quiz._id,
      userId: session.sub,
      courseId: body.courseId,
      lessonId: body.lessonId,
      answers: graded,
      score,
      maxScore,
      percent,
      passed,
      status,
      violationCount: body.violationCount || 0,
      autoSubmitted: !!body.autoSubmitted,
      submittedAt: new Date(),
    });

    return NextResponse.json({
      ...submission.toObject(),
      percent,
      passed,
      score,
      maxScore,
      status,
      message: hasOpenPending
        ? "Submitted — open answers await instructor review."
        : undefined,
    });
  } catch (err) {
    return jsonError(err);
  }
}
