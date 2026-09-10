import Link from "next/link";
import { connectDB } from "@/lib/db";
import { Program } from "@/models/Program";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function StudioProgramsPage() {
  await connectDB();
  const programs = await Program.find().sort({ createdAt: -1 }).lean();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl text-teal-950">Programs</h1>
          <p className="text-stone-600">Multi-course learning paths.</p>
        </div>
        <Link href="/studio/programs/new">
          <Button>New program</Button>
        </Link>
      </div>
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-stone-500">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Courses</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {programs.map((p) => (
              <tr key={String(p._id)} className="border-b border-stone-100 last:border-0">
                <td className="px-4 py-3 font-medium">{p.title}</td>
                <td className="px-4 py-3">{p.courseIds?.length || 0}</td>
                <td className="px-4 py-3">
                  <Badge variant={p.published ? "success" : "muted"}>
                    {p.published ? "Published" : "Draft"}
                  </Badge>
                </td>
              </tr>
            ))}
            {!programs.length && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-stone-500">
                  No programs yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
