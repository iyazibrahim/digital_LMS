import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Course } from "@/models/Course";
import { Enrollment } from "@/models/Enrollment";
import { requireSession, jsonError } from "@/lib/auth";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;
    await connectDB();
    const course = await Course.findById(id);
    if (!course || !course.published) {
      return NextResponse.json({ error: "Course not available" }, { status: 404 });
    }
    if (course.paid) {
      return NextResponse.json(
        { error: "This course requires payment. Use checkout." },
        { status: 402 }
      );
    }
    let enrollment = await Enrollment.findOne({ userId: session.sub, courseId: id });
    if (!enrollment) {
      enrollment = await Enrollment.create({
        userId: session.sub,
        courseId: id,
        source: "self",
      });
      course.enrolledCount += 1;
      await course.save();
    }
    return NextResponse.json(enrollment);
  } catch (err) {
    return jsonError(err);
  }
}
