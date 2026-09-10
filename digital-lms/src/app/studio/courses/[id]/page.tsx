"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Lesson = {
  _id: string;
  title: string;
  slug: string;
  contentHtml?: string;
  videoUrl?: string;
  pdfUrl?: string;
};
type Chapter = {
  _id: string;
  title: string;
  isScorm?: boolean;
  scormLaunchPath?: string;
  lessons: Lesson[];
};

export default function EditCoursePage() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<{
    title: string;
    shortIntroduction?: string;
    description?: string;
    published: boolean;
    chapters: Chapter[];
  } | null>(null);
  const [chapterTitle, setChapterTitle] = useState("");
  const [lessonTitle, setLessonTitle] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");

  async function load() {
    const res = await fetch(`/api/courses/${id}`);
    const data = await res.json();
    if (res.ok) setCourse(data);
  }

  useEffect(() => {
    // Initial client fetch for staff course editor
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function saveMeta() {
    if (!course) return;
    const res = await fetch(`/api/courses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: course.title,
        shortIntroduction: course.shortIntroduction,
        description: course.description,
        published: course.published,
      }),
    });
    setMessage(res.ok ? "Saved" : "Save failed");
    load();
  }

  async function addChapter(isScorm = false) {
    const res = await fetch(`/api/courses/${id}/chapters`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: chapterTitle || "New chapter", isScorm }),
    });
    if (res.ok) {
      setChapterTitle("");
      load();
    }
  }

  async function addLesson(chapterId: string) {
    const title = lessonTitle[chapterId] || "New lesson";
    const res = await fetch(`/api/courses/${id}/chapters/${chapterId}/lessons`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        contentHtml: `<p>${title}</p>`,
      }),
    });
    if (res.ok) {
      setLessonTitle((s) => ({ ...s, [chapterId]: "" }));
      load();
    }
  }

  async function uploadScorm(chapterId: string, file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const up = await fetch("/api/uploads", { method: "POST", body: fd });
    const data = await up.json();
    if (!up.ok) return;
    await fetch(`/api/courses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chapters: course?.chapters.map((ch) =>
          ch._id === chapterId
            ? {
                ...ch,
                isScorm: true,
                scormPackageUrl: data.url,
                scormLaunchPath: data.url,
              }
            : ch
        ),
      }),
    });
    setMessage("SCORM package attached (zip URL). Extract on server for full runtime later.");
    load();
  }

  if (!course) return <p>Loading…</p>;

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl">Edit course</h1>
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>Title</Label>
            <Input
              value={course.title}
              onChange={(e) => setCourse({ ...course, title: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label>Short intro</Label>
            <Input
              value={course.shortIntroduction || ""}
              onChange={(e) => setCourse({ ...course, shortIntroduction: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea
              value={course.description || ""}
              onChange={(e) => setCourse({ ...course, description: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={course.published}
              onChange={(e) => setCourse({ ...course, published: e.target.checked })}
            />
            Published
          </label>
          <Button onClick={saveMeta}>Save details</Button>
          {message && <p className="text-sm text-teal-800">{message}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Chapters & lessons</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Chapter title"
              value={chapterTitle}
              onChange={(e) => setChapterTitle(e.target.value)}
            />
            <Button onClick={() => addChapter(false)}>Add chapter</Button>
            <Button variant="outline" onClick={() => addChapter(true)}>
              Add SCORM chapter
            </Button>
          </div>
          {course.chapters?.map((ch) => (
            <div key={ch._id} className="rounded-xl border border-stone-200 p-4">
              <p className="font-medium">
                {ch.title} {ch.isScorm ? "(SCORM)" : ""}
              </p>
              {ch.isScorm ? (
                <div className="mt-2">
                  <input
                    type="file"
                    accept=".zip"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadScorm(ch._id, f);
                    }}
                  />
                  {ch.scormLaunchPath && (
                    <p className="text-xs text-stone-500">{ch.scormLaunchPath}</p>
                  )}
                </div>
              ) : (
                <>
                  <ul className="mt-2 space-y-1 text-sm text-stone-600">
                    {ch.lessons?.map((l) => (
                      <li key={l._id}>
                        {l.title} <span className="text-stone-400">/{l.slug}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-2 flex gap-2">
                    <Input
                      placeholder="Lesson title"
                      value={lessonTitle[ch._id] || ""}
                      onChange={(e) =>
                        setLessonTitle((s) => ({ ...s, [ch._id]: e.target.value }))
                      }
                    />
                    <Button size="sm" onClick={() => addLesson(ch._id)}>
                      Add lesson
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
