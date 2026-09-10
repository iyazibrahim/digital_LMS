import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Assignment, AssignmentSubmission } from "@/models/Assignment";
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
    const assignment = await Assignment.findById(id);
    if (!assignment) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!body.fileUrl) {
      return NextResponse.json({ error: "fileUrl required" }, { status: 400 });
    }
    const submission = await AssignmentSubmission.create({
      assignmentId: id,
      userId: session.sub,
      courseId: body.courseId,
      lessonId: body.lessonId,
      fileUrl: body.fileUrl,
      fileName: body.fileName || "submission",
      notes: body.notes,
      status: "submitted",
    });
    return NextResponse.json(submission, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
