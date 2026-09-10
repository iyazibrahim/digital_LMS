import Link from "next/link";
import { connectDB } from "@/lib/db";
import { Job } from "@/models/Job";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  await connectDB();
  const jobs = await Job.find({ status: "open" }).sort({ createdAt: -1 }).lean();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-serif text-3xl text-stone-900">Jobs</h1>
      <p className="mt-2 text-stone-600">Opportunities for Digital Penang learners.</p>
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {jobs.map((j) => (
          <Link key={String(j._id)} href={`/jobs/${j._id}`}>
            <Card className="h-full hover:border-blue-300">
              <CardHeader>
                <div className="flex flex-wrap gap-2">
                  <Badge>{j.type.replace("_", " ")}</Badge>
                  {j.location && <Badge variant="muted">{j.location}</Badge>}
                </div>
                <CardTitle className="mt-2 font-serif">{j.title}</CardTitle>
                <CardDescription>{j.companyName}</CardDescription>
              </CardHeader>
              <CardContent className="line-clamp-3 text-sm text-stone-600">
                {j.description}
              </CardContent>
            </Card>
          </Link>
        ))}
        {!jobs.length && <p className="text-stone-500">No open roles right now.</p>}
      </div>
    </div>
  );
}
