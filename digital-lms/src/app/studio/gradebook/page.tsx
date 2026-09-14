"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type CourseOpt = { _id: string; title: string };
type Row = {
  userId: string;
  name?: string;
  email?: string;
  progressPercent: number;
  completed: boolean;
  quizzes: { percent: number; passed: boolean; status?: string }[];
  assignments: { status: string; grade?: number; assignmentId: { title?: string } | string }[];
  exercisesPassed: number;
  exercisesTotal: number;
};
type InboxAssignment = {
  _id: string;
  status: string;
  fileUrl?: string;
  fileName?: string;
  userId?: { name?: string; email?: string };
  assignmentId?: { title?: string };
};
type InboxQuiz = {
  _id: string;
  percent: number;
  userId?: { name?: string; email?: string };
  quizId?: { title?: string };
  answers?: { openAnswer?: string; questionId: string }[];
};

export default function GradebookPage() {
  const [tab, setTab] = useState<"inbox" | "roster">("inbox");
  const [courses, setCourses] = useState<CourseOpt[]>([]);
  const [courseId, setCourseId] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [assignments, setAssignments] = useState<InboxAssignment[]>([]);
  const [quizzes, setQuizzes] = useState<InboxQuiz[]>([]);
  const [message, setMessage] = useState("");
  const [gradeForm, setGradeForm] = useState<Record<string, { status: string; grade: string; feedback: string }>>(
    {}
  );

  useEffect(() => {
    void fetch("/api/courses", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setCourses(d.courses || d || []))
      .catch(() => undefined);
  }, []);

  async function loadInbox() {
    const res = await fetch("/api/gradebook?inbox=1", { credentials: "include" });
    const data = await res.json();
    if (res.ok) {
      setAssignments(data.assignments || []);
      setQuizzes(data.quizzes || []);
    }
  }

  async function loadRoster() {
    if (!courseId) return;
    const res = await fetch(`/api/gradebook?courseId=${courseId}`, { credentials: "include" });
    const data = await res.json();
    if (res.ok) setRows(data.rows || []);
  }

  useEffect(() => {
    if (tab === "inbox") void loadInbox();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => {
    if (tab === "roster") void loadRoster();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, courseId]);

  async function gradeAssignment(id: string) {
    const form = gradeForm[id] || { status: "passed", grade: "", feedback: "" };
    const res = await fetch(`/api/assignments/submissions/${id}/grade`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: form.status,
        grade: form.grade ? Number(form.grade) : undefined,
        feedback: form.feedback,
      }),
    });
    if (res.ok) {
      setMessage("Assignment graded");
      void loadInbox();
    }
  }

  async function gradeQuiz(id: string) {
    const form = gradeForm[id] || { status: "passed", grade: "100", feedback: "" };
    const res = await fetch(`/api/quizzes/submissions/${id}/grade`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        passed: form.status === "passed",
        percent: form.grade ? Number(form.grade) : 100,
        feedback: form.feedback,
      }),
    });
    if (res.ok) {
      setMessage("Quiz graded");
      void loadInbox();
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-blue-950">Gradebook</h1>
        <p className="text-stone-600">Submission inbox and per-course roster.</p>
      </div>
      {message && <p className="text-sm text-blue-800">{message}</p>}

      <div className="flex gap-2">
        <Button
          size="sm"
          variant={tab === "inbox" ? "default" : "outline"}
          onClick={() => setTab("inbox")}
        >
          Inbox
        </Button>
        <Button
          size="sm"
          variant={tab === "roster" ? "default" : "outline"}
          onClick={() => setTab("roster")}
        >
          Course roster
        </Button>
      </div>

      {tab === "inbox" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Assignments to grade</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {assignments.map((a) => (
                <div key={a._id} className="rounded-lg border border-stone-100 p-3 text-sm">
                  <p className="font-medium">{a.assignmentId?.title || "Assignment"}</p>
                  <p className="text-stone-500">
                    {a.userId?.name} · {a.userId?.email}
                  </p>
                  {a.fileUrl && (
                    <a href={a.fileUrl} className="text-blue-700 hover:underline" target="_blank" rel="noreferrer">
                      {a.fileName || "Download"}
                    </a>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Select
                      value={gradeForm[a._id]?.status || "passed"}
                      onChange={(e) =>
                        setGradeForm({
                          ...gradeForm,
                          [a._id]: {
                            status: e.target.value,
                            grade: gradeForm[a._id]?.grade || "",
                            feedback: gradeForm[a._id]?.feedback || "",
                          },
                        })
                      }
                    >
                      <option value="passed">Passed</option>
                      <option value="failed">Failed</option>
                      <option value="revision">Revision</option>
                    </Select>
                    <Input
                      className="w-20"
                      placeholder="Grade"
                      value={gradeForm[a._id]?.grade || ""}
                      onChange={(e) =>
                        setGradeForm({
                          ...gradeForm,
                          [a._id]: {
                            status: gradeForm[a._id]?.status || "passed",
                            grade: e.target.value,
                            feedback: gradeForm[a._id]?.feedback || "",
                          },
                        })
                      }
                    />
                    <Input
                      placeholder="Feedback"
                      value={gradeForm[a._id]?.feedback || ""}
                      onChange={(e) =>
                        setGradeForm({
                          ...gradeForm,
                          [a._id]: {
                            status: gradeForm[a._id]?.status || "passed",
                            grade: gradeForm[a._id]?.grade || "",
                            feedback: e.target.value,
                          },
                        })
                      }
                    />
                    <Button size="sm" onClick={() => void gradeAssignment(a._id)}>
                      Grade
                    </Button>
                  </div>
                </div>
              ))}
              {!assignments.length && <p className="text-stone-500">Inbox empty.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Open quizzes pending review</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {quizzes.map((q) => (
                <div key={q._id} className="rounded-lg border border-stone-100 p-3 text-sm">
                  <p className="font-medium">{q.quizId?.title || "Quiz"}</p>
                  <p className="text-stone-500">
                    {q.userId?.name} · auto MCQ {q.percent}%
                  </p>
                  <ul className="mt-1 list-disc pl-4 text-xs text-stone-600">
                    {(q.answers || [])
                      .filter((a) => a.openAnswer)
                      .map((a, i) => (
                        <li key={i}>{a.openAnswer}</li>
                      ))}
                  </ul>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Select
                      value={gradeForm[q._id]?.status || "passed"}
                      onChange={(e) =>
                        setGradeForm({
                          ...gradeForm,
                          [q._id]: {
                            status: e.target.value,
                            grade: gradeForm[q._id]?.grade || "100",
                            feedback: gradeForm[q._id]?.feedback || "",
                          },
                        })
                      }
                    >
                      <option value="passed">Pass</option>
                      <option value="failed">Fail</option>
                    </Select>
                    <Input
                      className="w-20"
                      placeholder="%"
                      value={gradeForm[q._id]?.grade || "100"}
                      onChange={(e) =>
                        setGradeForm({
                          ...gradeForm,
                          [q._id]: {
                            status: gradeForm[q._id]?.status || "passed",
                            grade: e.target.value,
                            feedback: gradeForm[q._id]?.feedback || "",
                          },
                        })
                      }
                    />
                    <Button size="sm" onClick={() => void gradeQuiz(q._id)}>
                      Finalize
                    </Button>
                  </div>
                </div>
              ))}
              {!quizzes.length && <p className="text-stone-500">No open quizzes waiting.</p>}
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "roster" && (
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
            <CardTitle>Course roster</CardTitle>
            <div className="flex gap-2">
              <Select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
                <option value="">Select course</option>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.title}
                  </option>
                ))}
              </Select>
              {courseId && (
                <a href={`/api/gradebook?courseId=${courseId}&export=csv`}>
                  <Button size="sm" variant="outline" type="button">
                    Export CSV
                  </Button>
                </a>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500">
                    <th className="py-2 pr-3">Learner</th>
                    <th className="py-2 pr-3">Progress</th>
                    <th className="py-2 pr-3">Quizzes</th>
                    <th className="py-2 pr-3">Assignments</th>
                    <th className="py-2">Exercises</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.userId} className="border-b border-stone-50">
                      <td className="py-2 pr-3">
                        <p className="font-medium">{r.name}</p>
                        <p className="text-xs text-stone-400">{r.email}</p>
                      </td>
                      <td className="py-2 pr-3">
                        {r.progressPercent}%{r.completed ? " ✓" : ""}
                      </td>
                      <td className="py-2 pr-3">
                        {r.quizzes.map((q, i) => (
                          <span key={i} className="mr-1">
                            {q.percent}%{q.status === "pending_review" ? "*" : ""}
                          </span>
                        )) || "—"}
                      </td>
                      <td className="py-2 pr-3">
                        {r.assignments.map((a, i) => (
                          <span key={i} className="mr-1">
                            {a.status}
                            {a.grade != null ? `(${a.grade})` : ""}
                          </span>
                        )) || "—"}
                      </td>
                      <td className="py-2">
                        {r.exercisesPassed}/{r.exercisesTotal}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!rows.length && (
                <p className="py-6 text-stone-500">
                  {courseId ? "No enrollments." : "Pick a course."}
                </p>
              )}
            </div>
            <p className="mt-3 text-xs text-stone-400">
              Tip: open answers marked with * need review in Inbox.{" "}
              <Link href="/studio/assignments" className="text-blue-700">
                Assignments
              </Link>
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
