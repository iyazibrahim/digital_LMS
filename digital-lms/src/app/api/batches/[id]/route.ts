import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Batch } from "@/models/Batch";
import { requireSession, jsonError } from "@/lib/auth";
import { PRIVILEGED_ROLES } from "@/lib/constants";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();
    const batch = await Batch.findById(id)
      .populate("courseIds", "title slug")
      .populate("instructors", "name email")
      .lean();
    if (!batch) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(batch);
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
    await connectDB();
    const body = await req.json();
    const batch = await Batch.findByIdAndUpdate(id, { $set: body }, { new: true });
    return NextResponse.json(batch);
  } catch (err) {
    return jsonError(err);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession(["admin"]);
    const { id } = await params;
    await connectDB();
    await Batch.findByIdAndDelete(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
