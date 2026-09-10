"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Course = { _id: string; title: string };

export default function NewProgramPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [courseIds, setCourseIds] = useState<string[]>([]);
  const [enforceOrder, setEnforceOrder] = useState(true);
  const [published, setPublished] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/courses")
      .then((r) => r.json())
      .then((d) => setCourses(d.courses || []));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/programs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, courseIds, enforceOrder, published }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Failed");
      return;
    }
    router.push("/studio/programs");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="font-serif text-3xl text-teal-950">New program</h1>
      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Courses</Label>
              <div className="max-h-48 space-y-1 overflow-auto rounded-lg border border-stone-200 p-3 text-sm">
                {courses.map((c) => (
                  <label key={c._id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={courseIds.includes(c._id)}
                      onChange={(e) => {
                        setCourseIds(
                          e.target.checked
                            ? [...courseIds, c._id]
                            : courseIds.filter((id) => id !== c._id)
                        );
                      }}
                    />
                    {c.title}
                  </label>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={enforceOrder}
                onChange={(e) => setEnforceOrder(e.target.checked)}
              />
              Enforce course order
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
              />
              Published
            </label>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={loading}>
              {loading ? "Creating…" : "Create program"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
