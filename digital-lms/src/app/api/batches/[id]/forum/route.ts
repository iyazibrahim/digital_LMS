import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Batch, BatchEnrollment } from "@/models/Batch";
import { BatchForumThread } from "@/models/BatchForum";
import { requireSession, jsonError } from "@/lib/auth";
import { STAFF_ROLES } from "@/lib/constants";

type Params = { params: Promise<{ id: string }> };

async function canAccessBatch(userId: string, roles: string[], batchId: string) {
  if (roles.some((r) => STAFF_ROLES.includes(r as never))) return true;
  const en = await BatchEnrollment.findOne({
    batchId,
    userId,
    status: { $in: ["active", "completed"] },
  });
  return !!en;
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireSession();
    const { id } = await params;
    await connectDB();
    if (!(await canAccessBatch(session.sub, session.roles, id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const threads = await BatchForumThread.find({ batchId: id })
      .populate("userId", "name")
      .populate("replies.userId", "name")
      .sort({ pinned: -1, updatedAt: -1 })
      .lean();
    return NextResponse.json({ threads });
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
        title: z.string().min(3),
        body: z.string().min(1),
      })
      .parse(await req.json());

    await connectDB();
    const batch = await Batch.findById(id);
    if (!batch) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!(await canAccessBatch(session.sub, session.roles, id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const thread = await BatchForumThread.create({
      batchId: id,
      userId: session.sub,
      title: body.title,
      body: body.body,
    });
    return NextResponse.json(thread, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
