import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Quiz } from "@/models/Quiz";
import { requireSession, jsonError, getSession } from "@/lib/auth";
import { PRIVILEGED_ROLES } from "@/lib/constants";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession();
    const { id } = await params;
    await connectDB();
    const quiz = await Quiz.findById(id).lean();
    if (!quiz) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const session = await getSession();
    const staff = session?.roles?.some((r) => PRIVILEGED_ROLES.includes(r));
    if (!staff) {
      const sanitized = {
        ...quiz,
        questions: quiz.questions.map(
          (q: {
            options: { text: string }[];
            [key: string]: unknown;
          }) => ({
            ...q,
            options: q.options.map((o: { text: string }) => ({ text: o.text })),
          })
        ),
      };
      return NextResponse.json(sanitized);
    }
    return NextResponse.json(quiz);
  } catch (err) {
    return jsonError(err);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession(PRIVILEGED_ROLES);
    const { id } = await params;
    await connectDB();
    const body = await req.json();
    const quiz = await Quiz.findByIdAndUpdate(id, { $set: body }, { new: true });
    return NextResponse.json(quiz);
  } catch (err) {
    return jsonError(err);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession(PRIVILEGED_ROLES);
    const { id } = await params;
    await connectDB();
    await Quiz.findByIdAndDelete(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
