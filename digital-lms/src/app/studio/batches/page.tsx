import Link from "next/link";
import { connectDB } from "@/lib/db";
import { Batch } from "@/models/Batch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function StudioBatchesPage() {
  await connectDB();
  const batches = await Batch.find().sort({ createdAt: -1 }).lean();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl text-teal-950">Batches</h1>
          <p className="text-stone-600">Live cohorts, announcements, and enrollments.</p>
        </div>
        <Link href="/studio/batches/new">
          <Button>New batch</Button>
        </Link>
      </div>
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-stone-500">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Seats</th>
              <th className="px-4 py-3 font-medium">Dates</th>
              <th className="px-4 py-3" />
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
                <td className="px-4 py-3 text-right">
                  <Link href={`/studio/batches/${b._id}`} className="text-teal-700 hover:underline">
                    Manage
                  </Link>
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
    </div>
  );
}
