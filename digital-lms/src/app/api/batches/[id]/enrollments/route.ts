import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireSession, jsonError } from "@/lib/auth";
import { BatchEnrollment } from "@/models/Batch";
import { STAFF_ROLES } from "@/lib/constants";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await requireSession(STAFF_ROLES);
    await connectDB();
    const { id } = await params;

    const enrollments = await BatchEnrollment.find({ batchId: id })
      .populate("userId", "name email phone")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ enrollments });
  } catch (err) {
    return jsonError(err);
  }
}
