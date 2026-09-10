"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ScormPlayer({
  courseId,
  chapterId,
  launchPath,
}: {
  courseId: string;
  chapterId: string;
  launchPath: string;
}) {
  const [saved, setSaved] = useState(false);

  async function saveProgress() {
    await fetch(`/api/scorm/${courseId}/${chapterId}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scormData: { completion_status: "completed", success_status: "passed" },
        completed: true,
      }),
    });
    setSaved(true);
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
        <p className="text-xs text-stone-500">
          If the package does not report completion automatically, use the button below when you
          finish.
        </p>
        <Button onClick={saveProgress} variant="secondary">
          {saved ? "Progress saved" : "Mark SCORM complete"}
        </Button>
      </CardContent>
    </Card>
  );
}
