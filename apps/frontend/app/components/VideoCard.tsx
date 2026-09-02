"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import CoverArtImage from './CoverArtImage';

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

const formatRelativeUploadTime = (value?: string) => {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return null;

  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (elapsedSeconds < 10) return "Now";
  if (elapsedSeconds < 60) return `${elapsedSeconds} seconds ago`;

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  if (elapsedMinutes < 60) return `${elapsedMinutes} ${elapsedMinutes === 1 ? "minute" : "minutes"} ago`;

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours} ${elapsedHours === 1 ? "hour" : "hours"} ago`;

  const elapsedDays = Math.floor(elapsedHours / 24);
  return `${elapsedDays} ${elapsedDays === 1 ? "day" : "days"} ago`;
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
  const [relativeUploadTime, setRelativeUploadTime] = useState(() => formatRelativeUploadTime(createdAt));

  useEffect(() => {
    const updateRelativeUploadTime = () => setRelativeUploadTime(formatRelativeUploadTime(createdAt));
    updateRelativeUploadTime();
    const intervalId = window.setInterval(updateRelativeUploadTime, 10000);
    return () => window.clearInterval(intervalId);
  }, [createdAt]);

  return (
    <Link
      href={route}
      className="block w-full rounded-2xl bg-slate-950 hover:bg-slate-900 transition-colors"
      aria-label={`Open video ${title}`}
    >
      <div className="relative overflow-hidden rounded-2xl bg-slate-800">
        {thumbnail ? (
          <CoverArtImage
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
          {relativeUploadTime ? <span title={createdAt}>{relativeUploadTime}</span> : null}
        </div>
      </div>
    </Link>
  );
}
