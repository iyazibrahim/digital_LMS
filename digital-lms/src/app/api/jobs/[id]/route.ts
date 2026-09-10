import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Job } from "@/models/Job";
import { requireSession, jsonError } from "@/lib/auth";
import { PRIVILEGED_ROLES } from "@/lib/constants";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();
    const job = await Job.findById(id).lean();
    if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(job);
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
    const job = await Job.findByIdAndUpdate(id, { $set: body }, { new: true });
    return NextResponse.json(job);
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
    await Job.findByIdAndDelete(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
