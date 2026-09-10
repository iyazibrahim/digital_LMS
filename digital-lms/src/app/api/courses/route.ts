import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Course } from "@/models/Course";
import { getSession, requireSession, jsonError } from "@/lib/auth";
import { PRIVILEGED_ROLES } from "@/lib/constants";
import { slugify } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const session = await getSession();
    const staff = session?.roles?.some((r) => PRIVILEGED_ROLES.includes(r));
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");
    const filter: Record<string, unknown> = staff ? {} : { published: true };
    if (q) filter.$text = { $search: q };
    const courses = await Course.find(filter).sort({ updatedAt: -1 }).lean();
    return NextResponse.json({ courses });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession(PRIVILEGED_ROLES);
    await connectDB();
    const body = await req.json();
    const base = slugify(body.title || "course");
    let slug = base;
    let i = 1;
    while (await Course.findOne({ slug })) {
      slug = `${base}-${i++}`;
    }
    const course = await Course.create({
      title: body.title,
      slug,
      shortIntroduction: body.shortIntroduction,
      description: body.description,
      category: body.category,
      tags: body.tags || [],
      paid: !!body.paid,
      price: body.price || 0,
      currency: body.currency || "MYR",
      enableCertification: body.enableCertification !== false,
      published: !!body.published,
      publishedAt: body.published ? new Date() : undefined,
      instructors: body.instructors || [session.sub],
      createdBy: session.sub,
      chapters: body.chapters || [],
    });
    return NextResponse.json(course, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
