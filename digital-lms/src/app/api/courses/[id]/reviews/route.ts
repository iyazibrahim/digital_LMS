import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Course } from "@/models/Course";
import { CourseReview } from "@/models/Enrollment";
import { requireSession, jsonError } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();
    const reviews = await CourseReview.find({ courseId: id })
      .populate("userId", "name")
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json({ reviews });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const body = await req.json();
    await connectDB();
    const review = await CourseReview.findOneAndUpdate(
      { userId: session.sub, courseId: id },
      {
        $set: {
          rating: body.rating,
          comment: body.comment,
          userId: session.sub,
          courseId: id,
        },
      },
      { upsert: true, new: true }
    );
    const agg = await CourseReview.aggregate([
      { $match: { courseId: review.courseId } },
      { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]);
    if (agg[0]) {
      await Course.findByIdAndUpdate(id, {
        ratingAvg: Math.round(agg[0].avg * 10) / 10,
        ratingCount: agg[0].count,
      });
    }
    return NextResponse.json(review);
  } catch (err) {
    return jsonError(err);
  }
}
