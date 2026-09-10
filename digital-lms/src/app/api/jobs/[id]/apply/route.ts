import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Job, JobApplication } from "@/models/Job";
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
    const job = await Job.findById(id);
    if (!job || job.status !== "open") {
      return NextResponse.json({ error: "Job not open" }, { status: 404 });
    }
    const existing = await JobApplication.findOne({ jobId: id, userId: session.sub });
    if (existing) return NextResponse.json(existing);
    const app = await JobApplication.create({
      jobId: id,
      userId: session.sub,
      resumeUrl: body.resumeUrl,
      coverLetter: body.coverLetter,
    });
    return NextResponse.json(app, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession(["admin", "instructor"]);
    const { id } = await params;
    await connectDB();
    const applications = await JobApplication.find({ jobId: id })
      .populate("userId", "name email")
      .lean();
    return NextResponse.json({ applications });
  } catch (err) {
    return jsonError(err);
  }
}
