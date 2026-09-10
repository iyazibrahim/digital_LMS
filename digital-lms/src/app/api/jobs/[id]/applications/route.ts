import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireSession, jsonError, AuthError } from "@/lib/auth";
import { Job, JobApplication } from "@/models/Job";
import { STAFF_ROLES } from "@/lib/constants";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await requireSession(STAFF_ROLES);
    await connectDB();
    const { id } = await params;

    const job = await Job.findById(id).lean();
    if (!job) throw new AuthError("Job not found", 404);

    const applications = await JobApplication.find({ jobId: id })
      .populate("userId", "name email headline phone")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ applications });
  } catch (err) {
    return jsonError(err);
  }
}
