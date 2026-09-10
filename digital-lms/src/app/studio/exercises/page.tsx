import Link from "next/link";
import { connectDB } from "@/lib/db";
import { ProgrammingExercise } from "@/models/ProgrammingExercise";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function StudioExercisesPage() {
  await connectDB();
  const exercises = await ProgrammingExercise.find().sort({ createdAt: -1 }).lean();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl text-blue-950">Programming exercises</h1>
          <p className="text-stone-600">Code challenges with test cases.</p>
        </div>
        <Link href="/studio/exercises/new">
          <Button>New exercise</Button>
        </Link>
      </div>
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-stone-500">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Language</th>
              <th className="px-4 py-3 font-medium">Tests</th>
              <th className="px-4 py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {exercises.map((ex) => (
              <tr key={String(ex._id)} className="border-b border-stone-100 last:border-0">
                <td className="px-4 py-3 font-medium">{ex.title}</td>
                <td className="px-4 py-3">{ex.language}</td>
                <td className="px-4 py-3">{ex.testCases?.length || 0}</td>
                <td className="px-4 py-3 text-stone-500">{formatDate(ex.createdAt)}</td>
              </tr>
            ))}
            {!exercises.length && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-stone-500">
                  No exercises yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
