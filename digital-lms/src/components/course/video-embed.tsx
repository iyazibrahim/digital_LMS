"use client";

import { useEffect, useRef } from "react";
import { useLessonEngagementOptional } from "@/components/course/lesson-engagement";

export function parseYouTubeId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?(?:[^#]*&)?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([\w-]{11})/,
    /^([\w-]{11})$/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m?.[1]) return m[1];
  }
  return null;
}

declare global {
  interface Window {
    YT?: {
      Player: new (
        el: HTMLElement | string,
        opts: {
          videoId: string;
          playerVars?: Record<string, number | string>;
          events?: {
            onReady?: (e: { target: YTPlayer }) => void;
            onStateChange?: (e: { data: number; target: YTPlayer }) => void;
          };
        }
      ) => YTPlayer;
      PlayerState: { PLAYING: number; PAUSED: number; ENDED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

type YTPlayer = {
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  destroy: () => void;
};

function loadYouTubeApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  return new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(s);
    } else if (window.YT?.Player) {
      resolve();
    }
  });
}

function YouTubeTracked({ videoId }: { videoId: string }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const lastT = useRef(0);
  const engagement = useLessonEngagementOptional();
  // Keep reportWatch in a ref so progress heartbeats (which update context) do NOT
  // remount / destroy the YouTube player every few seconds.
  const reportWatchRef = useRef(engagement?.reportWatch);
  reportWatchRef.current = engagement?.reportWatch;

  useEffect(() => {
    let cancelled = false;
    let tick: ReturnType<typeof setInterval> | null = null;
    const host = mountRef.current;
    if (!host) return;

    void loadYouTubeApi().then(() => {
      if (cancelled || !mountRef.current || !window.YT) return;
      // YT.Player replaces the mount node; keep a stable child to destroy cleanly
      const target = document.createElement("div");
      mountRef.current.innerHTML = "";
      mountRef.current.appendChild(target);

      const player = new window.YT.Player(target, {
        videoId,
        playerVars: { rel: 0, modestbranding: 1 },
        events: {
          onReady: (e) => {
            lastT.current = e.target.getCurrentTime();
          },
          onStateChange: (e) => {
            if (tick) {
              clearInterval(tick);
              tick = null;
            }
            if (e.data === window.YT!.PlayerState.PLAYING) {
              tick = setInterval(() => {
                const t = e.target.getCurrentTime();
                const dur = e.target.getDuration();
                const delta = Math.max(0, Math.min(2, t - lastT.current));
                // Only count forward play; seeks jump lastT without large credit
                if (delta > 0 && delta <= 1.5) {
                  reportWatchRef.current?.(delta, dur);
                }
                lastT.current = t;
              }, 1000);
            } else {
              lastT.current = e.target.getCurrentTime();
            }
          },
        },
      });
      playerRef.current = player;
    });

    return () => {
      cancelled = true;
      if (tick) clearInterval(tick);
      try {
        playerRef.current?.destroy();
      } catch {
        /* ignore */
      }
      playerRef.current = null;
    };
  }, [videoId]);

  return (
    <div className="aspect-video overflow-hidden rounded-xl bg-stone-100">
      <div ref={mountRef} className="h-full w-full" />
    </div>
  );
}

function Html5Tracked({ url }: { url: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const lastT = useRef(0);
  const engagement = useLessonEngagementOptional();
  const reportWatchRef = useRef(engagement?.reportWatch);
  reportWatchRef.current = engagement?.reportWatch;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onTime = () => {
      const t = el.currentTime;
      const dur = el.duration || 0;
      const delta = Math.max(0, Math.min(2, t - lastT.current));
      if (!el.paused && delta > 0 && delta <= 1.5) {
        reportWatchRef.current?.(delta, dur);
      }
      lastT.current = t;
    };
    const onMeta = () => {
      if (el.duration) reportWatchRef.current?.(0, el.duration);
    };

    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onMeta);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("loadedmetadata", onMeta);
    };
  }, [url]);

  return <video ref={ref} src={url} controls className="w-full rounded-xl" />;
}

export function VideoEmbed({ url }: { url: string }) {
  const yt = parseYouTubeId(url);
  if (yt) return <YouTubeTracked videoId={yt} />;
  if (url.match(/\.(mp4|webm)(\?|$)/i)) return <Html5Tracked url={url} />;
  if (url) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline">
        Open video
      </a>
    );
  }
  return null;
}
