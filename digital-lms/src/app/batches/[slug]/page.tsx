import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { Batch } from "@/models/Batch";
import { BatchEnrollment } from "@/models/Batch";
import type { ILiveClass, IAnnouncement, ITimetableItem } from "@/models/Batch";
import { Course } from "@/models/Course";
import { getSession } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatDateTime } from "@/lib/utils";
import { BatchEnrollButton } from "@/components/batch/enroll-button";
import { BatchForum } from "@/components/batch/batch-forum";

export const dynamic = "force-dynamic";

export default async function BatchDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await connectDB();
  const batch = await Batch.findOne({ slug }).lean();
  if (!batch || !batch.published) notFound();

  const courses = await Course.find({ _id: { $in: batch.courseIds } })
    .select("title slug")
    .lean();
  const session = await getSession();
  let enrolled = false;
  if (session) {
    enrolled = !!(await BatchEnrollment.findOne({
      batchId: batch._id,
      userId: session.sub,
    }));
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-serif text-4xl">{batch.title}</h1>
      <p className="mt-3 text-lg text-stone-600">{batch.description}</p>
      <p className="mt-2 text-sm text-stone-500">
        {formatDate(batch.startDate)} – {formatDate(batch.endDate)} · {batch.enrolledCount}/
        {batch.seatCount} seats
      </p>

      <div className="mt-6">
        {enrolled ? (
          <p className="text-blue-800">You are enrolled in this batch.</p>
        ) : (
          <BatchEnrollButton
            batchId={String(batch._id)}
            paid={batch.paid}
            requireApplication={!!batch.requireApplication}
          />
        )}
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Courses in this batch</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {courses.map((c) => (
              <Link
                key={String(c._id)}
                href={`/courses/${c.slug}`}
                className="block text-blue-700 hover:underline"
              >
                {c.title}
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Live sessions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {batch.liveClasses?.map((lc: ILiveClass) => (
              <div key={String(lc._id)} className="rounded-lg border border-stone-100 p-3 text-sm">
                <p className="font-medium">{lc.title}</p>
                <p className="text-stone-500">{formatDateTime(lc.startAt)}</p>
                {enrolled && lc.meetingUrl && (
                  <a
                    href={lc.meetingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-700 hover:underline"
                  >
                    Join meeting
                  </a>
                )}
              </div>
            ))}
            {!batch.liveClasses?.length && (
              <p className="text-stone-500">No live classes scheduled yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Timetable</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {batch.timetable?.map((t: ITimetableItem, i: number) => (
              <div key={i}>
                <p className="font-medium">{t.title}</p>
                <p className="text-stone-500">
                  {formatDate(t.date)} {t.startTime}-{t.endTime}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Announcements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {batch.announcements?.map((a: IAnnouncement) => (
              <div key={String(a._id)}>
                <p className="font-medium">{a.title}</p>
                <p className="text-stone-600">{a.body}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <BatchForum batchId={String(batch._id)} canPost={enrolled} />
      </div>
    </div>
  );
}
