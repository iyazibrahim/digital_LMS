import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { AssignmentSubmission } from "@/models/Assignment";
import { requireSession, jsonError } from "@/lib/auth";
import { STAFF_ROLES } from "@/lib/constants";
import { notifyUser } from "@/lib/notify";

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
    ).populate("assignmentId", "title");
    if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const title =
      (submission.assignmentId as unknown as { title?: string })?.title || "Assignment";
    await notifyUser({
      userId: submission.userId,
      type: "assignment_graded",
      title: `Graded: ${title}`,
      body: `Status: ${submission.status}${
        submission.grade != null ? ` · Grade: ${submission.grade}` : ""
      }${submission.feedback ? ` — ${submission.feedback}` : ""}`,
      href: "/dashboard",
      email: true,
    });

    return NextResponse.json(submission);
  } catch (err) {
    return jsonError(err);
  }
}
