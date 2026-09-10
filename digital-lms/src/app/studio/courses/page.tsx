import Link from "next/link";
import { connectDB } from "@/lib/db";
import { Course } from "@/models/Course";
import { Button } from "@/components/ui/button";
import { StudioCourseList } from "@/components/studio/course-list";

export const dynamic = "force-dynamic";

export default async function StudioCoursesPage() {
  await connectDB();
  const courses = await Course.find().sort({ updatedAt: -1 }).lean();
  const rows = courses.map((c) => ({
    _id: String(c._id),
    title: c.title,
    slug: c.slug,
    published: !!c.published,
    chapters: c.chapters || [],
  }));

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-blue-950">Courses</h1>
          <p className="text-stone-600">Build chapters, lessons, videos, quizzes, and SCORM.</p>
        </div>
        <Link href="/studio/courses/new">
          <Button>New course</Button>
        </Link>
      </div>
      <StudioCourseList courses={rows} />
    </div>
  );
}
