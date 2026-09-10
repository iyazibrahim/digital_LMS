import Link from "next/link";
import { connectDB } from "@/lib/db";
import { Assignment } from "@/models/Assignment";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { DeleteResourceButton } from "@/components/studio/delete-resource-button";

export const dynamic = "force-dynamic";

export default async function StudioAssignmentsPage() {
  await connectDB();
  const assignments = await Assignment.find().sort({ createdAt: -1 }).lean();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-blue-950">Assignments</h1>
          <p className="text-stone-600">File submission tasks for lessons.</p>
        </div>
        <Link href="/studio/assignments/new">
          <Button>New assignment</Button>
        </Link>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-stone-500">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Max size</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((a) => (
              <tr key={String(a._id)} className="border-b border-stone-100 last:border-0">
                <td className="px-4 py-3 font-medium">{a.title}</td>
                <td className="px-4 py-3">{a.maxFileSizeMb} MB</td>
                <td className="px-4 py-3 text-stone-500">{formatDate(a.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/studio/assignments/${a._id}`}>
                      <Button size="sm" variant="outline">
                        Edit
                      </Button>
                    </Link>
                    <DeleteResourceButton
                      endpoint={`/api/assignments/${a._id}`}
                      confirmMessage="Delete this assignment?"
                    />
                  </div>
                </td>
              </tr>
            ))}
            {!assignments.length && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-stone-500">
                  No assignments yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
