import Link from "next/link";
import { connectDB } from "@/lib/db";
import { Job } from "@/models/Job";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function StudioJobsPage() {
  await connectDB();
  const jobs = await Job.find().sort({ createdAt: -1 }).lean();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl text-blue-950">Jobs</h1>
          <p className="text-stone-600">Career board listings and applications.</p>
        </div>
        <Link href="/studio/jobs/new">
          <Button>New job</Button>
        </Link>
      </div>
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-stone-500">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Company</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3" />
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
                <td className="px-4 py-3 text-right">
                  <Link href={`/studio/jobs/${j._id}`} className="text-blue-700 hover:underline">
                    Applications
                  </Link>
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
