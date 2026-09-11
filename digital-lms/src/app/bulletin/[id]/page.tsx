import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { Bulletin } from "@/models/Bulletin";
import { formatDate } from "@/lib/utils";
import { sanitizeHtml } from "@/lib/sanitize";

export const dynamic = "force-dynamic";

export default async function BulletinPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await connectDB();
  const post =
    (await Bulletin.findOne({ slug: id, status: "published" }).populate("authorId", "name").lean()) ||
    (await Bulletin.findOne({ _id: id, status: "published" }).populate("authorId", "name").lean());
  if (!post) notFound();

  const author = post.authorId as { name?: string } | undefined;

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/bulletin" className="text-sm text-blue-700 hover:underline">
        ← Bulletin
      </Link>
      <p className="mt-4 text-xs text-stone-400">
        {formatDate(post.publishedAt || post.createdAt)}
        {author?.name ? ` · ${author.name}` : ""}
      </p>
      <h1 className="mt-2 font-serif text-4xl text-stone-900">{post.title}</h1>
      {post.coverImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.coverImageUrl}
          alt=""
          className="mt-6 max-h-80 w-full rounded-2xl object-cover"
        />
      )}
      <div
        className="prose-lesson mt-8 rounded-2xl border border-stone-200 bg-white p-6"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.body) }}
      />
    </article>
  );
}
