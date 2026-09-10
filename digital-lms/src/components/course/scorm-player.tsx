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
          className="h-[480px] w-full rounded-xl border border-stone-200"
          title="SCORM package"
        />
        <Button onClick={saveProgress} variant="secondary">
          {saved ? "Progress saved" : "Mark SCORM complete"}
        </Button>
      </CardContent>
    </Card>
  );
}
