import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { Course, ICourse, IChapter, ILesson } from "@/models/Course";
import { Enrollment } from "@/models/Enrollment";
import { getSession } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/card";
import { EnrollButton } from "@/components/course/enroll-button";

export const dynamic = "force-dynamic";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await connectDB();
  const course = (await Course.findOne({ slug })
    .populate("instructors", "name")
    .lean()) as unknown as ICourse | null;
  if (!course || (!course.published && !(await getSession()))) notFound();

  const session = await getSession();
  let enrollment = null;
  if (session) {
    enrollment = await Enrollment.findOne({
      userId: session.sub,
      courseId: course._id,
    }).lean();
  }

  const firstLesson = course.chapters
    ?.flatMap((ch: IChapter) =>
      ch.lessons.map((l: ILesson) => ({
        chapterId: String(ch._id),
        lesson: l,
        chapter: ch,
      }))
    )
    .find(Boolean);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          {course.category && <Badge>{course.category}</Badge>}
          <h1 className="mt-3 font-serif text-4xl text-stone-900">{course.title}</h1>
          <p className="mt-3 text-lg text-stone-600">{course.shortIntroduction}</p>
          <div className="prose-lesson mt-6 text-stone-700">
            <p>{course.description}</p>
          </div>

          <h2 className="mt-10 font-serif text-2xl">Curriculum</h2>
          <div className="mt-4 space-y-4">
            {course.chapters
              ?.slice()
              .sort((a: IChapter, b: IChapter) => a.order - b.order)
              .map((ch: IChapter) => (
                <Card key={String(ch._id)}>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {ch.title}
                      {ch.isScorm && (
                        <Badge className="ml-2" variant="warning">
                          SCORM
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {ch.isScorm ? (
                      <p className="text-sm text-stone-500">Interactive SCORM package</p>
                    ) : (
                      <ul className="space-y-2">
                        {ch.lessons
                          .slice()
                          .sort((a: ILesson, b: ILesson) => a.order - b.order)
                          .map((l: ILesson) => (
                            <li
                              key={String(l._id)}
                              className="flex items-center justify-between text-sm"
                            >
                              <span>
                                {l.title}
                                {l.isPreview && (
                                  <Badge className="ml-2" variant="muted">
                                    Preview
                                  </Badge>
                                )}
                              </span>
                              {(enrollment || l.isPreview) && (
                                <Link
                                  className="text-blue-700 hover:underline"
                                  href={`/learn/${course.slug}/${l.slug}`}
                                >
                                  Open
                                </Link>
                              )}
                            </li>
                          ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>

        <aside>
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>
                {course.paid ? `${course.currency} ${course.price}` : "Free course"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {enrollment ? (
                <>
                  <p className="text-sm text-stone-600">
                    Progress: {(enrollment as { progressPercent?: number }).progressPercent || 0}%
                  </p>
                  {firstLesson && (
                    <Link href={`/learn/${course.slug}/${firstLesson.lesson.slug}`}>
                      <span className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-blue-700 text-sm font-medium text-white hover:bg-blue-800">
                        Continue learning
                      </span>
                    </Link>
                  )}
                </>
              ) : (
                <EnrollButton
                  courseId={String(course._id)}
                  paid={course.paid}
                  price={course.price}
                  currency={course.currency}
                />
              )}
              {course.enableCertification && (
                <p className="text-xs text-stone-500">Certificate awarded on completion</p>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
