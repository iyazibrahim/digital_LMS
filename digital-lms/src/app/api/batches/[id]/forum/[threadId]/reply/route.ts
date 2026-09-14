import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { BatchEnrollment } from "@/models/Batch";
import { BatchForumThread } from "@/models/BatchForum";
import { requireSession, jsonError } from "@/lib/auth";
import { STAFF_ROLES } from "@/lib/constants";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; threadId: string }> }
) {
  try {
    const session = await requireSession();
    const { id, threadId } = await params;
    const body = z.object({ body: z.string().min(1) }).parse(await req.json());
    await connectDB();

    const staff = session.roles.some((r) => STAFF_ROLES.includes(r as never));
    if (!staff) {
      const en = await BatchEnrollment.findOne({
        batchId: id,
        userId: session.sub,
        status: { $in: ["active", "completed"] },
      });
      if (!en) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const thread = await BatchForumThread.findOne({ _id: threadId, batchId: id });
    if (!thread) return NextResponse.json({ error: "Not found" }, { status: 404 });
    thread.replies.push({
      userId: session.sub as never,
      body: body.body,
    } as never);
    await thread.save();
    return NextResponse.json(thread);
  } catch (err) {
    return jsonError(err);
  }
}
