import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { EvaluatorSlot } from "@/models/Certificate";
import { requireSession, jsonError } from "@/lib/auth";
import { STAFF_ROLES } from "@/lib/constants";

export async function GET() {
  try {
    await requireSession();
    await connectDB();
    const slots = await EvaluatorSlot.find()
      .populate("evaluatorId", "name email")
      .populate("bookedBy", "name email")
      .sort({ startAt: 1 })
      .lean();
    return NextResponse.json({ slots });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession(STAFF_ROLES);
    await connectDB();
    const body = await req.json();
    const slot = await EvaluatorSlot.create({
      evaluatorId: body.evaluatorId || session.sub,
      startAt: body.startAt,
      endAt: body.endAt,
      courseId: body.courseId,
      batchId: body.batchId,
      notes: body.notes,
    });
    return NextResponse.json(slot, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
