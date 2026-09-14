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
    const { assertProgramOrder } = await import("@/lib/program-order");
    const order = await assertProgramOrder(session.sub, id);
    if (!order.ok) {
      return NextResponse.json({ error: order.message }, { status: 403 });
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
      const { notifyUser } = await import("@/lib/notify");
      await notifyUser({
        userId: session.sub,
        type: "enrollment",
        title: `Enrolled in ${course.title}`,
        body: "You can continue learning from My Learning.",
        href: `/courses/${course.slug}`,
        email: true,
      });
    }
    return NextResponse.json(enrollment);
  } catch (err) {
    return jsonError(err);
  }
}
