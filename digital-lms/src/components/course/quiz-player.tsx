"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { useLessonEngagementOptional } from "@/components/course/lesson-engagement";

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
  maxAttempts?: number;
  passingScore?: number;
};

type SubmissionResult = {
  percent: number;
  passed: boolean;
  score: number;
  maxScore: number;
  status?: string;
  message?: string;
  feedback?: string;
  submittedAt?: string;
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
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [violations, setViolations] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hydrating, setHydrating] = useState(true);
  const engagement = useLessonEngagementOptional();

  // Restore latest saved attempt so reopening the lesson does not look "reset"
  useEffect(() => {
    let cancelled = false;
    setHydrating(true);
    const qs = new URLSearchParams({ courseId, lessonId });
    void fetch(`/api/quizzes/${quiz._id}/submission?${qs}`, {
      credentials: "include",
      cache: "no-store",
    })
      .then(async (r) => {
        const data = await r.json();
        if (cancelled || !r.ok || !data.submission) return;
        const sub = data.submission as {
          score: number;
          maxScore: number;
          percent: number;
          passed: boolean;
          status?: string;
          feedback?: string;
          submittedAt?: string;
          answers?: {
            questionId: string;
            selectedOptionIndexes?: number[];
            openAnswer?: string;
          }[];
        };
        const restored: Record<string, number[] | string> = {};
        for (const a of sub.answers || []) {
          const qid = String(a.questionId);
          const q = quiz.questions.find((qq) => String(qq._id) === qid);
          if (q?.type === "open") {
            restored[qid] = a.openAnswer || "";
          } else {
            restored[qid] = a.selectedOptionIndexes || [];
          }
        }
        setAnswers(restored);
        setResult({
          score: sub.score,
          maxScore: sub.maxScore,
          percent: sub.percent,
          passed: sub.passed,
          status: sub.status,
          feedback: sub.feedback,
          submittedAt: sub.submittedAt,
          message:
            sub.status === "pending_review"
              ? "Submitted — open answers await instructor review."
              : undefined,
        });
      })
      .catch(() => {
        /* start blank */
      })
      .finally(() => {
        if (!cancelled) setHydrating(false);
      });
    return () => {
      cancelled = true;
    };
  }, [quiz._id, quiz.questions, courseId, lessonId]);

  useEffect(() => {
    if (!quiz.enableProctoring || result) return;
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
  }, [quiz, result]);

  function toggleOption(qid: string, idx: number, multi: boolean) {
    if (result) return;
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
    if (res.ok) {
      setResult(data);
      // Unlock next lesson for pass OR pending open-answer review
      if (data.passed || data.status === "pending_review") {
        await engagement?.refreshGate();
      }
    }
  }

  useEffect(() => {
    if (
      quiz.enableProctoring &&
      quiz.maxViolations &&
      violations >= quiz.maxViolations &&
      !result &&
      !hydrating
    ) {
      void submit(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [violations]);

  const locked = !!result;
  const canRetry =
    !!result &&
    !result.passed &&
    result.status !== "pending_review" &&
    (quiz.maxAttempts === 0 || quiz.maxAttempts == null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{quiz.title}</CardTitle>
        {quiz.description && <p className="text-sm text-stone-500">{quiz.description}</p>}
        {quiz.enableProctoring && !locked && (
          <p className="text-xs text-amber-700">
            Tab-focus monitoring on · switches logged {violations}/{quiz.maxViolations ?? 3}. This is
            not webcam proctoring.
          </p>
        )}
        {hydrating && <p className="text-xs text-stone-400">Loading your previous attempt…</p>}
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
                disabled={locked || hydrating}
              />
            ) : (
              <div className="space-y-2">
                {q.options.map((opt, idx) => {
                  const selected = ((answers[q._id] as number[]) || []).includes(idx);
                  return (
                    <label
                      key={idx}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                        selected ? "border-blue-600 bg-blue-50" : "border-stone-200"
                      } ${locked || hydrating ? "opacity-80" : ""}`}
                    >
                      <input
                        type={q.type === "multiple" ? "checkbox" : "radio"}
                        checked={selected}
                        disabled={locked || hydrating}
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
          <div className="space-y-2">
            <p className="rounded-lg bg-stone-50 p-3 text-sm">
              {result.status === "pending_review" || result.message ? (
                <>
                  Score so far {result.score}/{result.maxScore} ({result.percent}%) —{" "}
                  {result.message || "Submitted — open answers await instructor review."}
                </>
              ) : (
                <>
                  Score {result.score}/{result.maxScore} ({result.percent}%) —{" "}
                  {result.passed ? "Passed" : "Not passed"}
                  {quiz.passingScore != null ? ` (need ${quiz.passingScore}%)` : ""}
                </>
              )}
              {result.feedback ? (
                <span className="mt-1 block text-stone-600">Feedback: {result.feedback}</span>
              ) : null}
            </p>
            {canRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setResult(null);
                  setAnswers({});
                }}
              >
                Try again
              </Button>
            )}
          </div>
        ) : (
          <Button onClick={() => void submit(false)} disabled={loading || hydrating}>
            {loading ? "Submitting…" : "Submit quiz"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
