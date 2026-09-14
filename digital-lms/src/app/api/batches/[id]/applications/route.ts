import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Batch, BatchEnrollment } from "@/models/Batch";
import { BatchApplication } from "@/models/BatchApplication";
import { Enrollment } from "@/models/Enrollment";
import { requireSession, jsonError } from "@/lib/auth";
import { PRIVILEGED_ROLES, STAFF_ROLES } from "@/lib/constants";
import { notifyUser } from "@/lib/notify";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireSession();
    const { id } = await params;
    await connectDB();
    const staff = session.roles.some((r) => STAFF_ROLES.includes(r as never));
    if (staff) {
      const apps = await BatchApplication.find({ batchId: id })
        .populate("userId", "name email")
        .sort({ createdAt: -1 })
        .lean();
      return NextResponse.json({ applications: apps });
    }
    const mine = await BatchApplication.findOne({ batchId: id, userId: session.sub }).lean();
    return NextResponse.json({ application: mine });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const body = z
      .object({
        motivation: z.string().min(20),
        startupName: z.string().optional(),
        startupStage: z.string().optional(),
        teamSize: z.number().optional(),
      })
      .parse(await req.json());

    await connectDB();
    const batch = await Batch.findById(id);
    if (!batch || !batch.published) {
      return NextResponse.json({ error: "Batch not available" }, { status: 404 });
    }

    let app = await BatchApplication.findOne({ batchId: id, userId: session.sub });
    if (app) {
      if (app.status === "rejected") {
        app.motivation = body.motivation;
        app.startupName = body.startupName;
        app.startupStage = body.startupStage;
        app.teamSize = body.teamSize;
        app.status = "pending";
        await app.save();
      }
      return NextResponse.json(app);
    }

    app = await BatchApplication.create({
      batchId: id,
      userId: session.sub,
      ...body,
    });
    return NextResponse.json(app, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await requireSession(PRIVILEGED_ROLES);
    const { id } = await params;
    const body = z
      .object({
        applicationId: z.string(),
        status: z.enum(["accepted", "waitlisted", "rejected"]),
        staffNotes: z.string().optional(),
      })
      .parse(await req.json());

    await connectDB();
    const app = await BatchApplication.findOne({ _id: body.applicationId, batchId: id });
    if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

    app.status = body.status;
    app.staffNotes = body.staffNotes;
    app.reviewedBy = session.sub as never;
    app.reviewedAt = new Date();
    await app.save();

    const batch = await Batch.findById(id);
    if (body.status === "accepted" && batch) {
      let be = await BatchEnrollment.findOne({ batchId: id, userId: app.userId });
      if (!be && batch.enrolledCount < batch.seatCount) {
        be = await BatchEnrollment.create({ batchId: id, userId: app.userId });
        batch.enrolledCount += 1;
        await batch.save();
        for (const courseId of batch.courseIds) {
          const exists = await Enrollment.findOne({ userId: app.userId, courseId });
          if (!exists) {
            await Enrollment.create({
              userId: app.userId,
              courseId,
              source: "batch",
            });
          }
        }
      }
      await notifyUser({
        userId: app.userId,
        type: "enrollment",
        title: `Application accepted: ${batch.title}`,
        body: "You are enrolled in the cohort.",
        href: `/batches/${batch.slug}`,
        email: true,
      });
    } else if (batch) {
      await notifyUser({
        userId: app.userId,
        type: "general",
        title: `Application ${body.status}: ${batch.title}`,
        body: body.staffNotes || `Your cohort application was ${body.status}.`,
        href: `/batches/${batch.slug}`,
        email: true,
      });
    }

    return NextResponse.json(app);
  } catch (err) {
    return jsonError(err);
  }
}
