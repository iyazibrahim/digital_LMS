import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { AssignmentSubmission } from "@/models/Assignment";
import { requireSession, jsonError } from "@/lib/auth";
import { STAFF_ROLES } from "@/lib/constants";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession(STAFF_ROLES);
    const { id } = await params;
    const body = await req.json();
    await connectDB();
    const submission = await AssignmentSubmission.findByIdAndUpdate(
      id,
      {
        $set: {
          status: body.status || "passed",
          grade: body.grade,
          feedback: body.feedback,
          gradedBy: session.sub,
          gradedAt: new Date(),
        },
      },
      { new: true }
    );
    return NextResponse.json(submission);
  } catch (err) {
    return jsonError(err);
  }
}
