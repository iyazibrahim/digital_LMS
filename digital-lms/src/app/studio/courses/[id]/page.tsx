"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { FileDropzone } from "@/components/studio/file-dropzone";
import { RichTextEditor } from "@/components/studio/rich-text-editor";
import { VideoEmbed } from "@/components/course/video-embed";
import { cn } from "@/lib/utils";

type Lesson = {
  _id: string;
  title: string;
  slug: string;
  contentHtml?: string;
  videoUrl?: string;
  pdfUrl?: string;
  quizId?: string | null;
  assignmentId?: string | null;
  programmingExerciseId?: string | null;
  durationMinutes?: number;
  isPreview?: boolean;
  order?: number;
};

type Chapter = {
  _id: string;
  title: string;
  order?: number;
  isScorm?: boolean;
  scormPackageUrl?: string;
  scormLaunchPath?: string;
  lessons: Lesson[];
};

type Course = {
  _id: string;
  title: string;
  slug: string;
  shortIntroduction?: string;
  description?: string;
  published: boolean;
  paid?: boolean;
  price?: number;
  enableCertification?: boolean;
  chapters: Chapter[];
};

type Option = { _id: string; title: string };

export default function CourseBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [tab, setTab] = useState<"content" | "settings">("content");
  const [selected, setSelected] = useState<{ chapterId: string; lessonId?: string } | null>(null);
  const [lessonDraft, setLessonDraft] = useState<Partial<Lesson>>({});
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [quizzes, setQuizzes] = useState<Option[]>([]);
  const [assignments, setAssignments] = useState<Option[]>([]);
  const [exercises, setExercises] = useState<Option[]>([]);
  const [chapterTitle, setChapterTitle] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/courses/${id}`);
    const data = await res.json();
    if (res.ok) setCourse(data);
  }, [id]);

  useEffect(() => {
    void load();
    void Promise.all([
      fetch("/api/quizzes").then((r) => r.json()),
      fetch("/api/assignments").then((r) => r.json()),
      fetch("/api/exercises").then((r) => r.json()),
    ]).then(([q, a, e]) => {
      const qList = Array.isArray(q) ? q : q.quizzes || [];
      const aList = Array.isArray(a) ? a : a.assignments || [];
      const eList = Array.isArray(e) ? e : e.exercises || [];
      setQuizzes(qList.map((x: Option) => ({ _id: String(x._id), title: x.title })));
      setAssignments(aList.map((x: Option) => ({ _id: String(x._id), title: x.title })));
      setExercises(eList.map((x: Option) => ({ _id: String(x._id), title: x.title })));
    });
  }, [load]);

  useEffect(() => {
    if (!course || !selected?.lessonId) {
      setLessonDraft({});
      return;
    }
    const ch = course.chapters.find((c) => c._id === selected.chapterId);
    const lesson = ch?.lessons.find((l) => l._id === selected.lessonId);
    if (lesson) setLessonDraft({ ...lesson });
  }, [course, selected]);

  function toast(msg: string) {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  }

  async function saveSettings() {
    if (!course) return;
    setSaving(true);
    const res = await fetch(`/api/courses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: course.title,
        shortIntroduction: course.shortIntroduction,
        description: course.description,
        published: course.published,
        paid: course.paid,
        price: course.price,
        enableCertification: course.enableCertification,
      }),
    });
    setSaving(false);
    toast(res.ok ? "Course settings saved" : "Save failed");
    if (res.ok) load();
  }

  async function addChapter(isScorm = false) {
    const res = await fetch(`/api/courses/${id}/chapters`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: chapterTitle || (isScorm ? "SCORM package" : "New chapter"), isScorm }),
    });
    if (res.ok) {
      setChapterTitle("");
      toast("Chapter added");
      load();
    }
  }

  async function renameChapter(chapterId: string, title: string) {
    await fetch(`/api/courses/${id}/chapters/${chapterId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    load();
  }

  async function deleteChapter(chapterId: string) {
    if (!confirm("Delete this chapter and its lessons?")) return;
    await fetch(`/api/courses/${id}/chapters/${chapterId}`, { method: "DELETE" });
    if (selected?.chapterId === chapterId) setSelected(null);
    load();
  }

  async function moveChapter(chapterId: string, dir: -1 | 1) {
    if (!course) return;
    const chapters = [...course.chapters].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const idx = chapters.findIndex((c) => c._id === chapterId);
    const swap = idx + dir;
    if (swap < 0 || swap >= chapters.length) return;
    const a = chapters[idx];
    const b = chapters[swap];
    await Promise.all([
      fetch(`/api/courses/${id}/chapters/${a._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: b.order ?? swap }),
      }),
      fetch(`/api/courses/${id}/chapters/${b._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: a.order ?? idx }),
      }),
    ]);
    load();
  }

  async function addLesson(chapterId: string) {
    const res = await fetch(`/api/courses/${id}/chapters/${chapterId}/lessons`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New lesson", contentHtml: "<p></p>" }),
    });
    const data = await res.json();
    if (res.ok) {
      await load();
      const ch = data.chapters?.find((c: Chapter) => c._id === chapterId);
      const last = ch?.lessons?.[ch.lessons.length - 1];
      if (last) setSelected({ chapterId, lessonId: last._id });
      toast("Lesson added — edit content on the right");
    }
  }

  async function deleteLesson(chapterId: string, lessonId: string) {
    if (!confirm("Delete this lesson?")) return;
    await fetch(`/api/courses/${id}/chapters/${chapterId}/lessons/${lessonId}`, { method: "DELETE" });
    if (selected?.lessonId === lessonId) setSelected({ chapterId });
    load();
  }

  async function moveLesson(chapterId: string, lessonId: string, dir: -1 | 1) {
    if (!course) return;
    const ch = course.chapters.find((c) => c._id === chapterId);
    if (!ch) return;
    const lessons = [...ch.lessons].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const idx = lessons.findIndex((l) => l._id === lessonId);
    const swap = idx + dir;
    if (swap < 0 || swap >= lessons.length) return;
    const a = lessons[idx];
    const b = lessons[swap];
    await Promise.all([
      fetch(`/api/courses/${id}/chapters/${chapterId}/lessons/${a._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: b.order ?? swap }),
      }),
      fetch(`/api/courses/${id}/chapters/${chapterId}/lessons/${b._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: a.order ?? idx }),
      }),
    ]);
    load();
  }

  async function saveLesson() {
    if (!selected?.lessonId || !selected.chapterId) return;
    setSaving(true);
    const res = await fetch(
      `/api/courses/${id}/chapters/${selected.chapterId}/lessons/${selected.lessonId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: lessonDraft.title,
          contentHtml: lessonDraft.contentHtml,
          videoUrl: lessonDraft.videoUrl || "",
          pdfUrl: lessonDraft.pdfUrl || "",
          quizId: lessonDraft.quizId || null,
          assignmentId: lessonDraft.assignmentId || null,
          programmingExerciseId: lessonDraft.programmingExerciseId || null,
          durationMinutes: Number(lessonDraft.durationMinutes) || 0,
          isPreview: !!lessonDraft.isPreview,
        }),
      }
    );
    setSaving(false);
    toast(res.ok ? "Lesson saved" : "Save failed");
    if (res.ok) load();
  }

  async function uploadPdf(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const up = await fetch("/api/uploads", { method: "POST", body: fd });
    const data = await up.json();
    if (!up.ok) throw new Error(data.error || "Upload failed");
    setLessonDraft((d) => ({ ...d, pdfUrl: data.url }));
  }

  async function uploadScorm(chapterId: string, file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const up = await fetch("/api/scorm/packages", { method: "POST", body: fd });
    const data = await up.json();
    if (!up.ok) throw new Error(data.error || "SCORM upload failed");
    await fetch(`/api/courses/${id}/chapters/${chapterId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        isScorm: true,
        scormPackageUrl: data.packageUrl,
        scormLaunchPath: data.launchPath,
      }),
    });
    toast("SCORM package uploaded and unpacked");
    load();
  }

  if (!course) {
    return <p className="text-stone-500">Loading course builder…</p>;
  }

  const selectedChapter = course.chapters.find((c) => c._id === selected?.chapterId);
  const sortedChapters = [...course.chapters].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-stone-500">
            <Link href="/studio/courses" className="hover:underline">
              Courses
            </Link>{" "}
            / {course.title}
          </p>
          <h1 className="font-serif text-2xl text-blue-950 sm:text-3xl">Course builder</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={tab === "content" ? "default" : "outline"}
            onClick={() => setTab("content")}
          >
            Content
          </Button>
          <Button
            type="button"
            variant={tab === "settings" ? "default" : "outline"}
            onClick={() => setTab("settings")}
          >
            Settings
          </Button>
          {course.slug && (
            <Link href={`/courses/${course.slug}`} target="_blank">
              <Button type="button" variant="outline">
                Preview course
              </Button>
            </Link>
          )}
        </div>
      </div>

      {message && (
        <p className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-900">
          {message}
        </p>
      )}

      {tab === "settings" ? (
        <div className="mx-auto max-w-xl space-y-4 rounded-xl border border-stone-200 p-4 sm:p-6">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={course.title}
              onChange={(e) => setCourse({ ...course, title: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Short introduction</Label>
            <Input
              value={course.shortIntroduction || ""}
              onChange={(e) => setCourse({ ...course, shortIntroduction: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={course.description || ""}
              onChange={(e) => setCourse({ ...course, description: e.target.value })}
              rows={5}
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
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!course.paid}
              onChange={(e) => setCourse({ ...course, paid: e.target.checked })}
            />
            Paid course
          </label>
          {course.paid && (
            <div className="space-y-2">
              <Label>Price (MYR)</Label>
              <Input
                type="number"
                value={course.price ?? 0}
                onChange={(e) => setCourse({ ...course, price: Number(e.target.value) })}
              />
            </div>
          )}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={course.enableCertification !== false}
              onChange={(e) => setCourse({ ...course, enableCertification: e.target.checked })}
            />
            Enable certificate on completion
          </label>
          <Button type="button" onClick={saveSettings} disabled={saving}>
            {saving ? "Saving…" : "Save settings"}
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(260px,320px)_1fr]">
          {/* Outline */}
          <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-3">
            <h2 className="mb-3 px-1 text-sm font-semibold text-stone-800">Outline</h2>
            <div className="mb-3 flex gap-2">
              <Input
                placeholder="Chapter title"
                value={chapterTitle}
                onChange={(e) => setChapterTitle(e.target.value)}
              />
            </div>
            <div className="mb-4 flex flex-wrap gap-2">
              <Button type="button" size="sm" onClick={() => addChapter(false)}>
                Add chapter
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => addChapter(true)}>
                Add SCORM
              </Button>
            </div>

            <div className="space-y-3">
              {sortedChapters.map((ch, ci) => (
                <div key={ch._id} className="rounded-lg border border-stone-200 bg-white">
                  <div className="flex items-start gap-1 border-b border-stone-100 p-2">
                    <div className="flex flex-col">
                      <button type="button" className="p-0.5 text-stone-400 hover:text-blue-700" onClick={() => moveChapter(ch._id, -1)}>
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" className="p-0.5 text-stone-400 hover:text-blue-700" onClick={() => moveChapter(ch._id, 1)}>
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <Input
                      className="h-8 flex-1 text-sm"
                      defaultValue={ch.title}
                      key={`${ch._id}-${ch.title}`}
                      onBlur={(e) => {
                        if (e.target.value !== ch.title) renameChapter(ch._id, e.target.value);
                      }}
                    />
                    <button
                      type="button"
                      className="p-1.5 text-stone-400 hover:text-red-600"
                      onClick={() => deleteChapter(ch._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {ch.isScorm ? (
                    <div className="space-y-2 p-3">
                      <p className="text-xs text-stone-500">
                        SCORM is a ready-made lesson zip from tools like Articulate. Upload it here —
                        we unpack it so learners can open it in the course.
                      </p>
                      <FileDropzone
                        accept=".zip,application/zip"
                        label="Upload SCORM .zip"
                        hint="Click or drag the package"
                        onFile={(file) => uploadScorm(ch._id, file)}
                      />
                      {ch.scormLaunchPath && (
                        <p className="truncate text-xs text-green-700">Launch: {ch.scormLaunchPath}</p>
                      )}
                    </div>
                  ) : (
                    <ul className="p-1">
                      {[...ch.lessons]
                        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                        .map((lesson, li) => (
                          <li key={lesson._id}>
                            <div
                              className={cn(
                                "flex items-center gap-1 rounded-md px-1 py-1",
                                selected?.lessonId === lesson._id && "bg-blue-50"
                              )}
                            >
                              <div className="flex flex-col">
                                <button type="button" className="p-0.5 text-stone-300 hover:text-blue-700" onClick={() => moveLesson(ch._id, lesson._id, -1)}>
                                  <ChevronUp className="h-3 w-3" />
                                </button>
                                <button type="button" className="p-0.5 text-stone-300 hover:text-blue-700" onClick={() => moveLesson(ch._id, lesson._id, 1)}>
                                  <ChevronDown className="h-3 w-3" />
                                </button>
                              </div>
                              <button
                                type="button"
                                className="min-w-0 flex-1 truncate px-2 py-1.5 text-left text-sm text-stone-700 hover:text-blue-900"
                                onClick={() => setSelected({ chapterId: ch._id, lessonId: lesson._id })}
                              >
                                {lesson.title || "Untitled"}
                              </button>
                              <button
                                type="button"
                                className="p-1 text-stone-300 hover:text-red-600"
                                onClick={() => deleteLesson(ch._id, lesson._id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </li>
                        ))}
                      <li className="p-2">
                        <Button type="button" size="sm" variant="outline" className="w-full" onClick={() => addLesson(ch._id)}>
                          Add lesson
                        </Button>
                      </li>
                    </ul>
                  )}
                  {ci === sortedChapters.length - 1 && !ch.lessons.length && !ch.isScorm && (
                    <p className="px-3 pb-2 text-xs text-stone-400">Add a lesson, then edit its content on the right.</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Editor */}
          <div className="rounded-xl border border-stone-200 p-4 sm:p-6">
            {!selected?.lessonId || !selectedChapter || selectedChapter.isScorm ? (
              <div className="flex min-h-[240px] flex-col items-center justify-center text-center text-stone-500">
                <p className="font-medium text-stone-700">Select a lesson</p>
                <p className="mt-1 max-w-sm text-sm">
                  Choose a lesson in the outline to edit text, YouTube video, PDF, quiz, and more.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div className="flex-1 space-y-2">
                    <Label>Lesson title</Label>
                    <Input
                      value={lessonDraft.title || ""}
                      onChange={(e) => setLessonDraft((d) => ({ ...d, title: e.target.value }))}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" onClick={saveLesson} disabled={saving}>
                      {saving ? "Saving…" : "Save lesson"}
                    </Button>
                    {course.slug && lessonDraft.slug && (
                      <Link
                        href={`/learn/${course.slug}/${lessonDraft.slug}`}
                        target="_blank"
                      >
                        <Button type="button" variant="outline">
                          Preview
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Duration (minutes)</Label>
                    <Input
                      type="number"
                      value={lessonDraft.durationMinutes ?? 0}
                      onChange={(e) =>
                        setLessonDraft((d) => ({ ...d, durationMinutes: Number(e.target.value) }))
                      }
                    />
                  </div>
                  <label className="flex items-end gap-2 pb-2 text-sm">
                    <input
                      type="checkbox"
                      checked={!!lessonDraft.isPreview}
                      onChange={(e) => setLessonDraft((d) => ({ ...d, isPreview: e.target.checked }))}
                    />
                    Free preview lesson
                  </label>
                </div>

                <div className="space-y-2">
                  <Label>Text content</Label>
                  <RichTextEditor
                    value={lessonDraft.contentHtml || ""}
                    onChange={(html) => setLessonDraft((d) => ({ ...d, contentHtml: html }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>YouTube or video URL</Label>
                  <Input
                    placeholder="https://www.youtube.com/watch?v=… or youtu.be/…"
                    value={lessonDraft.videoUrl || ""}
                    onChange={(e) => setLessonDraft((d) => ({ ...d, videoUrl: e.target.value }))}
                  />
                  <p className="text-xs text-stone-500">
                    Paste a YouTube link — learners see an embedded player on the lesson page.
                  </p>
                  {lessonDraft.videoUrl && (
                    <div className="mt-2 max-w-xl">
                      <VideoEmbed url={lessonDraft.videoUrl} />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>PDF</Label>
                  <FileDropzone
                    accept="application/pdf,.pdf"
                    label="Upload PDF"
                    hint="Click or drag a PDF"
                    onFile={uploadPdf}
                  />
                  {lessonDraft.pdfUrl && (
                    <a
                      href={lessonDraft.pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-blue-700 hover:underline"
                    >
                      Current PDF: {lessonDraft.pdfUrl}
                    </a>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Quiz</Label>
                    <select
                      className="h-10 w-full rounded-md border border-stone-200 px-2 text-sm"
                      value={lessonDraft.quizId ? String(lessonDraft.quizId) : ""}
                      onChange={(e) =>
                        setLessonDraft((d) => ({ ...d, quizId: e.target.value || null }))
                      }
                    >
                      <option value="">None</option>
                      {quizzes.map((q) => (
                        <option key={q._id} value={q._id}>
                          {q.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Assignment</Label>
                    <select
                      className="h-10 w-full rounded-md border border-stone-200 px-2 text-sm"
                      value={lessonDraft.assignmentId ? String(lessonDraft.assignmentId) : ""}
                      onChange={(e) =>
                        setLessonDraft((d) => ({ ...d, assignmentId: e.target.value || null }))
                      }
                    >
                      <option value="">None</option>
                      {assignments.map((q) => (
                        <option key={q._id} value={q._id}>
                          {q.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Exercise</Label>
                    <select
                      className="h-10 w-full rounded-md border border-stone-200 px-2 text-sm"
                      value={
                        lessonDraft.programmingExerciseId
                          ? String(lessonDraft.programmingExerciseId)
                          : ""
                      }
                      onChange={(e) =>
                        setLessonDraft((d) => ({
                          ...d,
                          programmingExerciseId: e.target.value || null,
                        }))
                      }
                    >
                      <option value="">None</option>
                      {exercises.map((q) => (
                        <option key={q._id} value={q._id}>
                          {q.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
