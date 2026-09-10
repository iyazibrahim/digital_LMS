import Link from "next/link";
import { connectDB } from "@/lib/db";
import { ProgrammingExercise } from "@/models/ProgrammingExercise";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { DeleteResourceButton } from "@/components/studio/delete-resource-button";
import { StudioPagination } from "@/components/studio/pagination";
import { paginateQuery } from "@/lib/paginate";

export const dynamic = "force-dynamic";

export default async function StudioExercisesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  await connectDB();
  const { items: exercises, total, totalPages } = await paginateQuery<{
    _id: unknown;
    title: string;
    kind?: string;
    language?: string;
    testCases?: unknown[];
    createdAt?: Date;
  }>(
    ProgrammingExercise,
    {},
    { page, pageSize: 20, sort: { createdAt: -1 } }
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-blue-950">Exercises</h1>
          <p className="text-stone-600">Coding, short answer, written, and file exercises.</p>
        </div>
        <Link href="/studio/exercises/new">
          <Button>New exercise</Button>
        </Link>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-stone-500">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Kind</th>
              <th className="px-4 py-3 font-medium">Detail</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {exercises.map((ex) => {
              const kind = (ex as { kind?: string }).kind || "coding";
              return (
                <tr key={String(ex._id)} className="border-b border-stone-100 last:border-0">
                  <td className="px-4 py-3 font-medium">{ex.title}</td>
                  <td className="px-4 py-3 capitalize">{kind.replace("_", " ")}</td>
                  <td className="px-4 py-3">
                    {kind === "coding"
                      ? `${ex.language} · ${ex.testCases?.length || 0} tests`
                      : kind}
                  </td>
                  <td className="px-4 py-3 text-stone-500">{formatDate(ex.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/studio/exercises/${ex._id}`}>
                        <Button size="sm" variant="outline">
                          Edit
                        </Button>
                      </Link>
                      <DeleteResourceButton
                        endpoint={`/api/exercises/${ex._id}`}
                        confirmMessage="Delete this exercise?"
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
            {!exercises.length && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-stone-500">
                  No exercises yet.
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
        basePath="/studio/exercises"
      />
    </div>
  );
}
