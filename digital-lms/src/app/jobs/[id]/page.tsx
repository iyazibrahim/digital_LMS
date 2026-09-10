import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { Job } from "@/models/Job";
import { getSession } from "@/lib/auth";
import { Badge } from "@/components/ui/card";
import { JobApplyForm } from "@/components/job/apply-form";

export const dynamic = "force-dynamic";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await connectDB();
  const job = await Job.findById(id).lean();
  if (!job || job.status !== "open") notFound();
  const session = await getSession();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex flex-wrap gap-2">
        <Badge>{job.type.replace("_", " ")}</Badge>
        {job.location && <Badge variant="muted">{job.location}</Badge>}
      </div>
      <h1 className="mt-3 font-serif text-4xl text-blue-950">{job.title}</h1>
      <p className="mt-2 text-lg text-stone-600">
        {job.companyName}
        {job.salaryRange ? ` · ${job.salaryRange}` : ""}
      </p>
      <div className="prose-lesson mt-8 whitespace-pre-wrap text-stone-700">{job.description}</div>
      {job.requirements && (
        <div className="mt-6">
          <h2 className="font-serif text-xl">Requirements</h2>
          <p className="mt-2 whitespace-pre-wrap text-stone-600">{job.requirements}</p>
        </div>
      )}
      <div className="mt-10">
        {session ? (
          <JobApplyForm jobId={String(job._id)} />
        ) : (
          <p className="text-stone-600">
            <a href="/login" className="text-blue-700 hover:underline">
              Log in
            </a>{" "}
            to apply.
          </p>
        )}
      </div>
    </div>
  );
}
