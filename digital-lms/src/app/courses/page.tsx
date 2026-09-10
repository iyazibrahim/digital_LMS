import Link from "next/link";
import { connectDB } from "@/lib/db";
import { Course } from "@/models/Course";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  await connectDB();
  const courses = await Course.find({ published: true }).sort({ publishedAt: -1 }).lean();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-serif text-3xl text-stone-900">Courses</h1>
      <p className="mt-2 text-stone-600">Structured learning journeys with chapters and lessons.</p>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((c) => (
          <Link key={String(c._id)} href={`/courses/${c.slug}`}>
            <Card className="h-full transition hover:border-blue-300 hover:shadow-md">
              <CardHeader>
                {c.category && <Badge variant="muted">{c.category}</Badge>}
                <CardTitle className="mt-2 font-serif">{c.title}</CardTitle>
                <CardDescription>{c.shortIntroduction}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-stone-500">
                {c.chapters?.length || 0} chapters ·{" "}
                {c.paid ? `${c.currency} ${c.price}` : "Free"}
                {c.enableCertification ? " · Certificate" : ""}
              </CardContent>
            </Card>
          </Link>
        ))}
        {!courses.length && (
          <p className="text-stone-500">No published courses yet. Seed the database to get started.</p>
        )}
      </div>
    </div>
  );
}
