import Link from "next/link";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Enrollment } from "@/models/Enrollment";
import { Batch, BatchEnrollment } from "@/models/Batch";
import { Certificate, EvaluatorSlot } from "@/models/Certificate";
import { AssignmentSubmission } from "@/models/Assignment";
import { Program, ProgramMember } from "@/models/Program";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

type CourseLean = {
  _id: unknown;
  title: string;
  slug: string;
  chapters?: { lessons?: { _id: unknown; slug: string; title: string }[] }[];
};

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/dashboard");

  await connectDB();

  const enrollments = await Enrollment.find({ userId: session.sub })
    .populate("courseId", "title slug chapters")
    .sort({ updatedAt: -1 })
    .lean();

  const batchEns = await BatchEnrollment.find({
    userId: session.sub,
    status: "active",
  })
    .populate("batchId", "title slug liveClasses startDate endDate")
    .lean();

  const programs = await ProgramMember.find({ userId: session.sub })
    .populate("programId", "title slug")
    .lean();

  const certificates = await Certificate.find({ userId: session.sub })
    .sort({ issuedAt: -1 })
    .limit(5)
    .lean();

  const pendingAssignments = await AssignmentSubmission.find({
    userId: session.sub,
    status: "submitted",
  })
    .populate("assignmentId", "title dueAt")
    .limit(10)
    .lean();

  const now = new Date();
  const upcomingSlots = await EvaluatorSlot.find({
    bookedBy: session.sub,
    startAt: { $gte: now },
  })
    .sort({ startAt: 1 })
    .limit(5)
    .lean();

  const upcomingLive: {
    title: string;
    startAt: Date;
    batchTitle: string;
    batchSlug: string;
    meetingUrl?: string;
  }[] = [];

  for (const be of batchEns) {
    const batch = be.batchId as unknown as {
      title?: string;
      slug?: string;
      liveClasses?: { title: string; startAt: Date; meetingUrl?: string }[];
    } | null;
    if (!batch?.liveClasses) continue;
    for (const lc of batch.liveClasses) {
      if (new Date(lc.startAt) >= now) {
        upcomingLive.push({
          title: lc.title,
          startAt: new Date(lc.startAt),
          batchTitle: batch.title || "Batch",
          batchSlug: batch.slug || "",
          meetingUrl: lc.meetingUrl,
        });
      }
    }
  }
  upcomingLive.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());

  function continueHref(en: (typeof enrollments)[0]) {
    const course = en.courseId as unknown as CourseLean | null;
    if (!course?.slug) return "/courses";
    const lessons =
      course.chapters?.flatMap((ch) =>
        (ch.lessons || []).map((l) => ({
          id: String(l._id),
          slug: l.slug,
        }))
      ) || [];
    const done = new Set((en.completedLessonIds || []).map(String));
    const next = lessons.find((l) => !done.has(l.id)) || lessons[0];
    if (!next) return `/courses/${course.slug}`;
    return `/learn/${course.slug}/${next.slug}`;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl text-stone-900">My Learning</h1>
          <p className="mt-1 text-stone-600">Welcome back, {session.name}.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/courses">
            <Button variant="outline" size="sm">
              Browse courses
            </Button>
          </Link>
          <Link href="/calendar">
            <Button size="sm">Calendar</Button>
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Continue learning</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {enrollments.map((en) => {
                const course = en.courseId as unknown as CourseLean | null;
                if (!course) return null;
                return (
                  <div
                    key={String(en._id)}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-100 p-3"
                  >
                    <div>
                      <p className="font-medium text-stone-900">{course.title}</p>
                      <p className="text-sm text-stone-500">
                        {en.progressPercent || 0}% complete
                        {en.completed ? " · Done" : ""}
                      </p>
                      <div className="mt-2 h-1.5 w-40 overflow-hidden rounded-full bg-stone-100">
                        <div
                          className="h-full rounded-full bg-blue-600"
                          style={{ width: `${Math.min(100, en.progressPercent || 0)}%` }}
                        />
                      </div>
                    </div>
                    <Link href={continueHref(en)}>
                      <Button size="sm">{en.completed ? "Review" : "Continue"}</Button>
                    </Link>
                  </div>
                );
              })}
              {!enrollments.length && (
                <p className="text-sm text-stone-500">
                  No enrollments yet.{" "}
                  <Link href="/courses" className="text-blue-700 hover:underline">
                    Browse the catalog
                  </Link>
                  .
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Upcoming live classes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingLive.slice(0, 5).map((lc, i) => (
                <div key={i} className="rounded-lg border border-stone-100 p-3">
                  <p className="font-medium">{lc.title}</p>
                  <p className="text-sm text-stone-500">
                    {formatDate(lc.startAt)} · {lc.batchTitle}
                  </p>
                  <div className="mt-2 flex gap-2">
                    {lc.batchSlug && (
                      <Link href={`/batches/${lc.batchSlug}`} className="text-sm text-blue-700">
                        Batch
                      </Link>
                    )}
                    {lc.meetingUrl && (
                      <a
                        href={lc.meetingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-blue-700"
                      >
                        Join link
                      </a>
                    )}
                  </div>
                </div>
              ))}
              {!upcomingLive.length && (
                <p className="text-sm text-stone-500">No upcoming live classes.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Batches & programs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {batchEns.map((be) => {
                const b = be.batchId as unknown as { title?: string; slug?: string } | null;
                if (!b) return null;
                return (
                  <Link
                    key={String(be._id)}
                    href={`/batches/${b.slug}`}
                    className="block rounded-lg border border-stone-100 px-3 py-2 hover:border-blue-200"
                  >
                    Batch: {b.title}
                  </Link>
                );
              })}
              {programs.map((pm) => {
                const p = pm.programId as unknown as { title?: string; slug?: string } | null;
                if (!p) return null;
                return (
                  <Link
                    key={String(pm._id)}
                    href={`/programs/${p.slug}`}
                    className="block rounded-lg border border-stone-100 px-3 py-2 hover:border-blue-200"
                  >
                    Program: {p.title}
                  </Link>
                );
              })}
              {!batchEns.length && !programs.length && (
                <p className="text-stone-500">No cohorts yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-serif">To-do</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {pendingAssignments.map((s) => {
                const a = s.assignmentId as unknown as { title?: string; dueAt?: string } | null;
                return (
                  <div key={String(s._id)} className="rounded-lg border border-amber-100 bg-amber-50/50 p-2">
                    Awaiting grade: {a?.title || "Assignment"}
                    {a?.dueAt ? ` · due ${formatDate(a.dueAt)}` : ""}
                  </div>
                );
              })}
              {upcomingSlots.map((slot) => (
                <div key={String(slot._id)} className="rounded-lg border border-stone-100 p-2">
                  Evaluation · {formatDate(slot.startAt)}
                </div>
              ))}
              {!pendingAssignments.length && !upcomingSlots.length && (
                <p className="text-stone-500">Nothing pending.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Certificates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {certificates.map((c) => (
                <Link
                  key={String(c._id)}
                  href={`/certificates/${c._id}`}
                  className="block text-blue-800 hover:underline"
                >
                  {c.courseTitle}
                </Link>
              ))}
              {!certificates.length && <p className="text-stone-500">None yet.</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
