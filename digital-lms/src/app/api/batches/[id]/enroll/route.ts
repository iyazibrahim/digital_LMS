import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Batch, BatchEnrollment } from "@/models/Batch";
import { Enrollment } from "@/models/Enrollment";
import { BatchApplication } from "@/models/BatchApplication";
import { requireSession, jsonError } from "@/lib/auth";
import { notifyUser } from "@/lib/notify";

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
    if (batch.requireApplication) {
      const app = await BatchApplication.findOne({
        batchId: id,
        userId: session.sub,
        status: "accepted",
      });
      if (!app) {
        return NextResponse.json(
          {
            error: "This cohort requires an approved application before enrollment.",
            requireApplication: true,
          },
          { status: 403 }
        );
      }
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
      await notifyUser({
        userId: session.sub,
        type: "enrollment",
        title: `Enrolled in ${batch.title}`,
        body: "Your cohort seat is confirmed.",
        href: `/batches/${batch.slug}`,
        email: true,
      });
    }
    return NextResponse.json(be);
  } catch (err) {
    return jsonError(err);
  }
}
