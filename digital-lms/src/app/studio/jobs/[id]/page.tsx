"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

type Application = {
  _id: string;
  status: string;
  coverLetter?: string;
  resumeUrl?: string;
  createdAt: string;
  userId: { name: string; email: string; headline?: string };
};

type Job = { _id: string; title: string; companyName: string; status: string };

export default function JobApplicationsPage() {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);

  useEffect(() => {
    Promise.all([
      fetch(`/api/jobs/${id}`).then((r) => r.json()),
      fetch(`/api/jobs/${id}/applications`).then((r) => r.json()),
    ]).then(([j, a]) => {
      if (j.job) setJob(j.job);
      if (a.applications) setApplications(a.applications);
    });
  }, [id]);

  if (!job) return <p className="text-stone-500">Loading…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-teal-950">{job.title}</h1>
        <p className="text-stone-600">
          {job.companyName} · Applications ({applications.length})
        </p>
      </div>
      <div className="space-y-3">
        {applications.map((app) => (
          <Card key={app._id}>
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base">{app.userId?.name}</CardTitle>
                <p className="text-sm text-stone-500">
                  {app.userId?.email}
                  {app.userId?.headline ? ` · ${app.userId.headline}` : ""}
                </p>
              </div>
              <Badge>{app.status}</Badge>
            </CardHeader>
            <CardContent className="text-sm text-stone-600">
              {app.coverLetter && <p className="mb-2">{app.coverLetter}</p>}
              {app.resumeUrl && (
                <a href={app.resumeUrl} className="text-teal-700 hover:underline" target="_blank">
                  Resume
                </a>
              )}
              <p className="mt-2 text-xs text-stone-400">{formatDate(app.createdAt)}</p>
            </CardContent>
          </Card>
        ))}
        {!applications.length && <p className="text-stone-500">No applications yet.</p>}
      </div>
    </div>
  );
}
