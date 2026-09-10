import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { DiscussionThread } from "@/models/Discussion";
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
    const thread = await DiscussionThread.findById(id);
    if (!thread) return NextResponse.json({ error: "Not found" }, { status: 404 });
    thread.replies.push({
      userId: session.sub as never,
      body: body.body,
    } as never);
    await thread.save();
    const populated = await DiscussionThread.findById(id)
      .populate("userId", "name")
      .populate("replies.userId", "name")
      .lean();
    return NextResponse.json(populated);
  } catch (err) {
    return jsonError(err);
  }
}
