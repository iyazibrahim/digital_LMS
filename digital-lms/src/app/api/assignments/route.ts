import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Assignment } from "@/models/Assignment";
import { requireSession, jsonError, getSession, AuthError } from "@/lib/auth";
import { PRIVILEGED_ROLES, isStaff } from "@/lib/constants";

export async function GET() {
  try {
    await connectDB();
    const session = await getSession();
    if (!session || !isStaff(session.roles)) {
      throw new AuthError("Forbidden", 403);
    }

    const assignments = await Assignment.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ assignments });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession(PRIVILEGED_ROLES);
    await connectDB();
    const body = await req.json();

    if (!body.title?.trim()) {
      throw new AuthError("Title is required", 400);
    }

    const assignment = await Assignment.create({
      title: body.title.trim(),
      description: body.description,
      allowedFileTypes: body.allowedFileTypes,
      maxFileSizeMb: body.maxFileSizeMb,
      createdBy: session.sub,
    });

    return NextResponse.json({ assignment }, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
