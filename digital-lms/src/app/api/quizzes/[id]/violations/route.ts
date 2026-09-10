import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { QuizViolation } from "@/models/Quiz";
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
    const violation = await QuizViolation.create({
      quizId: id,
      userId: session.sub,
      submissionId: body.submissionId,
      type: body.type || "other",
      note: body.note,
      snapshotUrl: body.snapshotUrl,
    });
    return NextResponse.json(violation, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
