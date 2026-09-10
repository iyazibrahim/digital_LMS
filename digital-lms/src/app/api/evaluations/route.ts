import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireSession, jsonError, AuthError } from "@/lib/auth";
import { EvaluatorSlot, EvaluationRequest } from "@/models/Certificate";
import { Course } from "@/models/Course";
import { Enrollment } from "@/models/Enrollment";
import { issueCertificate } from "@/lib/progress";
import { STAFF_ROLES, PRIVILEGED_ROLES, hasRole } from "@/lib/constants";
import { parsePageParams } from "@/lib/paginate";

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    await connectDB();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "slots";
    const { page, pageSize, skip } = parsePageParams(searchParams);

    if (type === "requests") {
      const mine = searchParams.get("mine") === "1";
      const filter =
        hasRole(session.roles, STAFF_ROLES) && !mine ? {} : { userId: session.sub };
      const [requests, total] = await Promise.all([
        EvaluationRequest.find(filter)
          .populate("userId", "name email")
          .populate("courseId", "title")
          .populate("batchId", "title")
          .populate("slotId")
          .populate("evaluatedBy", "name")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(pageSize)
          .lean(),
        EvaluationRequest.countDocuments(filter),
      ]);
      return NextResponse.json({
        requests,
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      });
    }

    const openOnly = searchParams.get("open") === "1";
    const filter: Record<string, unknown> = {};
    if (openOnly) {
      filter.isBooked = false;
      filter.startAt = { $gte: new Date() };
    }
    if (searchParams.get("evaluatorId")) {
      filter.evaluatorId = searchParams.get("evaluatorId");
    } else if (
      hasRole(session.roles, ["evaluator"]) &&
      !hasRole(session.roles, ["admin"]) &&
      !openOnly
    ) {
      filter.evaluatorId = session.sub;
    }

    const [slots, total] = await Promise.all([
      EvaluatorSlot.find(filter)
        .populate("evaluatorId", "name email")
        .populate("bookedBy", "name email")
        .populate("courseId", "title")
        .sort({ startAt: 1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
      EvaluatorSlot.countDocuments(filter),
    ]);

    return NextResponse.json({
      slots,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    await connectDB();
    const body = await req.json();

    if (body.kind === "request" || body.kind === "book") {
      if (body.slotId) {
        const slot = await EvaluatorSlot.findById(body.slotId);
        if (!slot || slot.isBooked) throw new AuthError("Slot unavailable", 400);
        if (new Date(slot.startAt) < new Date()) {
          throw new AuthError("Slot already started", 400);
        }
        if (body.courseId) {
          const active = await EvaluationRequest.findOne({
            userId: session.sub,
            courseId: body.courseId,
            status: { $in: ["pending", "scheduled"] },
          });
          if (active) throw new AuthError("You already have an active booking for this course", 400);
        }
        slot.isBooked = true;
        slot.bookedBy = session.sub as never;
        await slot.save();
        const request = await EvaluationRequest.create({
          userId: session.sub,
          courseId: body.courseId || slot.courseId,
          batchId: body.batchId || slot.batchId,
          slotId: slot._id,
          notes: body.notes,
          status: "scheduled",
        });
        return NextResponse.json({ request, slot }, { status: 201 });
      }

      const request = await EvaluationRequest.create({
        userId: session.sub,
        courseId: body.courseId,
        batchId: body.batchId,
        notes: body.notes,
        status: "pending",
      });
      return NextResponse.json({ request }, { status: 201 });
    }

    if (!hasRole(session.roles, [...PRIVILEGED_ROLES, "evaluator"])) {
      throw new AuthError("Forbidden", 403);
    }
    if (!body.startAt || !body.endAt) {
      throw new AuthError("startAt and endAt are required", 400);
    }

    const startAt = new Date(body.startAt);
    const endAt = new Date(body.endAt);
    if (endAt <= startAt) throw new AuthError("endAt must be after startAt", 400);

    const evaluatorId = body.evaluatorId || session.sub;
    const overlap = await EvaluatorSlot.findOne({
      evaluatorId,
      startAt: { $lt: endAt },
      endAt: { $gt: startAt },
    });
    if (overlap) throw new AuthError("Overlapping slot for this evaluator", 400);

    const slot = await EvaluatorSlot.create({
      evaluatorId,
      startAt,
      endAt,
      courseId: body.courseId || undefined,
      batchId: body.batchId || undefined,
      notes: body.notes,
    });

    return NextResponse.json({ slot }, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireSession();
    await connectDB();
    const body = await req.json();

    // Student cancel
    if (body.cancelRequestId) {
      const request = await EvaluationRequest.findById(body.cancelRequestId);
      if (!request) throw new AuthError("Request not found", 404);
      if (String(request.userId) !== session.sub && !hasRole(session.roles, STAFF_ROLES)) {
        throw new AuthError("Forbidden", 403);
      }
      if (!["pending", "scheduled"].includes(request.status)) {
        throw new AuthError("Cannot cancel this booking", 400);
      }
      if (request.slotId) {
        const slot = await EvaluatorSlot.findById(request.slotId);
        if (slot) {
          if (new Date(slot.startAt) <= new Date() && String(request.userId) === session.sub) {
            throw new AuthError("Cannot cancel after the slot has started", 400);
          }
          slot.isBooked = false;
          slot.bookedBy = undefined;
          await slot.save();
        }
      }
      request.status = "cancelled";
      await request.save();
      return NextResponse.json({ request });
    }

    // Staff updates
    if (!hasRole(session.roles, STAFF_ROLES)) {
      throw new AuthError("Forbidden", 403);
    }

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

      if (body.status === "passed" && request.courseId) {
        const course = await Course.findById(request.courseId);
        if (course?.enableCertification) {
          const cert = await issueCertificate(String(request.userId), String(request.courseId));
          await Enrollment.findOneAndUpdate(
            { userId: request.userId, courseId: request.courseId },
            { $set: { certificateId: cert._id } }
          );
        }
      }

      return NextResponse.json({ request });
    }

    if (body.slotId) {
      const slot = await EvaluatorSlot.findById(body.slotId);
      if (!slot) throw new AuthError("Slot not found", 404);
      if (body.startAt) slot.startAt = new Date(body.startAt);
      if (body.endAt) slot.endAt = new Date(body.endAt);
      if (body.notes !== undefined) slot.notes = body.notes;
      if (body.isBooked !== undefined) slot.isBooked = body.isBooked;
      if (body.courseId !== undefined) slot.courseId = body.courseId;
      await slot.save();
      return NextResponse.json({ slot });
    }

    throw new AuthError("requestId or slotId required", 400);
  } catch (err) {
    return jsonError(err);
  }
}
