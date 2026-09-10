import Link from "next/link";
import { connectDB } from "@/lib/db";
import { Course } from "@/models/Course";
import { Button } from "@/components/ui/button";
import { StudioCourseList } from "@/components/studio/course-list";
import { StudioPagination } from "@/components/studio/pagination";
import { paginateQuery } from "@/lib/paginate";

export const dynamic = "force-dynamic";

export default async function StudioCoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  await connectDB();
  const { items: courses, total, totalPages } = await paginateQuery<{
    _id: unknown;
    title: string;
    slug: string;
    published?: boolean;
    chapters?: unknown[];
  }>(Course, {}, {
    page,
    pageSize: 20,
    sort: { updatedAt: -1 },
  });
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
      <div className="mt-4">
        <StudioPagination
          page={page}
          totalPages={totalPages}
          total={total}
          basePath="/studio/courses"
        />
      </div>
    </div>
  );
}
