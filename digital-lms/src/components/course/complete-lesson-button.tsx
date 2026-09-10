"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useLessonEngagementOptional } from "@/components/course/lesson-engagement";

export function CompleteLessonButton({
  courseId,
  chapterId,
  lessonId,
  completed,
  nextHref,
}: {
  courseId: string;
  chapterId: string;
  lessonId: string;
  completed: boolean;
  nextHref?: string | null;
}) {
  const router = useRouter();
  const engagement = useLessonEngagementOptional();
  const [done, setDone] = useState(completed);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const ready = done || engagement?.ready || false;
  const reasons = engagement?.reasons || [];

  async function complete() {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/courses/${courseId}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ chapterId, lessonId }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || data.reasons?.[0] || "Could not mark complete");
      await engagement?.refreshGate();
      return;
    }
    setDone(true);
    router.refresh();
  }

  if (done) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" disabled>
          Completed
        </Button>
        {nextHref && (
          <Link href={nextHref}>
            <Button>Next</Button>
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="flex max-w-md flex-col items-end gap-1">
      {!ready && reasons.length > 0 && (
        <p className="text-right text-xs text-amber-700">{reasons[0]}</p>
      )}
      {error && <p className="text-right text-xs text-red-600">{error}</p>}
      <div className="flex flex-wrap items-center gap-2">
        {nextHref && (
          <Button variant="outline" disabled title={reasons[0] || "Complete this lesson first"}>
            Next
          </Button>
        )}
        <Button onClick={complete} disabled={loading || !ready}>
          {loading ? "Saving…" : "Mark complete"}
        </Button>
      </div>
    </div>
  );
}

export function LessonNavButtons({
  prevHref,
  nextHref,
  completed,
}: {
  prevHref?: string | null;
  nextHref?: string | null;
  completed: boolean;
}) {
  const engagement = useLessonEngagementOptional();
  const canNext = completed || !!engagement?.ready;

  return (
    <div className="flex gap-2">
      {prevHref && (
        <Link href={prevHref}>
          <Button variant="outline">Previous</Button>
        </Link>
      )}
      {nextHref &&
        (canNext ? (
          <Link href={nextHref}>
            <Button variant="outline">Next</Button>
          </Link>
        ) : (
          <Button
            variant="outline"
            disabled
            title={engagement?.reasons[0] || "Complete this lesson first"}
          >
            Next
          </Button>
        ))}
    </div>
  );
}
