import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Quiz } from "@/models/Quiz";
import { requireSession, jsonError, getSession } from "@/lib/auth";
import { PRIVILEGED_ROLES, STAFF_ROLES } from "@/lib/constants";

export async function GET() {
  try {
    await connectDB();
    const session = await getSession();
    if (!session?.roles?.some((r) => STAFF_ROLES.includes(r))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const quizzes = await Quiz.find().sort({ updatedAt: -1 }).lean();
    return NextResponse.json({ quizzes });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession(PRIVILEGED_ROLES);
    await connectDB();
    const body = await req.json();
    const quiz = await Quiz.create({ ...body, createdBy: session.sub });
    return NextResponse.json(quiz, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
