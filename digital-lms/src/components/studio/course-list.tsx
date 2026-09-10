"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/card";

type CourseRow = {
  _id: string;
  title: string;
  slug: string;
  published: boolean;
  chapters?: unknown[];
};

export function StudioCourseList({ courses: initial }: { courses: CourseRow[] }) {
  const router = useRouter();
  const [courses, setCourses] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);

  async function remove(id: string) {
    if (!confirm("Delete this course permanently?")) return;
    setBusy(id);
    const res = await fetch(`/api/courses/${id}`, { method: "DELETE" });
    setBusy(null);
    if (res.ok) {
      setCourses((c) => c.filter((x) => x._id !== id));
      router.refresh();
    } else {
      alert("Delete failed (admin only)");
    }
  }

  async function togglePublish(c: CourseRow) {
    setBusy(c._id);
    const res = await fetch(`/api/courses/${c._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !c.published }),
    });
    setBusy(null);
    if (res.ok) {
      setCourses((list) =>
        list.map((x) => (x._id === c._id ? { ...x, published: !c.published } : x))
      );
      router.refresh();
    }
  }

  return (
    <div className="mt-6 space-y-3">
      {courses.map((c) => (
        <Card key={c._id} className="border-stone-200">
          <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">{c.title}</CardTitle>
              <p className="mt-1 text-sm text-stone-500">
                {c.chapters?.length || 0} chapters · /{c.slug}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={c.published ? "success" : "muted"}>
                {c.published ? "Published" : "Draft"}
              </Badge>
              <Link href={`/studio/courses/${c._id}`}>
                <Button size="sm">Edit content</Button>
              </Link>
              <Button
                size="sm"
                variant="outline"
                disabled={busy === c._id}
                onClick={() => togglePublish(c)}
              >
                {c.published ? "Unpublish" : "Publish"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-red-700"
                disabled={busy === c._id}
                onClick={() => remove(c._id)}
              >
                Delete
              </Button>
            </div>
          </CardHeader>
        </Card>
      ))}
      {!courses.length && <p className="text-stone-500">No courses yet. Create your first course.</p>}
    </div>
  );
}
