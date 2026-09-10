import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { DiscussionThread } from "@/models/Discussion";
import { requireSession, jsonError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");
    const lessonId = searchParams.get("lessonId");
    const filter: Record<string, string> = {};
    if (courseId) filter.courseId = courseId;
    if (lessonId) filter.lessonId = lessonId;
    const threads = await DiscussionThread.find(filter)
      .populate("userId", "name")
      .populate("replies.userId", "name")
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json({ threads });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    await connectDB();
    const body = await req.json();
    const thread = await DiscussionThread.create({
      courseId: body.courseId,
      lessonId: body.lessonId,
      userId: session.sub,
      title: body.title,
      body: body.body,
    });
    const populated = await DiscussionThread.findById(thread._id)
      .populate("userId", "name")
      .lean();
    return NextResponse.json(populated, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
