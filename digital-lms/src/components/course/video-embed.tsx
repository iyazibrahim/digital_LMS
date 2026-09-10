"use client";

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

export function VideoEmbed({ url }: { url: string }) {
  const yt = parseYouTubeId(url);
  if (yt) {
    return (
      <div className="aspect-video overflow-hidden rounded-xl bg-stone-100">
        <iframe
          className="h-full w-full"
          src={`https://www.youtube.com/embed/${yt}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Lesson video"
        />
      </div>
    );
  }
  if (url.match(/\.(mp4|webm)(\?|$)/i)) {
    return <video src={url} controls className="w-full rounded-xl" />;
  }
  if (url) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline">
        Open video
      </a>
    );
  }
  return null;
}
