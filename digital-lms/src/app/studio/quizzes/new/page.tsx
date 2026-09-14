"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewQuizPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [enableProctoring, setEnableProctoring] = useState(false);
  const [dueAt, setDueAt] = useState("");
  const [aiTopic, setAiTopic] = useState("");
  const [aiMessage, setAiMessage] = useState("");
  const [draftQuestions, setDraftQuestions] = useState<unknown[] | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function draftAi() {
    setAiMessage("");
    const res = await fetch("/api/ai/quiz-draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: aiTopic || title || "course topic",
        content: description,
        count: 5,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setAiMessage(data.error || "AI draft failed");
      return;
    }
    setDraftQuestions(data.questions || []);
    setAiMessage(
      `${data.source === "openai" ? "AI" : "Template"} draft ready — review before saving. ${
        data.message || ""
      }`
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/quizzes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        enableProctoring,
        proctoringMode: enableProctoring ? "tab_switch" : "off",
        dueAt: dueAt || undefined,
        questions: draftQuestions || undefined,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Failed");
      return;
    }
    router.push(`/studio/quizzes/${data.quiz._id}`);
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="font-serif text-3xl text-blue-950">New quiz</h1>
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
              <Label>Due date (optional)</Label>
              <Input
                type="datetime-local"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={enableProctoring}
                onChange={(e) => setEnableProctoring(e.target.checked)}
              />
              Log tab switches (not webcam proctoring)
            </label>

            <div className="rounded-xl border border-dashed border-blue-200 bg-blue-50/40 p-3 space-y-2">
              <Label>AI quiz draft (human review required)</Label>
              <Input
                placeholder="Topic for AI / template draft"
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
              />
              <Button type="button" size="sm" variant="outline" onClick={() => void draftAi()}>
                Generate draft questions
              </Button>
              {aiMessage && <p className="text-xs text-stone-600">{aiMessage}</p>}
              {draftQuestions && (
                <p className="text-xs text-blue-800">
                  {draftQuestions.length} draft questions will be attached on create.
                </p>
              )}
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={loading}>
              {loading ? "Creating…" : "Create quiz"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
