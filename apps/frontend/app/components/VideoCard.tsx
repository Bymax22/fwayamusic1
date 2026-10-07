"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import CoverArtImage from './CoverArtImage';
import { formatAddedTime } from '@/lib/utils';

type VideoCardProps = {
  id: string | number;
  title: string;
  artist: string;
  duration: number;
  views: number;
  addedAt?: string;
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
  addedAt,
  createdAt,
  thumbnail,
  videoUrl,
  href,
}: VideoCardProps) {
  const route = href || `/videos/${id}`;
  const [relativeAddedTime, setRelativeAddedTime] = useState(() => formatAddedTime({ addedAt, createdAt }));

  useEffect(() => {
    const updateRelativeAddedTime = () => setRelativeAddedTime(formatAddedTime({ addedAt, createdAt }));
    updateRelativeAddedTime();
    const intervalId = window.setInterval(updateRelativeAddedTime, 1000);
    return () => window.clearInterval(intervalId);
  }, [addedAt, createdAt]);

  return (
    <Link
      href={route}
      className="block w-full rounded-2xl bg-black hover:bg-charcoal transition-colors"
      aria-label={`Open video ${title}`}
    >
      <div className="relative overflow-hidden rounded-2xl bg-charcoal">
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
          <div className="h-48 w-full bg-gradient-to-br from-purple/75 to-purple/75" />
        )}

        <div className="absolute right-3 top-3 rounded-full bg-charcoal/90 px-2 py-1 text-[11px] font-medium text-white">
          {formatDuration(duration)}
        </div>
      </div>
      <div className="p-3">
        <h3 className="text-sm font-semibold text-white line-clamp-2">{title}</h3>
        <p className="mt-1 text-xs text-white/60 truncate">{artist}</p>
        <div className="mt-3 flex items-center justify-between text-[11px] text-white/60">
          <span>{views.toLocaleString()} views</span>
          <span title={addedAt || createdAt || undefined}>{relativeAddedTime}</span>
        </div>
      </div>
    </Link>
  );
}
