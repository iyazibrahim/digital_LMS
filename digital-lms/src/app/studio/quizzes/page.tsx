import Link from "next/link";
import { connectDB } from "@/lib/db";
import { Quiz } from "@/models/Quiz";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function StudioQuizzesPage() {
  await connectDB();
  const quizzes = await Quiz.find().sort({ updatedAt: -1 }).lean();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl text-teal-950">Quizzes</h1>
          <p className="text-stone-600">Build assessments with optional proctoring.</p>
        </div>
        <Link href="/studio/quizzes/new">
          <Button>New quiz</Button>
        </Link>
      </div>
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-stone-500">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Questions</th>
              <th className="px-4 py-3 font-medium">Proctoring</th>
              <th className="px-4 py-3 font-medium">Updated</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {quizzes.map((q) => (
              <tr key={String(q._id)} className="border-b border-stone-100 last:border-0">
                <td className="px-4 py-3 font-medium">{q.title}</td>
                <td className="px-4 py-3">{q.questions?.length || 0}</td>
                <td className="px-4 py-3">
                  <Badge variant={q.enableProctoring ? "warning" : "muted"}>
                    {q.enableProctoring ? "On" : "Off"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-stone-500">{formatDate(q.updatedAt)}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/studio/quizzes/${q._id}`} className="text-teal-700 hover:underline">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {!quizzes.length && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-stone-500">
                  No quizzes yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
