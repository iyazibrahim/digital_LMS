import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Course } from "@/models/Course";
import { requireSession, jsonError } from "@/lib/auth";
import { PRIVILEGED_ROLES } from "@/lib/constants";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession(PRIVILEGED_ROLES);
    const { id } = await params;
    const body = await req.json();
    await connectDB();
    const course = await Course.findById(id);
    if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });
    course.chapters.push({
      title: body.title || "New chapter",
      order: course.chapters.length,
      isScorm: !!body.isScorm,
      scormPackageUrl: body.scormPackageUrl,
      scormLaunchPath: body.scormLaunchPath,
      lessons: [],
    } as never);
    await course.save();
    return NextResponse.json(course);
  } catch (err) {
    return jsonError(err);
  }
}
