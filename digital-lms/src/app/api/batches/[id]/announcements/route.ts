import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Batch } from "@/models/Batch";
import { requireSession, jsonError } from "@/lib/auth";
import { PRIVILEGED_ROLES } from "@/lib/constants";

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
    batch.announcements.unshift({
      title: body.title,
      body: body.body,
      createdBy: session.sub as never,
    } as never);
    await batch.save();
    return NextResponse.json(batch);
  } catch (err) {
    return jsonError(err);
  }
}
