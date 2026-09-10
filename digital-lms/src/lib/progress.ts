import { Types } from "mongoose";
import { Course } from "@/models/Course";
import type { ICourse } from "@/models/Course";
import { Enrollment } from "@/models/Enrollment";
import {
  Certificate,
  CertificateTemplate,
  Badge,
  UserBadge,
} from "@/models/Certificate";
import { User } from "@/models/User";
import { getSettings } from "@/models/Settings";
import { percent } from "@/lib/utils";
import { DEFAULT_CERT_CSS, DEFAULT_CERT_HTML } from "@/lib/certificate-defaults";

export { DEFAULT_CERT_CSS, DEFAULT_CERT_HTML } from "@/lib/certificate-defaults";

export function countLessons(course: ICourse) {
  return course.chapters.reduce((acc, ch) => {
    if (ch.isScorm) return acc + 1;
    return acc + ch.lessons.length;
  }, 0);
}

export async function markLessonComplete(
  userId: string,
  courseId: string,
  chapterId: string,
  lessonId: string,
  options?: { skipGate?: boolean }
) {
  const course = await Course.findById(courseId);
  if (!course) throw new Error("Course not found");

  if (!options?.skipGate) {
    const { evaluateLessonGate } = await import("@/lib/lesson-criteria");
    const gate = await evaluateLessonGate(userId, courseId, chapterId, lessonId);
    if (!gate.ready) {
      const err = new Error(gate.reasons[0] || "Lesson requirements not met");
      (err as Error & { status: number; reasons: string[] }).status = 400;
      (err as Error & { status: number; reasons: string[] }).reasons = gate.reasons;
      throw err;
    }
  }

  let enrollment = await Enrollment.findOne({ userId, courseId });
  if (!enrollment) {
    enrollment = await Enrollment.create({
      userId,
      courseId,
      source: "self",
    });
  }

  const already = enrollment.completedLessonIds.some(
    (id: Types.ObjectId) => String(id) === lessonId
  );
  if (!already) {
    enrollment.completedLessonIds.push(new Types.ObjectId(lessonId));
  }

  const lp = enrollment.lessonProgress.find(
    (p: { lessonId: Types.ObjectId }) => String(p.lessonId) === lessonId
  );
  if (lp) {
    lp.completed = true;
    lp.completedAt = new Date();
  } else {
    enrollment.lessonProgress.push({
      lessonId: new Types.ObjectId(lessonId),
      chapterId: new Types.ObjectId(chapterId),
      completed: true,
      completedAt: new Date(),
      videoWatchSeconds: 0,
      watchedSeconds: 0,
      durationSeconds: 0,
      readDwellSeconds: 0,
      reachedEnd: false,
    });
  }

  const total = countLessons(course);
  enrollment.progressPercent = percent(enrollment.completedLessonIds.length, total);

  if (total > 0 && enrollment.completedLessonIds.length >= total) {
    enrollment.completed = true;
    enrollment.completedAt = new Date();
    if (course.enableCertification && !enrollment.certificateId) {
      const cert = await issueCertificate(userId, courseId);
      enrollment.certificateId = cert._id;
    }
    await awardCourseBadges(userId, courseId);
  }

  await enrollment.save();
  return enrollment;
}

export async function awardCourseBadges(userId: string, courseId: string) {
  const badges = await Badge.find({
    courseId,
    autoAwardOnCourseComplete: true,
  });
  for (const badge of badges) {
    await UserBadge.findOneAndUpdate(
      { userId, badgeId: badge._id },
      {
        $setOnInsert: {
          userId,
          badgeId: badge._id,
          courseId,
          awardedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );
  }
}

export async function issueCertificate(userId: string, courseId: string, batchId?: string) {
  const existing = await Certificate.findOne({ userId, courseId });
  if (existing) return existing;

  const user = await User.findById(userId);
  const course = await Course.findById(courseId);
  if (!user || !course) throw new Error("User or course not found");

  const template = await CertificateTemplate.findOne({ isDefault: true });

  const certificateNumber = `DP-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;

  return Certificate.create({
    userId,
    courseId,
    batchId,
    templateId: template?._id,
    certificateNumber,
    recipientName: user.name,
    courseTitle: course.title,
    issuedAt: new Date(),
  });
}

export function renderCertificateHtml(
  template: string,
  data: {
    recipientName: string;
    courseTitle: string;
    issuedAt: string;
    certificateNumber: string;
    backgroundImageUrl?: string;
  },
  css = ""
) {
  const filled = template
    .replaceAll("{{recipientName}}", data.recipientName)
    .replaceAll("{{name}}", data.recipientName)
    .replaceAll("{{courseTitle}}", data.courseTitle)
    .replaceAll("{{course}}", data.courseTitle)
    .replaceAll("{{issuedAt}}", data.issuedAt)
    .replaceAll("{{date}}", data.issuedAt)
    .replaceAll("{{certificateNumber}}", data.certificateNumber)
    .replaceAll("{{number}}", data.certificateNumber);

  const bg = data.backgroundImageUrl
    ? `background-image:url('${data.backgroundImageUrl}');background-size:cover;background-position:center;`
    : "";

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>
body{margin:0;padding:24px;font-family:Georgia,serif;${bg}}
${css}
</style></head><body>${filled}</body></html>`;
}

export async function getCertificateRenderSource(templateId?: string | null) {
  if (templateId) {
    const t = await CertificateTemplate.findById(templateId).lean();
    if (t) return t;
  }
  const def = await CertificateTemplate.findOne({ isDefault: true }).lean();
  if (def) return def;
  const settings = await getSettings();
  return {
    html: settings.defaultCertificateHtml,
    css: "",
    backgroundImageUrl: undefined as string | undefined,
    widthPx: 1000,
    heightPx: 700,
  };
}