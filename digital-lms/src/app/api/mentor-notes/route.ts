import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { MentorNote } from "@/models/MentorNote";
import { requireSession, jsonError } from "@/lib/auth";
import { STAFF_ROLES } from "@/lib/constants";

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    await connectDB();
    const menteeId = req.nextUrl.searchParams.get("menteeId");
    const batchId = req.nextUrl.searchParams.get("batchId");
    const staff = session.roles.some((r) => STAFF_ROLES.includes(r as never));

    const filter: Record<string, unknown> = {};
    if (staff) {
      if (menteeId) filter.menteeId = menteeId;
      else filter.mentorId = session.sub;
      if (batchId) filter.batchId = batchId;
    } else {
      filter.menteeId = session.sub;
      filter.visibility = "shared";
    }

    const notes = await MentorNote.find(filter)
      .populate("mentorId", "name")
      .populate("menteeId", "name email")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    return NextResponse.json({ notes });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession(STAFF_ROLES);
    await connectDB();
    const body = z
      .object({
        menteeId: z.string(),
        body: z.string().min(1),
        title: z.string().optional(),
        batchId: z.string().optional(),
        courseId: z.string().optional(),
        visibility: z.enum(["private", "shared"]).optional(),
      })
      .parse(await req.json());

    const note = await MentorNote.create({
      mentorId: session.sub,
      menteeId: body.menteeId,
      body: body.body,
      title: body.title,
      batchId: body.batchId,
      courseId: body.courseId,
      visibility: body.visibility || "private",
    });
    return NextResponse.json(note, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
