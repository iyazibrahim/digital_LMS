import Link from "next/link";
import { connectDB } from "@/lib/db";
import { Program } from "@/models/Program";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function ProgramsPage() {
  await connectDB();
  const programs = await Program.find({ published: true })
    .populate("courseIds", "title")
    .sort({ createdAt: -1 })
    .lean();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-serif text-3xl text-stone-900">Programs</h1>
      <p className="mt-2 text-stone-600">Curated multi-course learning paths.</p>
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {programs.map((p) => (
          <Link key={String(p._id)} href={`/programs/${p.slug}`}>
            <Card className="h-full hover:border-blue-300">
              <CardHeader>
                <Badge variant="default">Program</Badge>
                <CardTitle className="mt-2 font-serif">{p.title}</CardTitle>
                <CardDescription>{p.description}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-stone-500">
                {p.courseIds?.length || 0} courses
                {p.enforceOrder ? " · Ordered path" : ""}
              </CardContent>
            </Card>
          </Link>
        ))}
        {!programs.length && <p className="text-stone-500">No published programs yet.</p>}
      </div>
    </div>
  );
}
