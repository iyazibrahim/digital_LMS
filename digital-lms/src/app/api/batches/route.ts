import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Batch } from "@/models/Batch";
import { getSession, requireSession, jsonError } from "@/lib/auth";
import { PRIVILEGED_ROLES } from "@/lib/constants";
import { slugify } from "@/lib/utils";

export async function GET() {
  try {
    await connectDB();
    const session = await getSession();
    const staff = session?.roles?.some((r) => PRIVILEGED_ROLES.includes(r));
    const batches = await Batch.find(staff ? {} : { published: true })
      .sort({ startDate: -1 })
      .lean();
    return NextResponse.json({ batches });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession(PRIVILEGED_ROLES);
    await connectDB();
    const body = await req.json();
    const base = slugify(body.title || "batch");
    let slug = base;
    let i = 1;
    while (await Batch.findOne({ slug })) slug = `${base}-${i++}`;
    const batch = await Batch.create({
      ...body,
      slug,
      createdBy: session.sub,
      instructors: body.instructors || [session.sub],
    });
    return NextResponse.json(batch, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
