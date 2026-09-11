import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Bulletin } from "@/models/Bulletin";
import { getSession, requireSession, jsonError } from "@/lib/auth";
import { PRIVILEGED_ROLES } from "@/lib/constants";
import { slugify } from "@/lib/utils";
import { sanitizeHtml } from "@/lib/sanitize";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const session = await getSession();
    const staff = session?.roles?.some((r) => PRIVILEGED_ROLES.includes(r));
    const post =
      (await Bulletin.findById(id).populate("authorId", "name").lean()) ||
      (await Bulletin.findOne({ slug: id }).populate("authorId", "name").lean());
    if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (post.status !== "published" && !staff) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ post });
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
    const post = await Bulletin.findById(id);
    if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (body.title !== undefined) post.title = body.title;
    if (body.excerpt !== undefined) post.excerpt = body.excerpt;
    if (body.body !== undefined) post.body = sanitizeHtml(body.body);
    if (body.coverImageUrl !== undefined) post.coverImageUrl = body.coverImageUrl;
    if (body.slug) post.slug = slugify(body.slug);
    if (body.status === "published" || body.status === "draft") {
      post.status = body.status;
      if (body.status === "published" && !post.publishedAt) {
        post.publishedAt = new Date();
      }
    }
    await post.save();
    return NextResponse.json({ post });
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
    await Bulletin.findByIdAndDelete(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
