"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea, Select } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Question = {
  _id?: string;
  type: "single" | "multiple" | "open";
  prompt: string;
  options: { text: string; isCorrect: boolean }[];
  points: number;
  explanation?: string;
};

type Quiz = {
  _id: string;
  title: string;
  description?: string;
  questions: Question[];
  passingScore: number;
  maxAttempts: number;
  timeLimitMinutes?: number;
  enableProctoring: boolean;
  maxViolations: number;
  showCorrectAnswers: boolean;
  shuffleQuestions: boolean;
};

export default function EditQuizPage() {
  const { id } = useParams<{ id: string }>();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setError("");
    fetch(`/api/quizzes/${id}`, { credentials: "same-origin" })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Failed to load quiz");
        return d.quiz || d;
      })
      .then((q) => {
        if (!cancelled && q?._id) setQuiz(q);
        else if (!cancelled) setError("Quiz not found");
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || "Failed to load");
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function save() {
    if (!quiz) return;
    setError("");
    setMessage("");
    const res = await fetch(`/api/quizzes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(quiz),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Save failed");
      return;
    }
    setQuiz(data.quiz || data);
    setMessage("Quiz saved.");
  }

  function addQuestion(type: Question["type"]) {
    if (!quiz) return;
    const q: Question = {
      type,
      prompt: "",
      options:
        type === "open"
          ? []
          : [
              { text: "Option A", isCorrect: true },
              { text: "Option B", isCorrect: false },
            ],
      points: 1,
    };
    setQuiz({ ...quiz, questions: [...quiz.questions, q] });
  }

  function updateQuestion(index: number, patch: Partial<Question>) {
    if (!quiz) return;
    const questions = quiz.questions.map((q, i) => (i === index ? { ...q, ...patch } : q));
    setQuiz({ ...quiz, questions });
  }

  function updateOption(
    qIndex: number,
    oIndex: number,
    patch: Partial<{ text: string; isCorrect: boolean }>
  ) {
    if (!quiz) return;
    const questions = quiz.questions.map((q, i) => {
      if (i !== qIndex) return q;
      const options = q.options.map((o, j) => (j === oIndex ? { ...o, ...patch } : o));
      return { ...q, options };
    });
    setQuiz({ ...quiz, questions });
  }

  if (!quiz) {
    return (
      <div className="space-y-2">
        <p className="text-stone-500">{error ? "Could not load quiz" : "Loading…"}</p>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl text-blue-950">Edit quiz</h1>
        <Button onClick={save}>Save quiz</Button>
      </div>
      {message && <p className="text-sm text-blue-800">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Settings</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label>Title</Label>
            <Input
              value={quiz.title}
              onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Description</Label>
            <Textarea
              value={quiz.description || ""}
              onChange={(e) => setQuiz({ ...quiz, description: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Passing score %</Label>
            <Input
              type="number"
              value={quiz.passingScore}
              onChange={(e) => setQuiz({ ...quiz, passingScore: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label>Time limit (minutes)</Label>
            <Input
              type="number"
              value={quiz.timeLimitMinutes || ""}
              onChange={(e) =>
                setQuiz({
                  ...quiz,
                  timeLimitMinutes: e.target.value ? Number(e.target.value) : undefined,
                })
              }
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={quiz.enableProctoring}
              onChange={(e) => setQuiz({ ...quiz, enableProctoring: e.target.checked })}
            />
            Enable proctoring
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={quiz.shuffleQuestions}
              onChange={(e) => setQuiz({ ...quiz, shuffleQuestions: e.target.checked })}
            />
            Shuffle questions
          </label>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={() => addQuestion("single")}>
          Add single choice
        </Button>
        <Button type="button" variant="secondary" onClick={() => addQuestion("multiple")}>
          Add multiple choice
        </Button>
        <Button type="button" variant="secondary" onClick={() => addQuestion("open")}>
          Add open answer
        </Button>
      </div>

      {quiz.questions.map((q, qi) => (
        <Card key={qi}>
          <CardHeader>
            <CardTitle className="text-base">
              Q{qi + 1} · {q.type}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              placeholder="Prompt"
              value={q.prompt}
              onChange={(e) => updateQuestion(qi, { prompt: e.target.value })}
            />
            <div className="flex gap-3">
              <Select
                value={q.type}
                onChange={(e) =>
                  updateQuestion(qi, { type: e.target.value as Question["type"] })
                }
              >
                <option value="single">Single</option>
                <option value="multiple">Multiple</option>
                <option value="open">Open</option>
              </Select>
              <Input
                type="number"
                className="w-24"
                value={q.points}
                onChange={(e) => updateQuestion(qi, { points: Number(e.target.value) })}
              />
            </div>
            {q.type !== "open" &&
              q.options.map((o, oi) => (
                <div key={oi} className="flex items-center gap-2">
                  <input
                    type={q.type === "single" ? "radio" : "checkbox"}
                    name={`q-${qi}`}
                    checked={o.isCorrect}
                    onChange={(e) => {
                      if (q.type === "single") {
                        const options = q.options.map((opt, j) => ({
                          ...opt,
                          isCorrect: j === oi,
                        }));
                        updateQuestion(qi, { options });
                      } else {
                        updateOption(qi, oi, { isCorrect: e.target.checked });
                      }
                    }}
                  />
                  <Input
                    value={o.text}
                    onChange={(e) => updateOption(qi, oi, { text: e.target.value })}
                  />
                </div>
              ))}
            {q.type !== "open" && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  updateQuestion(qi, {
                    options: [...q.options, { text: "New option", isCorrect: false }],
                  })
                }
              >
                Add option
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              variant="danger"
              onClick={() =>
                setQuiz({
                  ...quiz,
                  questions: quiz.questions.filter((_, i) => i !== qi),
                })
              }
            >
              Remove question
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
