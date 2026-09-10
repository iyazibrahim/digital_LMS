import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { ProgrammingExercise } from "@/models/ProgrammingExercise";
import { requireSession, jsonError } from "@/lib/auth";
import { PRIVILEGED_ROLES } from "@/lib/constants";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession();
    const { id } = await params;
    await connectDB();
    const exercise = await ProgrammingExercise.findById(id).lean();
    if (!exercise) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(exercise);
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
    const exercise = await ProgrammingExercise.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true }
    );
    return NextResponse.json(exercise);
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
    await ProgrammingExercise.findByIdAndDelete(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
