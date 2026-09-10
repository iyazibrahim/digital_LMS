"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function CompleteLessonButton({
  courseId,
  chapterId,
  lessonId,
  completed,
}: {
  courseId: string;
  chapterId: string;
  lessonId: string;
  completed: boolean;
}) {
  const router = useRouter();
  const [done, setDone] = useState(completed);
  const [loading, setLoading] = useState(false);

  async function complete() {
    setLoading(true);
    await fetch(`/api/courses/${courseId}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chapterId, lessonId }),
    });
    setDone(true);
    setLoading(false);
    router.refresh();
  }

  if (done) {
    return (
      <Button variant="secondary" disabled>
        Completed
      </Button>
    );
  }

  return (
    <Button onClick={complete} disabled={loading}>
      {loading ? "Saving…" : "Mark complete"}
    </Button>
  );
}
