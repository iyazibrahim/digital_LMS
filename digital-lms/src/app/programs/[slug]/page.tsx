import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { Program, ProgramMember } from "@/models/Program";
import { getSession } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgramEnrollButton } from "@/components/program/enroll-button";

export const dynamic = "force-dynamic";

type PopulatedCourse = {
  _id: string;
  title: string;
  slug: string;
  shortIntroduction?: string;
};

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await connectDB();
  const program = await Program.findOne({ slug })
    .populate("courseIds", "title slug shortIntroduction")
    .lean();
  if (!program || !program.published) notFound();

  const session = await getSession();
  let enrolled = false;
  if (session) {
    enrolled = !!(await ProgramMember.findOne({
      programId: program._id,
      userId: session.sub,
    }));
  }

  const courses = (program.courseIds || []) as unknown as PopulatedCourse[];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-serif text-4xl">{program.title}</h1>
      <p className="mt-3 text-lg text-stone-600">{program.description}</p>
      {program.enforceOrder && (
        <p className="mt-2 text-sm text-stone-500">Courses are meant to be taken in order.</p>
      )}
      <div className="mt-6">
        {enrolled ? (
          <p className="text-blue-800">You are enrolled in this program.</p>
        ) : (
          <ProgramEnrollButton programId={String(program._id)} />
        )}
      </div>
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Courses in order</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {courses.map((c, i) => (
            <div key={String(c._id)} className="rounded-lg border border-stone-100 p-3">
              <p className="text-xs text-stone-400">Step {i + 1}</p>
              <Link
                href={`/courses/${c.slug}`}
                className="font-medium text-blue-800 hover:underline"
              >
                {c.title}
              </Link>
              <p className="text-sm text-stone-500">{c.shortIntroduction}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
