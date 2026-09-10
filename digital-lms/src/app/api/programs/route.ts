import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Program } from "@/models/Program";
import { getSession, requireSession, jsonError } from "@/lib/auth";
import { PRIVILEGED_ROLES } from "@/lib/constants";
import { slugify } from "@/lib/utils";

export async function GET() {
  try {
    await connectDB();
    const session = await getSession();
    const staff = session?.roles?.some((r) => PRIVILEGED_ROLES.includes(r));
    const programs = await Program.find(staff ? {} : { published: true })
      .populate("courseIds", "title slug")
      .sort({ updatedAt: -1 })
      .lean();
    return NextResponse.json({ programs });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession(PRIVILEGED_ROLES);
    await connectDB();
    const body = await req.json();
    const base = slugify(body.title || "program");
    let slug = base;
    let i = 1;
    while (await Program.findOne({ slug })) slug = `${base}-${i++}`;
    const program = await Program.create({ ...body, slug, createdBy: session.sub });
    return NextResponse.json(program, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
