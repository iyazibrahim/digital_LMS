"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";

export function ExercisePlayer({
  exercise,
}: {
  exercise: {
    _id: string;
    title: string;
    description?: string;
    language: string;
    starterCode?: string;
  };
}) {
  const [code, setCode] = useState(exercise.starterCode || "");
  const [result, setResult] = useState<{
    passed: boolean;
    results: { passed: boolean; expected: string; actual: string }[];
  } | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    const res = await fetch(`/api/exercises/${exercise._id}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, language: exercise.language }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) setResult(data);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{exercise.title}</CardTitle>
        {exercise.description && (
          <p className="text-sm text-stone-500">{exercise.description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs uppercase tracking-wide text-stone-400">{exercise.language}</p>
        <Textarea
          className="font-mono text-sm"
          rows={10}
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <Button onClick={submit} disabled={loading}>
          {loading ? "Running…" : "Run tests"}
        </Button>
        {result && (
          <div className="space-y-1 text-sm">
            <p className={result.passed ? "text-emerald-700" : "text-red-700"}>
              {result.passed ? "All tests passed" : "Some tests failed"}
            </p>
            {result.results.map((r, i) => (
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
