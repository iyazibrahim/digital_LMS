import Link from "next/link";
import { connectDB } from "@/lib/db";
import { Assignment } from "@/models/Assignment";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function StudioAssignmentsPage() {
  await connectDB();
  const assignments = await Assignment.find().sort({ createdAt: -1 }).lean();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl text-teal-950">Assignments</h1>
          <p className="text-stone-600">File submission tasks for lessons.</p>
        </div>
        <Link href="/studio/assignments/new">
          <Button>New assignment</Button>
        </Link>
      </div>
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-stone-500">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Max size</th>
              <th className="px-4 py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((a) => (
              <tr key={String(a._id)} className="border-b border-stone-100 last:border-0">
                <td className="px-4 py-3 font-medium">{a.title}</td>
                <td className="px-4 py-3">{a.maxFileSizeMb} MB</td>
                <td className="px-4 py-3 text-stone-500">{formatDate(a.createdAt)}</td>
              </tr>
            ))}
            {!assignments.length && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-stone-500">
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
