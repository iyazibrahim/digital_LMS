import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { EvaluatorSlot, EvaluationRequest } from "@/models/Certificate";
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
    const slot = await EvaluatorSlot.findById(id);
    if (!slot || slot.isBooked) {
      return NextResponse.json({ error: "Slot unavailable" }, { status: 400 });
    }
    slot.isBooked = true;
    slot.bookedBy = session.sub as never;
    await slot.save();
    const request = await EvaluationRequest.create({
      userId: session.sub,
      slotId: slot._id,
      courseId: body.courseId || slot.courseId,
      batchId: body.batchId || slot.batchId,
      status: "scheduled",
    });
    return NextResponse.json({ slot, request });
  } catch (err) {
    return jsonError(err);
  }
}
