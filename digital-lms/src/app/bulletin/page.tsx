import Link from "next/link";
import { connectDB } from "@/lib/db";
import { Bulletin } from "@/models/Bulletin";
import { getSettings } from "@/models/Settings";
import { formatDate } from "@/lib/utils";
import { StudioPagination } from "@/components/studio/pagination";
import { paginateQuery } from "@/lib/paginate";

export const dynamic = "force-dynamic";

export default async function BulletinPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  await connectDB();
  const settings = await getSettings();
  if (!(settings.enableBulletin ?? true)) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="font-serif text-3xl text-stone-900">Bulletin</h1>
        <p className="mt-2 text-stone-500">Bulletin is currently disabled.</p>
      </div>
    );
  }

  const { items: posts, total, totalPages } = await paginateQuery<{
    _id: unknown;
    title: string;
    slug?: string;
    excerpt?: string;
    publishedAt?: Date;
    createdAt?: Date;
  }>(
    Bulletin,
    { status: "published" },
    { page, pageSize: 12, sort: { publishedAt: -1, createdAt: -1 } }
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-serif text-3xl text-stone-900">Bulletin</h1>
      <p className="mt-1 text-stone-600">News and announcements from Digital Penang LMS.</p>
      <div className="mt-8 space-y-4">
        {posts.map((p) => (
          <Link
            key={String(p._id)}
            href={`/bulletin/${p.slug || p._id}`}
            className="block rounded-2xl border border-stone-200 bg-white p-5 transition hover:border-blue-200 hover:shadow-sm"
          >
            <p className="text-xs text-stone-400">{formatDate(p.publishedAt || p.createdAt)}</p>
            <h2 className="mt-1 font-serif text-xl text-blue-950">{p.title}</h2>
            {p.excerpt && <p className="mt-2 text-sm text-stone-600 line-clamp-2">{p.excerpt}</p>}
          </Link>
        ))}
        {!posts.length && <p className="text-stone-500">No posts yet.</p>}
      </div>
      <div className="mt-6">
        <StudioPagination page={page} totalPages={totalPages} total={total} basePath="/bulletin" />
      </div>
    </div>
  );
}
