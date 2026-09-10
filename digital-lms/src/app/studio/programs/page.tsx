import Link from "next/link";
import { connectDB } from "@/lib/db";
import { Program } from "@/models/Program";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/card";
import { DeleteResourceButton } from "@/components/studio/delete-resource-button";
import { StudioPagination } from "@/components/studio/pagination";
import { paginateQuery } from "@/lib/paginate";

export const dynamic = "force-dynamic";

export default async function StudioProgramsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  await connectDB();
  const { items: programs, total, totalPages } = await paginateQuery<{
    _id: unknown;
    title: string;
    courseIds?: unknown[];
    published?: boolean;
  }>(Program, {}, {
    page,
    pageSize: 20,
    sort: { createdAt: -1 },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-blue-950">Programs</h1>
          <p className="text-stone-600">Multi-course learning paths.</p>
        </div>
        <Link href="/studio/programs/new">
          <Button>New program</Button>
        </Link>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-stone-500">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Courses</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {programs.map((p) => (
              <tr key={String(p._id)} className="border-b border-stone-100 last:border-0">
                <td className="px-4 py-3 font-medium">{p.title}</td>
                <td className="px-4 py-3">{p.courseIds?.length || 0}</td>
                <td className="px-4 py-3">
                  <Badge variant={p.published ? "success" : "muted"}>
                    {p.published ? "Published" : "Draft"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/studio/programs/${p._id}`}>
                      <Button size="sm" variant="outline">
                        Edit
                      </Button>
                    </Link>
                    <DeleteResourceButton
                      endpoint={`/api/programs/${p._id}`}
                      confirmMessage="Delete this program?"
                    />
                  </div>
                </td>
              </tr>
            ))}
            {!programs.length && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-stone-500">
                  No programs yet.
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
        basePath="/studio/programs"
      />
    </div>
  );
}
