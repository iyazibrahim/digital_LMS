import { Types } from "mongoose";
import { Course } from "@/models/Course";
import type { ICourse } from "@/models/Course";
import { Enrollment } from "@/models/Enrollment";
import { Certificate } from "@/models/Certificate";
import { User } from "@/models/User";
import { percent } from "@/lib/utils";

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
  lessonId: string
) {
  const course = await Course.findById(courseId);
  if (!course) throw new Error("Course not found");

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
  }

  await enrollment.save();
  return enrollment;
}

export async function issueCertificate(userId: string, courseId: string, batchId?: string) {
  const existing = await Certificate.findOne({ userId, courseId });
  if (existing) return existing;

  const user = await User.findById(userId);
  const course = await Course.findById(courseId);
  if (!user || !course) throw new Error("User or course not found");

  const certificateNumber = `DP-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;

  return Certificate.create({
    userId,
    courseId,
    batchId,
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
  }
) {
  return template
    .replaceAll("{{recipientName}}", data.recipientName)
    .replaceAll("{{courseTitle}}", data.courseTitle)
    .replaceAll("{{issuedAt}}", data.issuedAt)
    .replaceAll("{{certificateNumber}}", data.certificateNumber);
}
