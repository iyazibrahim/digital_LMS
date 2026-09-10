"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useLessonEngagementOptional } from "@/components/course/lesson-engagement";

/** Tracks dwell time while visible and marks reachedEnd when bottom sentinel intersects. */
export function ReadingTracker({ children }: { children: ReactNode }) {
  const engagement = useLessonEngagementOptional();
  const rootRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const visible = useRef(true);

  useEffect(() => {
    const onVis = () => {
      visible.current = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", onVis);
    const tick = setInterval(() => {
      if (visible.current && document.hasFocus()) {
        engagement?.reportRead(1);
      }
    }, 1000);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      clearInterval(tick);
    };
  }, [engagement]);

  useEffect(() => {
    const el = endRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          engagement?.reportRead(0, true);
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [engagement]);

  return (
    <div ref={rootRef}>
      {children}
      <div ref={endRef} className="h-1 w-full" aria-hidden />
    </div>
  );
}
