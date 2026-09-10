import Link from "next/link";
import { connectDB } from "@/lib/db";
import { Course } from "@/models/Course";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function StudioCoursesPage() {
  await connectDB();
  const courses = await Course.find().sort({ updatedAt: -1 }).lean();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl">Courses</h1>
        <Link href="/studio/courses/new">
          <Button>New course</Button>
        </Link>
      </div>
      <div className="mt-6 space-y-3">
        {courses.map((c) => (
          <Link key={String(c._id)} href={`/studio/courses/${c._id}`}>
            <Card className="mb-3 hover:border-blue-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">{c.title}</CardTitle>
                <Badge variant={c.published ? "success" : "muted"}>
                  {c.published ? "Published" : "Draft"}
                </Badge>
              </CardHeader>
              <CardContent className="text-sm text-stone-500">
                {c.chapters?.length || 0} chapters · /{c.slug}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
