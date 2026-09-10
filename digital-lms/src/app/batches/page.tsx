import Link from "next/link";
import { connectDB } from "@/lib/db";
import { Batch } from "@/models/Batch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function BatchesPage() {
  await connectDB();
  const batches = await Batch.find({ published: true }).sort({ startDate: 1 }).lean();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-serif text-3xl">Live batches</h1>
      <p className="mt-2 text-stone-600">
        Instructor-led cohorts with live sessions and learner tracking.
      </p>
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {batches.map((b) => (
          <Link key={String(b._id)} href={`/batches/${b.slug}`}>
            <Card className="h-full hover:border-blue-300">
              <CardHeader>
                <Badge variant="default">Cohort</Badge>
                <CardTitle className="mt-2 font-serif">{b.title}</CardTitle>
                <CardDescription>{b.description}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-stone-500">
                {formatDate(b.startDate)} – {formatDate(b.endDate)} · {b.enrolledCount}/
                {b.seatCount} seats
              </CardContent>
            </Card>
          </Link>
        ))}
        {!batches.length && <p className="text-stone-500">No published batches yet.</p>}
      </div>
    </div>
  );
}
