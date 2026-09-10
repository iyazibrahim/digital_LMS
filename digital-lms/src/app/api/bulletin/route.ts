import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Bulletin } from "@/models/Bulletin";
import { getSession, requireSession, jsonError } from "@/lib/auth";
import { PRIVILEGED_ROLES } from "@/lib/constants";
import { slugify } from "@/lib/utils";
import { parsePageParams } from "@/lib/paginate";
import { getSettings } from "@/models/Settings";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const settings = await getSettings();
    const session = await getSession();
    const staff = session?.roles?.some((r) => PRIVILEGED_ROLES.includes(r));
    const { searchParams } = new URL(req.url);
    const { page, pageSize, skip } = parsePageParams(searchParams);

    if (!staff && !(settings.enableBulletin ?? true)) {
      return NextResponse.json({ posts: [], total: 0, page: 1, pageSize, totalPages: 1 });
    }

    const filter = staff && searchParams.get("all") === "1" ? {} : { status: "published" };
    const [posts, total] = await Promise.all([
      Bulletin.find(filter)
        .populate("authorId", "name")
        .sort({ publishedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
      Bulletin.countDocuments(filter),
    ]);
    return NextResponse.json({
      posts,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession(PRIVILEGED_ROLES);
    await connectDB();
    const body = await req.json();
    if (!body.title || !body.body) {
      return NextResponse.json({ error: "title and body required" }, { status: 400 });
    }
    let slug = slugify(body.slug || body.title) || `post-${Date.now()}`;
    const exists = await Bulletin.findOne({ slug });
    if (exists) slug = `${slug}-${Date.now().toString(36)}`;

    const status = body.status === "published" ? "published" : "draft";
    const post = await Bulletin.create({
      title: body.title,
      slug,
      excerpt: body.excerpt || "",
      body: body.body,
      coverImageUrl: body.coverImageUrl || "",
      status,
      authorId: session.sub,
      publishedAt: status === "published" ? new Date() : undefined,
    });
    return NextResponse.json({ post }, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
