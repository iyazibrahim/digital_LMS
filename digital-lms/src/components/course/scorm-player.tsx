"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLessonEngagementOptional } from "@/components/course/lesson-engagement";

export function ScormPlayer({
  courseId,
  chapterId,
  launchPath,
  completed,
}: {
  courseId: string;
  chapterId: string;
  launchPath: string;
  completed?: boolean;
}) {
  const router = useRouter();
  const engagement = useLessonEngagementOptional();
  const [saved, setSaved] = useState(!!completed);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (!launchPath || started.current) return;
    started.current = true;
    const tick = setInterval(() => {
      engagement?.reportWatch(1);
    }, 1000);
    return () => clearInterval(tick);
  }, [launchPath, engagement]);

  async function saveProgress() {
    setLoading(true);
    setError("");
    await engagement?.refreshGate();
    const res = await fetch(`/api/courses/${courseId}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ chapterId, lessonId: chapterId }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || data.reasons?.[0] || "Requirements not met");
      return;
    }
    // Also persist SCORM payload for compatibility
    await fetch(`/api/scorm/${courseId}/${chapterId}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scormData: { completion_status: "completed", success_status: "passed" },
        completed: true,
        gated: true,
      }),
    });
    setSaved(true);
    router.refresh();
  }

  if (!launchPath) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-stone-500">
          No SCORM package uploaded for this chapter yet.
        </CardContent>
      </Card>
    );
  }

  const ready = saved || engagement?.ready;
  const reason = engagement?.reasons[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle>SCORM content</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <iframe
          src={launchPath}
          className="h-[min(70vh,640px)] w-full rounded-xl border border-stone-200 bg-white"
          title="SCORM package"
          allow="fullscreen"
        />
        {!ready && reason && <p className="text-xs text-amber-700">{reason}</p>}
        {error && <p className="text-xs text-red-600">{error}</p>}
        <Button onClick={saveProgress} variant="secondary" disabled={saved || loading || !ready}>
          {saved ? "Progress saved" : loading ? "Saving…" : "Mark SCORM complete"}
        </Button>
      </CardContent>
    </Card>
  );
}
