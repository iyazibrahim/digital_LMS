import Link from "next/link";
import { connectDB } from "@/lib/db";
import { Course } from "@/models/Course";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/card";
import { CoursesFilter } from "@/components/course/courses-filter";

export const dynamic = "force-dynamic";

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; tag?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q || "").trim();
  const category = (sp.category || "").trim();
  const tag = (sp.tag || "").trim();

  await connectDB();

  const filter: Record<string, unknown> = { published: true };
  if (category) filter.category = category;
  if (tag) filter.tags = tag;
  if (q) {
    filter.$or = [
      { title: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
      { shortIntroduction: { $regex: q, $options: "i" } },
      { tags: { $regex: q, $options: "i" } },
    ];
  }

  const [courses, categories] = await Promise.all([
    Course.find(filter).sort({ publishedAt: -1 }).lean(),
    Course.distinct("category", { published: true, category: { $nin: [null, ""] } }),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-serif text-3xl text-stone-900">Courses</h1>
      <p className="mt-2 text-stone-600">Structured learning journeys with chapters and lessons.</p>

      <div className="mt-6">
        <CoursesFilter
          q={q}
          category={category}
          tag={tag}
          categories={(categories as string[]).filter(Boolean).sort()}
        />
      </div>

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
                {c.tags?.length ? (
                  <p className="mt-1 line-clamp-1 text-xs text-stone-400">{c.tags.join(" · ")}</p>
                ) : null}
              </CardContent>
            </Card>
          </Link>
        ))}
        {!courses.length && (
          <p className="text-stone-500 col-span-full">
            No courses match your filters. Try clearing search or category.
          </p>
        )}
      </div>
    </div>
  );
}
