import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Batch } from "@/models/Batch";
import { requireSession, jsonError } from "@/lib/auth";
import { PRIVILEGED_ROLES, STAFF_ROLES } from "@/lib/constants";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    await requireSession(STAFF_ROLES);
    const { id } = await params;
    const liveClassId = req.nextUrl.searchParams.get("liveClassId");
    await connectDB();
    const batch = await Batch.findById(id).lean();
    if (!batch) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const live = (batch.liveClasses || []).find((l) => String(l._id) === liveClassId);
    if (!live) return NextResponse.json({ error: "Live class not found" }, { status: 404 });
    return NextResponse.json({
      attendance: live.attendance || [],
      attendees: live.attendees || [],
    });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await requireSession(PRIVILEGED_ROLES);
    const { id } = await params;
    const body = z
      .object({
        liveClassId: z.string(),
        records: z.array(
          z.object({
            userId: z.string(),
            status: z.enum(["present", "absent", "late", "excused"]),
          })
        ),
        export: z.boolean().optional(),
      })
      .parse(await req.json());

    await connectDB();
    const batch = await Batch.findById(id);
    if (!batch) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const live = batch.liveClasses.id(body.liveClassId);
    if (!live) return NextResponse.json({ error: "Live class not found" }, { status: 404 });

    if (!live.attendance) live.attendance = [] as never;
    for (const rec of body.records) {
      const idx = live.attendance.findIndex((a) => String(a.userId) === rec.userId);
      const entry = {
        userId: rec.userId as never,
        status: rec.status,
        markedAt: new Date(),
        markedBy: session.sub as never,
      };
      if (idx >= 0) live.attendance[idx] = entry as never;
      else live.attendance.push(entry as never);

      // Keep legacy attendees list in sync for "present"
      const attIdx = live.attendees.findIndex((u) => String(u) === rec.userId);
      if (rec.status === "present" || rec.status === "late") {
        if (attIdx < 0) live.attendees.push(rec.userId as never);
      } else if (attIdx >= 0) {
        live.attendees.splice(attIdx, 1);
      }
    }
    await batch.save();

    if (body.export) {
      const header = "userId,status,markedAt\n";
      const lines = (live.attendance || []).map(
        (a) => `${a.userId},${a.status},${a.markedAt?.toISOString?.() || ""}`
      );
      return new NextResponse(header + lines.join("\n"), {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="attendance-${body.liveClassId}.csv"`,
        },
      });
    }

    return NextResponse.json({ attendance: live.attendance });
  } catch (err) {
    return jsonError(err);
  }
}
