import { User } from "@/models/User";
import { Course } from "@/models/Course";
import { Quiz } from "@/models/Quiz";
import { Assignment } from "@/models/Assignment";
import { Batch } from "@/models/Batch";
import { Job } from "@/models/Job";
import { Program } from "@/models/Program";
import { getSettings } from "@/models/Settings";
import { hashPassword } from "@/lib/auth";
import { Role } from "@/lib/constants";

declare global {
  // eslint-disable-next-line no-var
  var __dpSeedPromise: Promise<void> | undefined;
}

/**
 * Creates seed users from ENV (no hardcoded emails/passwords).
 * Safe to call on every request — runs once per process.
 */
export async function ensureSeed() {
  if (!global.__dpSeedPromise) {
    global.__dpSeedPromise = runSeed().catch((err) => {
      global.__dpSeedPromise = undefined;
      throw err;
    });
  }
  return global.__dpSeedPromise;
}

function envValue(name: string) {
  return (process.env[name] || "").trim();
}

async function upsertSeedUser({
  emailVar,
  passwordVar,
  nameVar,
  fallbackName,
  roles,
  reset = false,
}: {
  emailVar: string;
  passwordVar: string;
  nameVar: string;
  fallbackName: string;
  roles: Role[];
  reset?: boolean;
}) {
  const email = envValue(emailVar).toLowerCase();
  const password = envValue(passwordVar);
  if (!email && !password) return null;
  if (!email || !password) {
    console.warn(`[seed] ${emailVar} and ${passwordVar} must both be set to seed that account`);
    return null;
  }

  const name = envValue(nameVar) || fallbackName;
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      email,
      name,
      passwordHash: await hashPassword(password),
      roles,
    });
    console.log(`[seed] Created account ${email}`);
    return user;
  }

  if (reset) {
    user.passwordHash = await hashPassword(password);
    user.roles = roles;
    user.isActive = true;
    if (name) user.name = name;
    await user.save();
    console.log(`[seed] Reset password for ${email}`);
  }
  return user;
}

async function runSeed() {
  await getSettings();

  let admin = await upsertSeedUser({
    emailVar: "SEED_ADMIN_EMAIL",
    passwordVar: "SEED_ADMIN_PASSWORD",
    nameVar: "SEED_ADMIN_NAME",
    fallbackName: "Admin",
    roles: ["admin", "instructor", "evaluator"],
    reset: process.env.SEED_RESET_ADMIN_PASSWORD === "1",
  });

  let instructor = await upsertSeedUser({
    emailVar: "SEED_INSTRUCTOR_EMAIL",
    passwordVar: "SEED_INSTRUCTOR_PASSWORD",
    nameVar: "SEED_INSTRUCTOR_NAME",
    fallbackName: "Instructor",
    roles: ["instructor", "evaluator"],
  });

  await upsertSeedUser({
    emailVar: "SEED_STUDENT_EMAIL",
    passwordVar: "SEED_STUDENT_PASSWORD",
    nameVar: "SEED_STUDENT_NAME",
    fallbackName: "Student",
    roles: ["student"],
  });

  // Demo content only when no courses exist
  if ((await Course.countDocuments()) > 0) return;

  if (!admin) {
    admin = await User.findOne({ roles: "admin" });
  }
  if (!admin) {
    console.warn("[seed] No admin from ENV or database; skip demo content");
    return;
  }
  instructor = instructor || admin;

  let quiz = await Quiz.findOne({ title: "Digital Skills Basics Quiz" });
  if (!quiz) {
    quiz = await Quiz.create({
      title: "Digital Skills Basics Quiz",
      description: "Check your understanding of core digital concepts.",
      createdBy: admin._id,
      passingScore: 70,
      questions: [
        {
          type: "single",
          prompt: "What does LMS stand for?",
          options: [
            { text: "Learning Management System", isCorrect: true },
            { text: "Local Media Server", isCorrect: false },
            { text: "Live Meeting Suite", isCorrect: false },
          ],
          points: 1,
        },
        {
          type: "multiple",
          prompt: "Which are content types supported by this platform?",
          options: [
            { text: "Videos", isCorrect: true },
            { text: "PDFs", isCorrect: true },
            { text: "SCORM", isCorrect: true },
            { text: "Fax machines", isCorrect: false },
          ],
          points: 2,
        },
        {
          type: "open",
          prompt: "In one sentence, why does structured learning matter?",
          options: [],
          points: 2,
        },
      ],
    });
  }

  let assignment = await Assignment.findOne({ title: "Reflection Assignment" });
  if (!assignment) {
    assignment = await Assignment.create({
      title: "Reflection Assignment",
      description: "Upload a one-page PDF reflecting on what you learned.",
      createdBy: admin._id,
    });
  }

  let course = await Course.findOne({ slug: "digital-skills-foundations" });
  if (!course) {
    course = await Course.create({
      title: "Digital Skills Foundations",
      slug: "digital-skills-foundations",
      shortIntroduction: "Build confidence with modern digital tools and learning habits.",
      description:
        "A structured journey covering digital literacy, collaboration tools, and how to learn effectively online.",
      category: "Digital Skills",
      tags: ["beginner", "penang", "digital"],
      published: true,
      publishedAt: new Date(),
      instructors:
        String(instructor._id) === String(admin._id)
          ? [admin._id]
          : [admin._id, instructor._id],
      createdBy: admin._id,
      enableCertification: true,
      chapters: [
        {
          title: "Getting Started",
          order: 0,
          isScorm: false,
          lessons: [
            {
              title: "Welcome to Digital Penang LMS",
              slug: "welcome",
              order: 0,
              isPreview: true,
              contentHtml:
                "<p>Welcome! This course guides you step by step through essential digital skills.</p>",
              durationMinutes: 5,
            },
            {
              title: "How structured learning works",
              slug: "structured-learning",
              order: 1,
              isPreview: false,
              contentHtml:
                "<p>Courses contain chapters. Chapters contain lessons. Progress is tracked as you complete each lesson.</p>",
              videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
              durationMinutes: 8,
            },
          ],
        },
        {
          title: "Practice & Assessment",
          order: 1,
          isScorm: false,
          lessons: [
            {
              title: "Knowledge check",
              slug: "knowledge-check",
              order: 0,
              quizId: quiz._id,
              contentHtml: "<p>Complete the quiz embedded below to check your understanding.</p>",
            },
            {
              title: "Reflection upload",
              slug: "reflection-upload",
              order: 1,
              assignmentId: assignment._id,
              contentHtml: "<p>Upload your reflection PDF to finish the course.</p>",
            },
          ],
        },
      ],
    });
  }

  if (!(await Batch.findOne({ slug: "april-cohort" }))) {
    const start = new Date();
    start.setDate(start.getDate() + 7);
    await Batch.create({
      title: "April Digital Skills Cohort",
      slug: "april-cohort",
      description: "Instructor-led cohort with live sessions and guided progress.",
      courseIds: [course._id],
      startDate: start,
      endDate: new Date(start.getTime() + 1000 * 60 * 60 * 24 * 30),
      seatCount: 40,
      published: true,
      instructors: [instructor._id],
      evaluators: [instructor._id],
      createdBy: admin._id,
      liveClasses: [
        {
          title: "Kickoff live session",
          description: "Meet your instructor and cohort.",
          startAt: start,
          durationMinutes: 60,
          meetingUrl: "https://meet.google.com/lookup/demo",
          provider: "google_meet",
          attendees: [],
          createdBy: admin._id,
        },
      ],
      announcements: [
        {
          title: "Welcome to the cohort",
          body: "Please complete the first chapter before the kickoff session.",
          createdBy: admin._id,
        },
      ],
      timetable: [
        {
          title: "Week 1 — Foundations",
          date: start,
          startTime: "10:00",
          endTime: "11:00",
          legend: "Live",
        },
      ],
    });
  }

  if (!(await Program.findOne({ slug: "digital-career-path" }))) {
    await Program.create({
      title: "Digital Career Path",
      slug: "digital-career-path",
      description: "A multi-course journey from foundations to job readiness.",
      courseIds: [course._id],
      enforceOrder: true,
      published: true,
      createdBy: admin._id,
    });
  }

  if (!(await Job.findOne({ title: "Junior Digital Associate" }))) {
    await Job.create({
      title: "Junior Digital Associate",
      companyName: "Digital Penang",
      location: "George Town",
      country: "Malaysia",
      type: "full_time",
      description:
        "Join our team to support digital programs across Penang. Ideal for certified LMS graduates.",
      requirements: "Digital Skills Foundations certificate preferred.",
      status: "open",
      postedBy: admin._id,
    });
  }

  console.log("[seed] Demo content ready");
}
