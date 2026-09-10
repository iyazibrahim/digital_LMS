import Link from "next/link";
import { connectDB } from "@/lib/db";
import { Batch } from "@/models/Batch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { DeleteResourceButton } from "@/components/studio/delete-resource-button";
import { StudioPagination } from "@/components/studio/pagination";
import { paginateQuery } from "@/lib/paginate";

export const dynamic = "force-dynamic";

export default async function StudioBatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  await connectDB();
  const { items: batches, total, totalPages } = await paginateQuery<{
    _id: unknown;
    title: string;
    published?: boolean;
    enrolledCount?: number;
    seatCount?: number;
    startDate?: Date;
    endDate?: Date;
  }>(Batch, {}, {
    page,
    pageSize: 20,
    sort: { createdAt: -1 },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-blue-950">Batches</h1>
          <p className="text-stone-600">Live cohorts, announcements, and enrollments.</p>
        </div>
        <Link href="/studio/batches/new">
          <Button>New batch</Button>
        </Link>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-stone-500">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Seats</th>
              <th className="px-4 py-3 font-medium">Dates</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {batches.map((b) => (
              <tr key={String(b._id)} className="border-b border-stone-100 last:border-0">
                <td className="px-4 py-3 font-medium">{b.title}</td>
                <td className="px-4 py-3">
                  <Badge variant={b.published ? "success" : "muted"}>
                    {b.published ? "Published" : "Draft"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  {b.enrolledCount}/{b.seatCount}
                </td>
                <td className="px-4 py-3 text-stone-500">
                  {formatDate(b.startDate)} – {formatDate(b.endDate)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/studio/batches/${b._id}`}>
                      <Button size="sm" variant="outline">
                        Manage
                      </Button>
                    </Link>
                    <DeleteResourceButton
                      endpoint={`/api/batches/${b._id}`}
                      confirmMessage="Delete this batch?"
                    />
                  </div>
                </td>
              </tr>
            ))}
            {!batches.length && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-stone-500">
                  No batches yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <StudioPagination page={page} totalPages={totalPages} total={total} basePath="/studio/batches" />
    </div>
  );
}
