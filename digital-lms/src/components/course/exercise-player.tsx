"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { useLessonEngagementOptional } from "@/components/course/lesson-engagement";

type Exercise = {
  _id: string;
  title: string;
  description?: string;
  kind?: "coding" | "short_answer" | "written" | "file";
  language?: string;
  starterCode?: string;
  expectedAnswers?: string[];
};

export function ExercisePlayer({ exercise }: { exercise: Exercise }) {
  const kind = exercise.kind || "coding";
  const [code, setCode] = useState(exercise.starterCode || "");
  const [answerText, setAnswerText] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState<{
    passed: boolean;
    message?: string;
    results?: { passed: boolean; expected: string; actual: string }[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const engagement = useLessonEngagementOptional();

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/uploads", { method: "POST", body: fd });
    const data = await res.json();
    if (res.ok) {
      setFileUrl(data.url);
      setFileName(file.name);
    } else {
      setResult({ passed: false, message: data.error || "Upload failed" });
    }
  }

  async function submit() {
    setLoading(true);
    const res = await fetch(`/api/exercises/${exercise._id}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        language: exercise.language || "text",
        answerText,
        fileUrl,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setResult(data);
      await engagement?.refreshGate();
    } else {
      setResult({ passed: false, message: data.error || "Submit failed" });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{exercise.title}</CardTitle>
        {exercise.description && (
          <p className="text-sm text-stone-500">{exercise.description}</p>
        )}
        <p className="text-xs uppercase tracking-wide text-stone-400">
          {kind.replace("_", " ")}
          {kind === "coding" && exercise.language ? ` · ${exercise.language}` : ""}
        </p>
        {kind === "coding" && (
          <p className="text-xs text-amber-700">
            Practice check only — JavaScript may run locally in the browser; other languages use
            simple string matching. Not a secure code sandbox.
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {kind === "coding" && (
          <Textarea
            className="font-mono text-sm"
            rows={10}
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        )}
        {kind === "short_answer" && (
          <Input
            placeholder="Your answer"
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
          />
        )}
        {kind === "written" && (
          <Textarea
            rows={8}
            placeholder="Write your response"
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
          />
        )}
        {kind === "file" && (
          <div className="space-y-2">
            <Input type="file" onChange={onUpload} />
            {fileName && <p className="text-xs text-stone-500">Selected: {fileName}</p>}
          </div>
        )}
        <Button
          onClick={submit}
          disabled={
            loading ||
            (kind === "file" && !fileUrl) ||
            (kind === "short_answer" && !answerText.trim()) ||
            (kind === "written" && !answerText.trim())
          }
        >
          {loading
            ? "Submitting…"
            : kind === "coding"
              ? "Run tests"
              : "Submit"}
        </Button>
        {result && (
          <div className="space-y-1 text-sm">
            <p className={result.passed ? "text-emerald-700" : "text-red-700"}>
              {result.message ||
                (result.passed ? "Submitted successfully" : "Not passed yet")}
            </p>
            {result.results?.map((r, i) => (
              <p key={i} className="text-stone-600">
                #{i + 1} {r.passed ? "✓" : "✗"} expected `{r.expected}` got `{r.actual}`
              </p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
