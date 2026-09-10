import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { EvaluationRequest } from "@/models/Certificate";
import { requireSession, jsonError } from "@/lib/auth";
import { STAFF_ROLES } from "@/lib/constants";
import { issueCertificate } from "@/lib/progress";

export async function GET() {
  try {
    const session = await requireSession();
    await connectDB();
    const staff = session.roles.some((r) => STAFF_ROLES.includes(r));
    const filter = staff ? {} : { userId: session.sub };
    const requests = await EvaluationRequest.find(filter)
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json({ requests });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    await connectDB();
    const body = await req.json();

    // Staff grading existing request
    if (body.requestId && session.roles.some((r) => STAFF_ROLES.includes(r))) {
      const request = await EvaluationRequest.findById(body.requestId);
      if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });
      request.status = body.status || "passed";
      request.notes = body.notes;
      request.evaluatedBy = session.sub as never;
      request.evaluatedAt = new Date();
      await request.save();
      if (request.status === "passed" && request.courseId) {
        await issueCertificate(String(request.userId), String(request.courseId));
      }
      return NextResponse.json(request);
    }

    const request = await EvaluationRequest.create({
      userId: session.sub,
      courseId: body.courseId,
      batchId: body.batchId,
      notes: body.notes,
      status: "pending",
    });
    return NextResponse.json(request, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
