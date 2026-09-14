"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type Gate = {
  ready: boolean;
  reasons: string[];
  kind?: string;
  progress?: {
    watchedSeconds: number;
    durationSeconds: number;
    watchPercent: number;
    readDwellSeconds: number;
    reachedEnd: boolean;
    minWatchPercent: number;
    minReadSeconds: number;
    minScormSeconds: number;
  };
};

type EngagementCtx = {
  courseId: string;
  chapterId: string;
  lessonId: string;
  completed: boolean;
  gate: Gate | null;
  ready: boolean;
  reasons: string[];
  reportWatch: (delta: number, durationSeconds?: number) => void;
  reportRead: (delta: number, reachedEnd?: boolean) => void;
  refreshGate: () => Promise<void>;
};

const Ctx = createContext<EngagementCtx | null>(null);

export function useLessonEngagement() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLessonEngagement must be used within LessonEngagementProvider");
  return ctx;
}

export function useLessonEngagementOptional() {
  return useContext(Ctx);
}

export function LessonEngagementProvider({
  courseId,
  chapterId,
  lessonId,
  completed,
  initialGate,
  children,
}: {
  courseId: string;
  chapterId: string;
  lessonId: string;
  completed: boolean;
  initialGate?: Gate | null;
  children: ReactNode;
}) {
  const [gate, setGate] = useState<Gate | null>(initialGate || null);
  const watchBuf = useRef(0);
  const readBuf = useRef(0);
  const durationRef = useRef(0);
  const reachedEndRef = useRef(false);
  const flushing = useRef(false);

  const flush = useCallback(async () => {
    if (flushing.current) return;
    const w = watchBuf.current;
    const r = readBuf.current;
    const dur = durationRef.current;
    const end = reachedEndRef.current;
    if (w <= 0 && r <= 0 && !end && !dur) return;
    flushing.current = true;
    watchBuf.current = 0;
    readBuf.current = 0;
    try {
      const res = await fetch(`/api/courses/${courseId}/progress/heartbeat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          chapterId,
          lessonId,
          watchedDelta: w,
          readDwellDelta: r,
          durationSeconds: dur || undefined,
          reachedEnd: end || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.gate) setGate(data.gate);
    } catch {
      /* keep buffers lost; next tick will continue */
    } finally {
      flushing.current = false;
    }
  }, [courseId, chapterId, lessonId]);

  const refreshGate = useCallback(async () => {
    await flush();
    const res = await fetch(
      `/api/courses/${courseId}/progress?chapterId=${chapterId}&lessonId=${lessonId}`,
      { credentials: "same-origin", cache: "no-store" }
    );
    const data = await res.json();
    if (res.ok && data.gate) setGate(data.gate);
  }, [courseId, chapterId, lessonId, flush]);

  useEffect(() => {
    const id = setInterval(() => void flush(), 5000);
    return () => {
      clearInterval(id);
      void flush();
    };
  }, [flush]);

  const reportWatch = useCallback((delta: number, durationSeconds?: number) => {
    if (delta > 0) watchBuf.current += delta;
    if (durationSeconds && durationSeconds > 0) durationRef.current = durationSeconds;
  }, []);

  const reportRead = useCallback((delta: number, reachedEnd?: boolean) => {
    if (delta > 0) readBuf.current += delta;
    if (reachedEnd) reachedEndRef.current = true;
  }, []);

  // Split stable API from gate state so video/read trackers can depend on report*
  // without remounting when heartbeat updates gate.
  const api = useMemo(
    () => ({
      courseId,
      chapterId,
      lessonId,
      completed,
      reportWatch,
      reportRead,
      refreshGate,
    }),
    [courseId, chapterId, lessonId, completed, reportWatch, reportRead, refreshGate]
  );

  const value = useMemo(
    () => ({
      ...api,
      gate,
      ready: completed || !!gate?.ready,
      reasons: gate?.reasons || [],
    }),
    [api, gate, completed]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
