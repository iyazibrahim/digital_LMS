import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Assignment } from "@/models/Assignment";
import { requireSession, jsonError } from "@/lib/auth";
import { PRIVILEGED_ROLES } from "@/lib/constants";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession();
    const { id } = await params;
    await connectDB();
    const assignment = await Assignment.findById(id).lean();
    if (!assignment) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(assignment);
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
    const assignment = await Assignment.findByIdAndUpdate(id, { $set: body }, { new: true });
    return NextResponse.json(assignment);
  } catch (err) {
    return jsonError(err);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession(PRIVILEGED_ROLES);
    const { id } = await params;
    await connectDB();
    await Assignment.findByIdAndDelete(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
