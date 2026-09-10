import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Batch } from "@/models/Batch";
import { requireSession, jsonError } from "@/lib/auth";
import { PRIVILEGED_ROLES } from "@/lib/constants";
import { createZoomMeeting } from "@/lib/zoom";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession(PRIVILEGED_ROLES);
    const { id } = await params;
    const body = await req.json();
    await connectDB();
    const batch = await Batch.findById(id);
    if (!batch) return NextResponse.json({ error: "Not found" }, { status: 404 });

    let meetingUrl = body.meetingUrl;
    let zoomMeetingId = body.zoomMeetingId;
    let provider = body.provider || "manual";

    if (provider === "zoom" && !meetingUrl) {
      const zoom = await createZoomMeeting({
        topic: body.title,
        startAt: new Date(body.startAt),
        durationMinutes: body.durationMinutes || 60,
      });
      if (zoom) {
        meetingUrl = zoom.joinUrl;
        zoomMeetingId = zoom.id;
      } else {
        provider = "manual";
      }
    }

    batch.liveClasses.push({
      title: body.title,
      description: body.description,
      startAt: new Date(body.startAt),
      durationMinutes: body.durationMinutes || 60,
      meetingUrl,
      zoomMeetingId,
      provider,
      attendees: [],
      createdBy: session.sub as never,
    } as never);
    await batch.save();
    return NextResponse.json(batch);
  } catch (err) {
    return jsonError(err);
  }
}
