import Link from "next/link";
import { connectDB } from "@/lib/db";
import { Bulletin } from "@/models/Bulletin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { DeleteResourceButton } from "@/components/studio/delete-resource-button";
import { StudioPagination } from "@/components/studio/pagination";
import { paginateQuery } from "@/lib/paginate";

export const dynamic = "force-dynamic";

export default async function StudioBulletinPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  await connectDB();
  const { items: posts, total, totalPages } = await paginateQuery<{
    _id: unknown;
    title: string;
    status?: string;
    updatedAt?: Date;
  }>(Bulletin, {}, {
    page,
    pageSize: 20,
    sort: { updatedAt: -1 },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-blue-950">Bulletin</h1>
          <p className="text-stone-600">News and announcements for learners.</p>
        </div>
        <Link href="/studio/bulletin/new">
          <Button>New post</Button>
        </Link>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-stone-500">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Updated</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((p) => (
              <tr key={String(p._id)} className="border-b border-stone-100 last:border-0">
                <td className="px-4 py-3 font-medium">{p.title}</td>
                <td className="px-4 py-3">
                  <Badge variant={p.status === "published" ? "success" : "muted"}>
                    {p.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-stone-500">{formatDate(p.updatedAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/studio/bulletin/${p._id}`}>
                      <Button size="sm" variant="outline">
                        Edit
                      </Button>
                    </Link>
                    <DeleteResourceButton
                      endpoint={`/api/bulletin/${p._id}`}
                      confirmMessage="Delete this bulletin post?"
                    />
                  </div>
                </td>
              </tr>
            ))}
            {!posts.length && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-stone-500">
                  No bulletin posts yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <StudioPagination
        page={page}
        totalPages={totalPages}
        total={total}
        basePath="/studio/bulletin"
      />
    </div>
  );
}
