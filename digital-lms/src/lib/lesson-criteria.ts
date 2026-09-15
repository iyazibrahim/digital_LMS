import { Types } from "mongoose";
import { Course, type ILesson, type IChapter } from "@/models/Course";
import { Enrollment, type ILessonProgress } from "@/models/Enrollment";
import { QuizSubmission } from "@/models/Quiz";
import { AssignmentSubmission } from "@/models/Assignment";
import { ProgrammingExercise, ProgrammingSubmission } from "@/models/ProgrammingExercise";
import { getSettings } from "@/models/Settings";

export type LessonGateKind =
  | "video"
  | "reading"
  | "quiz"
  | "assignment"
  | "exercise"
  | "scorm"
  | "empty";

export type GateStatus = {
  ready: boolean;
  reasons: string[];
  kind: LessonGateKind;
  progress?: {
    watchedSeconds: number;
    durationSeconds: number;
    watchPercent: number;
    readDwellSeconds: number;
    reachedEnd: boolean;
    minWatchPercent: number;
    minReadSeconds: number;
    minScormSeconds: number;
  };
};

function findLesson(
  course: { chapters: IChapter[] },
  chapterId: string,
  lessonId: string
): { chapter: IChapter; lesson: ILesson | null; isScorm: boolean } | null {
  const chapter = course.chapters.find((ch) => String(ch._id) === chapterId);
  if (!chapter) return null;
  if (chapter.isScorm) {
    return { chapter, lesson: null, isScorm: true };
  }
  const lesson = chapter.lessons.find((l) => String(l._id) === lessonId) || null;
  return { chapter, lesson, isScorm: false };
}

function getOrCreateLp(
  enrollment: { lessonProgress: ILessonProgress[] },
  chapterId: string,
  lessonId: string
): ILessonProgress {
  let lp = enrollment.lessonProgress.find((p) => String(p.lessonId) === lessonId);
  if (!lp) {
    lp = {
      lessonId: new Types.ObjectId(lessonId),
      chapterId: new Types.ObjectId(chapterId),
      completed: false,
      videoWatchSeconds: 0,
      watchedSeconds: 0,
      durationSeconds: 0,
      readDwellSeconds: 0,
      reachedEnd: false,
    };
    enrollment.lessonProgress.push(lp);
  }
  // Backfill newer fields on old docs
  if (lp.watchedSeconds == null) lp.watchedSeconds = lp.videoWatchSeconds || 0;
  if (lp.durationSeconds == null) lp.durationSeconds = 0;
  if (lp.readDwellSeconds == null) lp.readDwellSeconds = 0;
  if (lp.reachedEnd == null) lp.reachedEnd = false;
  return lp;
}

export async function evaluateLessonGate(
  userId: string,
  courseId: string,
  chapterId: string,
  lessonId: string
): Promise<GateStatus> {
  const settings = await getSettings();
  const minWatchPercent = settings.minWatchPercent ?? 80;
  const minReadSeconds = settings.minReadSeconds ?? 20;
  const minScormSeconds = settings.minScormSeconds ?? 30;

  const course = await Course.findById(courseId);
  if (!course) {
    return { ready: false, reasons: ["Course not found"], kind: "empty" };
  }

  const found = findLesson(course, chapterId, lessonId);
  if (!found) {
    return { ready: false, reasons: ["Lesson not found"], kind: "empty" };
  }

  const enrollment = await Enrollment.findOne({ userId, courseId });
  const lp = enrollment
    ? getOrCreateLp(enrollment, chapterId, lessonId)
    : ({
        watchedSeconds: 0,
        durationSeconds: 0,
        readDwellSeconds: 0,
        reachedEnd: false,
        videoWatchSeconds: 0,
      } as ILessonProgress);

  const watched = Math.max(lp.watchedSeconds || 0, lp.videoWatchSeconds || 0);
  const duration = lp.durationSeconds || 0;
  const watchPercent = duration > 0 ? Math.round((watched / duration) * 100) : 0;

  const progress = {
    watchedSeconds: watched,
    durationSeconds: duration,
    watchPercent,
    readDwellSeconds: lp.readDwellSeconds || 0,
    reachedEnd: !!lp.reachedEnd,
    minWatchPercent,
    minReadSeconds,
    minScormSeconds,
  };

  if (found.isScorm) {
    const reasons: string[] = [];
    if (watched < minScormSeconds) {
      reasons.push(`Stay in the SCORM player for at least ${minScormSeconds}s`);
    }
    return { ready: reasons.length === 0, reasons, kind: "scorm", progress };
  }

  const lesson = found.lesson!;
  const reasons: string[] = [];
  let kind: LessonGateKind = "empty";

  const hasVideo = !!lesson.videoUrl;
  const hasReading = !!(lesson.contentHtml || lesson.pdfUrl);
  const hasQuiz = !!lesson.quizId;
  const hasAssignment = !!lesson.assignmentId;
  const hasExercise = !!lesson.programmingExerciseId;

  if (hasVideo) {
    kind = "video";
    if (duration <= 0) {
      reasons.push("Start the video so we can track watch progress");
    } else if (watchPercent < minWatchPercent) {
      reasons.push(`Watch at least ${minWatchPercent}% of the video (${watchPercent}% so far)`);
    }
  }

  if (hasReading) {
    if (kind === "empty") kind = "reading";
    if (!lp.reachedEnd) {
      reasons.push("Scroll to the end of the reading");
    }
    if ((lp.readDwellSeconds || 0) < minReadSeconds) {
      reasons.push(`Spend at least ${minReadSeconds}s reading (${lp.readDwellSeconds || 0}s so far)`);
    }
  }

  if (hasQuiz) {
    if (kind === "empty") kind = "quiz";
    // Accept a passing attempt OR an open-answer submission awaiting / after instructor review.
    // Also accept legacy open-answer attempts that predate the `status` field.
    const sub = await QuizSubmission.findOne({
      quizId: lesson.quizId,
      userId,
    })
      .sort({ submittedAt: -1 })
      .lean();
    if (!sub) {
      reasons.push("Pass the quiz");
    } else {
      const hasOpenText = (sub.answers || []).some(
        (a: { openAnswer?: string }) => !!(a.openAnswer && String(a.openAnswer).trim())
      );
      const accepted =
        sub.passed === true ||
        sub.status === "pending_review" ||
        sub.status === "graded" ||
        (hasOpenText && sub.status !== "auto_graded");
      // Legacy: open text + not explicitly auto-passed → treat as submitted for progression
      const legacyOpenOk = hasOpenText && sub.passed === false && !sub.status;
      if (!accepted && !legacyOpenOk) {
        reasons.push("Pass the quiz (previous attempt did not meet the passing score)");
      }
    }
  }

  if (hasAssignment) {
    if (kind === "empty") kind = "assignment";
    const sub = await AssignmentSubmission.findOne({
      assignmentId: lesson.assignmentId,
      userId,
    }).lean();
    if (!sub) {
      reasons.push("Submit the assignment");
    }
  }

  if (hasExercise) {
    if (kind === "empty") kind = "exercise";
    const exercise = await ProgrammingExercise.findById(lesson.programmingExerciseId).lean();
    const exKind = (exercise as { kind?: string } | null)?.kind || "coding";
    const sub = await ProgrammingSubmission.findOne({
      exerciseId: lesson.programmingExerciseId,
      userId,
    })
      .sort({ createdAt: -1 })
      .lean();
    if (!sub) {
      reasons.push("Submit the exercise");
    } else if ((exKind === "coding" || exKind === "short_answer") && !sub.passed) {
      reasons.push("Pass the exercise");
    }
  }

  // Empty content lesson — allow complete after brief dwell
  if (!hasVideo && !hasReading && !hasQuiz && !hasAssignment && !hasExercise) {
    kind = "empty";
    if ((lp.readDwellSeconds || 0) < Math.min(5, minReadSeconds)) {
      reasons.push("Open this lesson for a few seconds before marking complete");
    }
  }

  return { ready: reasons.length === 0, reasons, kind, progress };
}

export { getOrCreateLp };
