import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Batch } from "@/models/Batch";
import { requireSession, jsonError } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const { liveClassId } = await req.json();
    await connectDB();
    const batch = await Batch.findById(id);
    if (!batch) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const lc = batch.liveClasses.id(liveClassId);
    if (!lc) return NextResponse.json({ error: "Live class not found" }, { status: 404 });
    if (!lc.attendees.some((a: { toString(): string }) => String(a) === session.sub)) {
      lc.attendees.push(session.sub as never);
      await batch.save();
    }
    return NextResponse.json({ ok: true, attendees: lc.attendees.length });
  } catch (err) {
    return jsonError(err);
  }
}
