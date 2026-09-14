import { redirect } from "next/navigation";
import Link from "next/link";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Batch, BatchEnrollment } from "@/models/Batch";
import { Assignment } from "@/models/Assignment";
import { Quiz } from "@/models/Quiz";
import { EvaluatorSlot } from "@/models/Certificate";
import { Enrollment } from "@/models/Enrollment";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

type CalEvent = {
  id: string;
  title: string;
  start: Date;
  end?: Date;
  type: "live" | "due" | "evaluation" | "timetable";
  href?: string;
  meta?: string;
};

export default async function CalendarPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/calendar");
  await connectDB();

  const events: CalEvent[] = [];
  const now = new Date();
  const horizon = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  const batchEns = await BatchEnrollment.find({
    userId: session.sub,
    status: { $in: ["active", "completed"] },
  }).lean();
  const batchIds = batchEns.map((b) => b.batchId);
  const batches = await Batch.find({ _id: { $in: batchIds } }).lean();

  for (const batch of batches) {
    for (const lc of batch.liveClasses || []) {
      events.push({
        id: `live-${lc._id}`,
        title: lc.title,
        start: new Date(lc.startAt),
        end: new Date(
          new Date(lc.startAt).getTime() + (lc.durationMinutes || 60) * 60_000
        ),
        type: "live",
        href: `/batches/${batch.slug}`,
        meta: batch.title,
      });
    }
    for (const t of batch.timetable || []) {
      if (!t.date) continue;
      events.push({
        id: `tt-${batch._id}-${t.title}-${t.date}`,
        title: t.title,
        start: new Date(t.date),
        type: "timetable",
        href: `/batches/${batch.slug}`,
        meta: batch.title,
      });
    }
  }

  const courseIds = (
    await Enrollment.find({ userId: session.sub }).select("courseId").lean()
  ).map((e) => e.courseId);

  const [dueAssignments, dueQuizzes, slots] = await Promise.all([
    Assignment.find({ dueAt: { $gte: now, $lte: horizon } }).lean(),
    Quiz.find({ dueAt: { $gte: now, $lte: horizon } }).lean(),
    EvaluatorSlot.find({
      bookedBy: session.sub,
      startAt: { $gte: now, $lte: horizon },
    }).lean(),
  ]);

  // Only show dues for courses the learner is in when course linkage exists later;
  // for now show all upcoming dues on assignments/quizzes the platform has.
  for (const a of dueAssignments) {
    events.push({
      id: `due-a-${a._id}`,
      title: `Due: ${a.title}`,
      start: new Date(a.dueAt!),
      type: "due",
      href: "/dashboard",
    });
  }
  for (const q of dueQuizzes) {
    events.push({
      id: `due-q-${q._id}`,
      title: `Quiz due: ${q.title}`,
      start: new Date(q.dueAt!),
      type: "due",
      href: "/dashboard",
    });
  }
  for (const s of slots) {
    events.push({
      id: `eval-${s._id}`,
      title: "Evaluation slot",
      start: new Date(s.startAt),
      end: new Date(s.endAt),
      type: "evaluation",
      href: "/evaluations",
    });
  }

  void courseIds; // reserved for tighter filtering

  events.sort((a, b) => a.start.getTime() - b.start.getTime());

  const icsLines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Digital Penang LMS//EN",
    ...events.flatMap((e) => {
      const dt = (d: Date) =>
        d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
      return [
        "BEGIN:VEVENT",
        `UID:${e.id}@digital-penang-lms`,
        `DTSTAMP:${dt(now)}`,
        `DTSTART:${dt(e.start)}`,
        e.end ? `DTEND:${dt(e.end)}` : `DTEND:${dt(new Date(e.start.getTime() + 3600000))}`,
        `SUMMARY:${e.title.replace(/[,;\\]/g, " ")}`,
        e.meta ? `DESCRIPTION:${e.meta.replace(/[,;\\]/g, " ")}` : "",
        "END:VEVENT",
      ].filter(Boolean);
    }),
    "END:VCALENDAR",
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl text-stone-900">Calendar</h1>
          <p className="mt-1 text-stone-600">Live classes, dues, and evaluations.</p>
        </div>
        <a
          className="rounded-lg border border-stone-200 px-3 py-2 text-sm text-blue-800 hover:bg-stone-50"
          href={`data:text/calendar;charset=utf-8,${encodeURIComponent(icsLines.join("\r\n"))}`}
          download="digital-penang-lms.ics"
        >
          Download ICS
        </a>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Upcoming</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {events.map((e) => (
            <div
              key={e.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-stone-100 px-3 py-3"
            >
              <div>
                <p className="text-xs uppercase tracking-wide text-stone-400">{e.type}</p>
                <p className="font-medium text-stone-900">{e.title}</p>
                <p className="text-sm text-stone-500">
                  {formatDateTime(e.start)}
                  {e.meta ? ` · ${e.meta}` : ""}
                </p>
              </div>
              {e.href && (
                <Link href={e.href} className="text-sm text-blue-700 hover:underline">
                  Open
                </Link>
              )}
            </div>
          ))}
          {!events.length && <p className="text-stone-500">Nothing scheduled in the next 90 days.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
