import { notFound } from "next/navigation";
import Link from "next/link";
import { connectDB } from "@/lib/db";
import { Job } from "@/models/Job";
import { getSettings } from "@/models/Settings";
import { getSession } from "@/lib/auth";
import { JobApplyForm } from "@/components/job/apply-form";
import { sanitizeHtml } from "@/lib/sanitize";
import { Badge } from "@/components/ui/card";

export const dynamic = "force-dynamic";

const typeLabel: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  internship: "Internship",
  remote: "Remote",
};

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await connectDB();
  const settings = await getSettings();
  const enableJobs =
    (settings as { enableJobs?: boolean }).enableJobs ?? settings.enableJobBoard !== false;
  if (!enableJobs) notFound();

  const job = await Job.findById(id).lean();
  if (!job || job.status !== "open") notFound();

  const session = await getSession();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/jobs" className="text-sm text-blue-700 hover:underline">
        ← All jobs
      </Link>
      <div className="mt-4 flex flex-wrap gap-2">
        <Badge variant="muted">{typeLabel[job.type] || job.type}</Badge>
        {job.location && <Badge variant="muted">{job.location}</Badge>}
      </div>
      <h1 className="mt-3 font-serif text-4xl text-stone-900">{job.title}</h1>
      <p className="mt-2 text-lg text-stone-600">
        {job.companyName}
        {job.salaryRange ? ` · ${job.salaryRange}` : ""}
      </p>
      <div
        className="prose prose-stone mt-8 max-w-none"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(job.description) }}
      />
      {job.requirements && (
        <div className="mt-6">
          <h2 className="font-serif text-xl">Requirements</h2>
          <div
            className="prose prose-stone mt-2 max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(job.requirements) }}
          />
        </div>
      )}
      <div className="mt-10">
        {job.applicationUrl ? (
          <a
            href={job.applicationUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
          >
            Apply externally
          </a>
        ) : session ? (
          <JobApplyForm jobId={String(job._id)} />
        ) : (
          <p className="text-sm text-stone-600">
            <Link href={`/login?next=/jobs/${job._id}`} className="text-blue-700 hover:underline">
              Log in
            </Link>{" "}
            to apply.
          </p>
        )}
      </div>
    </div>
  );
}
