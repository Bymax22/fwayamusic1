"use client";
import Link from "next/link";

type VideoCardProps = {
  id: string | number;
  title: string;
  artist: string;
  duration: number;
  views: number;
  createdAt?: string;
  thumbnail?: string;
  videoUrl?: string;
  href?: string;
};

const formatDuration = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export default function VideoCard({
  id,
  title,
  artist,
  duration,
  views,
  createdAt,
  thumbnail,
  videoUrl,
  href,
}: VideoCardProps) {
  const route = href || `/videos/${id}`;
  return (
    <Link
      href={route}
      className="block w-full rounded-2xl bg-slate-950 hover:bg-slate-900 transition-colors"
      aria-label={`Open video ${title}`}
    >
      <div className="relative overflow-hidden rounded-2xl bg-slate-800">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={title}
            className="h-48 w-full object-cover"
          />
        ) : videoUrl ? (
          <video
            src={videoUrl}
            className="h-48 w-full object-cover"
            muted
            autoPlay
            loop
            playsInline
            preload="metadata"
          />
        ) : (
          <div className="h-48 w-full bg-gradient-to-br from-purple-500 to-pink-500" />
        )}

        <div className="absolute right-3 top-3 rounded-full bg-slate-900/90 px-2 py-1 text-[11px] font-medium text-white">
          {formatDuration(duration)}
        </div>
      </div>
      <div className="p-3">
        <h3 className="text-sm font-semibold text-white line-clamp-2">{title}</h3>
        <p className="mt-1 text-xs text-slate-400 truncate">{artist}</p>
        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
          <span>{views.toLocaleString()} views</span>
          {createdAt ? <span>{new Date(createdAt).toLocaleDateString()}</span> : null}
        </div>
      </div>
    </Link>
  );
}
