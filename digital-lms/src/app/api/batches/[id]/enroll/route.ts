import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Batch, BatchEnrollment } from "@/models/Batch";
import { Enrollment } from "@/models/Enrollment";
import { requireSession, jsonError } from "@/lib/auth";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;
    await connectDB();
    const batch = await Batch.findById(id);
    if (!batch || !batch.published) {
      return NextResponse.json({ error: "Batch not available" }, { status: 404 });
    }
    if (batch.paid) {
      return NextResponse.json({ error: "Payment required" }, { status: 402 });
    }
    if (batch.enrolledCount >= batch.seatCount) {
      return NextResponse.json({ error: "Batch is full" }, { status: 400 });
    }
    let be = await BatchEnrollment.findOne({ batchId: id, userId: session.sub });
    if (!be) {
      be = await BatchEnrollment.create({ batchId: id, userId: session.sub });
      batch.enrolledCount += 1;
      await batch.save();
      for (const courseId of batch.courseIds) {
        const exists = await Enrollment.findOne({ userId: session.sub, courseId });
        if (!exists) {
          await Enrollment.create({
            userId: session.sub,
            courseId,
            source: "batch",
          });
        }
      }
    }
    return NextResponse.json(be);
  } catch (err) {
    return jsonError(err);
  }
}
