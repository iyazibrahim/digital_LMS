import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { Course, type IChapter, type ILesson } from "@/models/Course";
import { Enrollment } from "@/models/Enrollment";
import { Quiz } from "@/models/Quiz";
import { Assignment } from "@/models/Assignment";
import { ProgrammingExercise } from "@/models/ProgrammingExercise";
import { DiscussionThread } from "@/models/Discussion";
import { getSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CompleteLessonButton } from "@/components/course/complete-lesson-button";
import { QuizPlayer } from "@/components/course/quiz-player";
import { AssignmentSubmit } from "@/components/course/assignment-submit";
import { DiscussionPanel } from "@/components/course/discussion-panel";
import { ExercisePlayer } from "@/components/course/exercise-player";
import { ScormPlayer } from "@/components/course/scorm-player";
import { VideoEmbed } from "@/components/course/video-embed";
import type { Types } from "mongoose";

export const dynamic = "force-dynamic";

export default async function LessonPlayerPage({
  params,
}: {
  params: Promise<{ slug: string; lessonSlug: string }>;
}) {
  const { slug, lessonSlug } = await params;
  const session = await getSession();
  if (!session) redirect(`/login?next=/learn/${slug}/${lessonSlug}`);

  await connectDB();
  const course = await Course.findOne({ slug });
  if (!course) notFound();

  let chapter = course.chapters.find((ch: IChapter) =>
    ch.lessons.some((l: ILesson) => l.slug === lessonSlug)
  );
  let lesson = chapter?.lessons.find((l: ILesson) => l.slug === lessonSlug);

  // SCORM chapter pseudo-lesson via chapter id slug pattern scorm-<id>
  if (!lesson && lessonSlug.startsWith("scorm-")) {
    const chapterId = lessonSlug.replace("scorm-", "");
    chapter = course.chapters.find(
      (ch: IChapter) => String(ch._id) === chapterId && ch.isScorm
    );
    if (chapter) {
      lesson = {
        _id: chapter._id,
        title: chapter.title,
        slug: lessonSlug,
        content: null,
        order: 0,
        isPreview: false,
      } as typeof lesson;
    }
  }

  if (!chapter || !lesson) notFound();

  const enrollment = await Enrollment.findOne({
    userId: session.sub,
    courseId: course._id,
  });

  if (!enrollment && !lesson.isPreview) {
    redirect(`/courses/${slug}`);
  }

  const quiz = lesson.quizId ? await Quiz.findById(lesson.quizId).lean() : null;
  const assignment = lesson.assignmentId
    ? await Assignment.findById(lesson.assignmentId).lean()
    : null;
  const exercise = lesson.programmingExerciseId
    ? await ProgrammingExercise.findById(lesson.programmingExerciseId).lean()
    : null;

  const threads = await DiscussionThread.find({
    courseId: course._id,
    lessonId: lesson._id,
  })
    .populate("userId", "name")
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  const allLessons = course.chapters.flatMap((ch: IChapter) =>
    ch.isScorm
      ? [
          {
            title: ch.title,
            slug: `scorm-${ch._id}`,
            chapterTitle: ch.title,
          },
        ]
      : ch.lessons.map((l: ILesson) => ({
          title: l.title,
          slug: l.slug,
          chapterTitle: ch.title,
        }))
  );
  const idx = allLessons.findIndex((l: { slug: string }) => l.slug === lessonSlug);
  const prev = idx > 0 ? allLessons[idx - 1] : null;
  const next = idx >= 0 && idx < allLessons.length - 1 ? allLessons[idx + 1] : null;

  const completed = enrollment?.completedLessonIds.some(
    (id: Types.ObjectId) => String(id) === String(lesson!._id)
  );

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[240px_1fr]">
      <aside className="space-y-2">
        <Link href={`/courses/${slug}`} className="text-sm text-blue-700 hover:underline">
          ← {course.title}
        </Link>
        <nav className="mt-4 space-y-1">
          {allLessons.map((l: { slug: string; title: string }) => (
            <Link
              key={l.slug}
              href={`/learn/${slug}/${l.slug}`}
              className={`block rounded-lg px-3 py-2 text-sm ${
                l.slug === lessonSlug
                  ? "bg-blue-50 font-medium text-blue-900"
                  : "text-stone-600 hover:bg-stone-100"
              }`}
            >
              {l.title}
            </Link>
          ))}
        </nav>
        {enrollment && (
          <p className="pt-4 text-xs text-stone-500">Progress {enrollment.progressPercent}%</p>
        )}
      </aside>

      <div className="space-y-6">
        <div>
          <p className="text-sm text-stone-500">{chapter.title}</p>
          <h1 className="font-serif text-3xl text-stone-900">{lesson.title}</h1>
        </div>

        {chapter.isScorm ? (
          <ScormPlayer
            courseId={String(course._id)}
            chapterId={String(chapter._id)}
            launchPath={chapter.scormLaunchPath || chapter.scormPackageUrl || ""}
          />
        ) : (
          <>
            {lesson.videoUrl && (
              <Card>
                <CardContent className="p-4">
                  <VideoEmbed url={lesson.videoUrl} />
                </CardContent>
              </Card>
            )}
            {lesson.pdfUrl && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">PDF resource</CardTitle>
                </CardHeader>
                <CardContent>
                  <a
                    href={lesson.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-700 hover:underline"
                  >
                    Open PDF
                  </a>
                </CardContent>
              </Card>
            )}
            {lesson.contentHtml && (
              <div
                className="prose-lesson rounded-2xl border border-stone-200 bg-white p-6"
                dangerouslySetInnerHTML={{ __html: lesson.contentHtml }}
              />
            )}
          </>
        )}

        {quiz && (
          <QuizPlayer
            quiz={JSON.parse(JSON.stringify(quiz))}
            courseId={String(course._id)}
            lessonId={String(lesson._id)}
          />
        )}

        {assignment && (
          <AssignmentSubmit
            assignment={JSON.parse(JSON.stringify(assignment))}
            courseId={String(course._id)}
            lessonId={String(lesson._id)}
          />
        )}

        {exercise && (
          <ExercisePlayer exercise={JSON.parse(JSON.stringify(exercise))} />
        )}

        <DiscussionPanel
          courseId={String(course._id)}
          lessonId={String(lesson._id)}
          threads={JSON.parse(JSON.stringify(threads))}
        />

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 pt-4">
          <div className="flex gap-2">
            {prev && (
              <Link href={`/learn/${slug}/${prev.slug}`}>
                <Button variant="outline">Previous</Button>
              </Link>
            )}
            {next && (
              <Link href={`/learn/${slug}/${next.slug}`}>
                <Button variant="outline">Next</Button>
              </Link>
            )}
          </div>
          {enrollment && !chapter.isScorm && (
            <CompleteLessonButton
              courseId={String(course._id)}
              chapterId={String(chapter._id)}
              lessonId={String(lesson._id)}
              completed={!!completed}
            />
          )}
        </div>
      </div>
    </div>
  );
}

