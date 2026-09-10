import Link from "next/link";
import { connectDB } from "@/lib/db";
import { Job } from "@/models/Job";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/card";
import { DeleteResourceButton } from "@/components/studio/delete-resource-button";

export const dynamic = "force-dynamic";

export default async function StudioJobsPage() {
  await connectDB();
  const jobs = await Job.find().sort({ createdAt: -1 }).lean();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-blue-950">Jobs</h1>
          <p className="text-stone-600">Career board listings and applications.</p>
        </div>
        <Link href="/studio/jobs/new">
          <Button>New job</Button>
        </Link>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-stone-500">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Company</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((j) => (
              <tr key={String(j._id)} className="border-b border-stone-100 last:border-0">
                <td className="px-4 py-3 font-medium">{j.title}</td>
                <td className="px-4 py-3">{j.companyName}</td>
                <td className="px-4 py-3">
                  <Badge variant={j.status === "open" ? "success" : "muted"}>{j.status}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/studio/jobs/${j._id}`}>
                      <Button size="sm" variant="outline">
                        Applications
                      </Button>
                    </Link>
                    <DeleteResourceButton
                      endpoint={`/api/jobs/${j._id}`}
                      confirmMessage="Delete this job listing?"
                    />
                  </div>
                </td>
              </tr>
            ))}
            {!jobs.length && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-stone-500">
                  No jobs yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
