"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";

type Question = {
  _id: string;
  type: "single" | "multiple" | "open";
  prompt: string;
  options: { text: string; isCorrect?: boolean }[];
  points: number;
};

type Quiz = {
  _id: string;
  title: string;
  description?: string;
  questions: Question[];
  enableProctoring?: boolean;
  maxViolations?: number;
  timeLimitMinutes?: number;
};

export function QuizPlayer({
  quiz,
  courseId,
  lessonId,
}: {
  quiz: Quiz;
  courseId: string;
  lessonId: string;
}) {
  const [answers, setAnswers] = useState<Record<string, number[] | string>>({});
  const [result, setResult] = useState<{
    percent: number;
    passed: boolean;
    score: number;
    maxScore: number;
  } | null>(null);
  const [violations, setViolations] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!quiz.enableProctoring) return;
    const onBlur = () => {
      setViolations((v) => v + 1);
      fetch(`/api/quizzes/${quiz._id}/violations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "tab_switch", note: "Window blurred" }),
      }).catch(() => {});
    };
    window.addEventListener("blur", onBlur);
    return () => window.removeEventListener("blur", onBlur);
  }, [quiz]);

  function toggleOption(qid: string, idx: number, multi: boolean) {
    setAnswers((prev) => {
      const cur = (prev[qid] as number[]) || [];
      if (multi) {
        return {
          ...prev,
          [qid]: cur.includes(idx) ? cur.filter((i) => i !== idx) : [...cur, idx],
        };
      }
      return { ...prev, [qid]: [idx] };
    });
  }

  async function submit(auto = false) {
    setLoading(true);
    const payload = {
      courseId,
      lessonId,
      autoSubmitted: auto,
      violationCount: violations,
      answers: quiz.questions.map((q) => ({
        questionId: q._id,
        selectedOptionIndexes: Array.isArray(answers[q._id])
          ? (answers[q._id] as number[])
          : [],
        openAnswer: typeof answers[q._id] === "string" ? answers[q._id] : undefined,
      })),
    };
    const res = await fetch(`/api/quizzes/${quiz._id}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) setResult(data);
  }

  useEffect(() => {
    if (
      quiz.enableProctoring &&
      quiz.maxViolations &&
      violations >= quiz.maxViolations &&
      !result
    ) {
      submit(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [violations]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{quiz.title}</CardTitle>
        {quiz.description && <p className="text-sm text-stone-500">{quiz.description}</p>}
        {quiz.enableProctoring && (
          <p className="text-xs text-amber-700">
            Proctoring on · violations {violations}/{quiz.maxViolations ?? 3}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {quiz.questions.map((q, i) => (
          <div key={q._id} className="space-y-2">
            <p className="font-medium">
              {i + 1}. {q.prompt}{" "}
              <span className="text-xs text-stone-400">({q.points} pts)</span>
            </p>
            {q.type === "open" ? (
              <Textarea
                value={(answers[q._id] as string) || ""}
                onChange={(e) => setAnswers((a) => ({ ...a, [q._id]: e.target.value }))}
                disabled={!!result}
              />
            ) : (
              <div className="space-y-2">
                {q.options.map((opt, idx) => {
                  const selected = ((answers[q._id] as number[]) || []).includes(idx);
                  return (
                    <label
                      key={idx}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                        selected ? "border-teal-600 bg-teal-50" : "border-stone-200"
                      }`}
                    >
                      <input
                        type={q.type === "multiple" ? "checkbox" : "radio"}
                        checked={selected}
                        disabled={!!result}
                        onChange={() => toggleOption(q._id, idx, q.type === "multiple")}
                      />
                      {opt.text}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        ))}
        {result ? (
          <p className="rounded-lg bg-stone-50 p-3 text-sm">
            Score {result.score}/{result.maxScore} ({result.percent}%) —{" "}
            {result.passed ? "Passed" : "Not passed"}
          </p>
        ) : (
          <Button onClick={() => submit(false)} disabled={loading}>
            {loading ? "Submitting…" : "Submit quiz"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
