import Link from "next/link";
import { connectDB } from "@/lib/db";
import { Job } from "@/models/Job";
import { getSettings } from "@/models/Settings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const typeLabel: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  internship: "Internship",
  remote: "Remote",
};

export default async function JobsPage() {
  await connectDB();
  const settings = await getSettings();
  const enableJobs = settings.enableJobs === true;

  if (!enableJobs) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="font-serif text-3xl text-stone-900">Jobs</h1>
        <p className="mt-2 text-stone-500">The job board is currently disabled.</p>
      </div>
    );
  }

  const jobs = await Job.find({ status: "open" }).sort({ createdAt: -1 }).lean();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-serif text-3xl text-stone-900">Jobs</h1>
      <p className="mt-1 text-stone-600">
        Opportunities from Digital Penang startups and partners. News stays on the{" "}
        <Link href="/bulletin" className="text-blue-700 hover:underline">
          Bulletin
        </Link>
        .
      </p>
      <div className="mt-8 space-y-4">
        {jobs.map((job) => (
          <Link key={String(job._id)} href={`/jobs/${job._id}`}>
            <Card className="transition hover:border-blue-200 hover:shadow-sm">
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="muted">{typeLabel[job.type] || job.type}</Badge>
                  {job.location && <span className="text-xs text-stone-400">{job.location}</span>}
                </div>
                <CardTitle className="font-serif text-xl">{job.title}</CardTitle>
                <CardDescription>
                  {job.companyName}
                  {job.salaryRange ? ` · ${job.salaryRange}` : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-stone-400">
                Posted {formatDate(job.createdAt)}
              </CardContent>
            </Card>
          </Link>
        ))}
        {!jobs.length && <p className="text-stone-500">No open roles right now. Check back soon.</p>}
      </div>
    </div>
  );
}
