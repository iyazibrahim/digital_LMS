import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireSession, jsonError, AuthError } from "@/lib/auth";
import { EvaluatorSlot, EvaluationRequest } from "@/models/Certificate";
import { STAFF_ROLES, PRIVILEGED_ROLES, hasRole } from "@/lib/constants";

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    await connectDB();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "slots";

    if (type === "requests") {
      const filter =
        hasRole(session.roles, STAFF_ROLES) && !searchParams.get("mine")
          ? {}
          : { userId: session.sub };
      const requests = await EvaluationRequest.find(filter)
        .populate("userId", "name email")
        .populate("courseId", "title")
        .populate("batchId", "title")
        .populate("slotId")
        .populate("evaluatedBy", "name")
        .sort({ createdAt: -1 })
        .lean();
      return NextResponse.json({ requests });
    }

    const filter: Record<string, unknown> = {};
    if (searchParams.get("evaluatorId")) {
      filter.evaluatorId = searchParams.get("evaluatorId");
    } else if (hasRole(session.roles, ["evaluator"]) && !hasRole(session.roles, ["admin"])) {
      filter.evaluatorId = session.sub;
    }

    const slots = await EvaluatorSlot.find(filter)
      .populate("evaluatorId", "name email")
      .populate("bookedBy", "name email")
      .sort({ startAt: 1 })
      .lean();

    return NextResponse.json({ slots });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    await connectDB();
    const body = await req.json();

    if (body.kind === "request") {
      const request = await EvaluationRequest.create({
        userId: session.sub,
        courseId: body.courseId,
        batchId: body.batchId,
        slotId: body.slotId,
        notes: body.notes,
        status: body.slotId ? "scheduled" : "pending",
      });

      if (body.slotId) {
        const slot = await EvaluatorSlot.findById(body.slotId);
        if (slot && !slot.isBooked) {
          slot.isBooked = true;
          slot.bookedBy = session.sub as never;
          await slot.save();
        }
      }

      return NextResponse.json({ request }, { status: 201 });
    }

    if (!hasRole(session.roles, [...PRIVILEGED_ROLES, "evaluator"])) {
      throw new AuthError("Forbidden", 403);
    }
    if (!body.startAt || !body.endAt) {
      throw new AuthError("startAt and endAt are required", 400);
    }

    const slot = await EvaluatorSlot.create({
      evaluatorId: body.evaluatorId || session.sub,
      startAt: new Date(body.startAt),
      endAt: new Date(body.endAt),
      courseId: body.courseId,
      batchId: body.batchId,
      notes: body.notes,
    });

    return NextResponse.json({ slot }, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireSession(STAFF_ROLES);
    await connectDB();
    const body = await req.json();

    if (body.requestId) {
      const request = await EvaluationRequest.findById(body.requestId);
      if (!request) throw new AuthError("Request not found", 404);
      if (body.status) request.status = body.status;
      if (body.notes !== undefined) request.notes = body.notes;
      if (body.slotId !== undefined) request.slotId = body.slotId;
      if (["passed", "failed"].includes(body.status)) {
        request.evaluatedBy = session.sub as never;
        request.evaluatedAt = new Date();
      }
      await request.save();
      return NextResponse.json({ request });
    }

    if (body.slotId) {
      const slot = await EvaluatorSlot.findById(body.slotId);
      if (!slot) throw new AuthError("Slot not found", 404);
      if (body.startAt) slot.startAt = new Date(body.startAt);
      if (body.endAt) slot.endAt = new Date(body.endAt);
      if (body.notes !== undefined) slot.notes = body.notes;
      if (body.isBooked !== undefined) slot.isBooked = body.isBooked;
      await slot.save();
      return NextResponse.json({ slot });
    }

    throw new AuthError("requestId or slotId required", 400);
  } catch (err) {
    return jsonError(err);
  }
}
