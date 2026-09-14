import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Batch, BatchEnrollment } from "@/models/Batch";
import { Enrollment } from "@/models/Enrollment";
import { User } from "@/models/User";
import { requireSession, jsonError, hashPassword } from "@/lib/auth";
import { PRIVILEGED_ROLES } from "@/lib/constants";
import { notifyUser } from "@/lib/notify";
import crypto from "crypto";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession(PRIVILEGED_ROLES);
    const { id } = await params;
    const body = z
      .object({
        emails: z.array(z.string().email()).min(1).max(100),
        createIfMissing: z.boolean().optional(),
      })
      .parse(await req.json());

    await connectDB();
    const batch = await Batch.findById(id);
    if (!batch) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const added: string[] = [];
    const skipped: string[] = [];
    const created: { email: string; temporaryPassword?: string }[] = [];

    for (const raw of body.emails) {
      const email = raw.toLowerCase().trim();
      let user = await User.findOne({ email });
      if (!user && body.createIfMissing) {
        const temporaryPassword = crypto.randomBytes(6).toString("base64url");
        user = await User.create({
          email,
          name: email.split("@")[0],
          passwordHash: await hashPassword(temporaryPassword),
          roles: ["student"],
          mustChangePassword: true,
        });
        created.push({ email, temporaryPassword });
      }
      if (!user) {
        skipped.push(email);
        continue;
      }

      const existing = await BatchEnrollment.findOne({ batchId: id, userId: user._id });
      if (existing) {
        if (existing.status === "dropped") {
          existing.status = "active";
          await existing.save();
          batch.enrolledCount += 1;
          added.push(email);
        } else {
          skipped.push(email);
        }
        continue;
      }

      if (batch.enrolledCount >= batch.seatCount) {
        skipped.push(email);
        continue;
      }

      await BatchEnrollment.create({ batchId: id, userId: user._id });
      batch.enrolledCount += 1;
      for (const courseId of batch.courseIds) {
        const en = await Enrollment.findOne({ userId: user._id, courseId });
        if (!en) {
          await Enrollment.create({ userId: user._id, courseId, source: "batch" });
        }
      }
      await notifyUser({
        userId: user._id,
        type: "enrollment",
        title: `Added to batch: ${batch.title}`,
        body: "You have been enrolled in a live cohort.",
        href: `/batches/${batch.slug}`,
        email: true,
      });
      added.push(email);
    }

    await batch.save();
    return NextResponse.json({ added, skipped, created });
  } catch (err) {
    return jsonError(err);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession(PRIVILEGED_ROLES);
    const { id } = await params;
    const body = z
      .object({
        userId: z.string(),
        status: z.enum(["active", "completed", "dropped", "waitlisted"]),
      })
      .parse(await req.json());

    await connectDB();
    const be = await BatchEnrollment.findOne({ batchId: id, userId: body.userId });
    if (!be) return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });

    const prev = be.status;
    // waitlisted stored as dropped + meta via status extension — map waitlisted to dropped with note
    if (body.status === "waitlisted") {
      be.status = "dropped";
    } else {
      be.status = body.status;
    }
    await be.save();

    if (prev === "active" && be.status !== "active") {
      await Batch.findByIdAndUpdate(id, { $inc: { enrolledCount: -1 } });
    } else if (prev !== "active" && be.status === "active") {
      await Batch.findByIdAndUpdate(id, { $inc: { enrolledCount: 1 } });
    }

    return NextResponse.json({ enrollment: be });
  } catch (err) {
    return jsonError(err);
  }
}
