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

    let score = 0;
    let maxScore = 0;
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
        let isCorrect = false;
        if (q.type === "open") {
          const text = (ans?.openAnswer || "").trim();
          isCorrect = text.length > 0;
          pointsAwarded = isCorrect ? q.points : 0;
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
    const passed = percent >= quiz.passingScore;

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
    });
  } catch (err) {
    return jsonError(err);
  }
}
