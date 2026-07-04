"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Play, Pause, X } from "lucide-react";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";

export default function VideoMiniPlayer() {
  const router = useRouter();
  const pathname = usePathname();
  const { currentTrack, isPlaying, togglePlay, stopTrack } = useAudioPlayer();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (currentTrack?.type === "VIDEO") {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [currentTrack]);

  if (!isVisible || !currentTrack) return null;
  if (pathname?.startsWith("/videos/") && String(currentTrack.id) === pathname.split("/videos/")[1]) {
    return null;
  }

  const openWatchPage = () => {
    if (!currentTrack?.id) return;
    router.push(`/videos/${currentTrack.id}`);
  };

  return (
    <div
      className="fixed bottom-24 right-4 z-50 w-[calc(100%-2rem)] sm:w-[340px] rounded-3xl bg-slate-950 p-3 shadow-lg shadow-black/40 transition-all duration-200 lg:bottom-6 lg:right-6 cursor-pointer"
      onClick={openWatchPage}
      role="button"
      tabIndex={0}
      aria-label={`Open video ${currentTrack.title}`}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openWatchPage();
        }
      }}
    >
      <div className="flex items-center gap-3">
        <div className="h-14 w-14 overflow-hidden rounded-2xl bg-slate-800">
          <img
            src={currentTrack.imageUrl || "/default-cover.jpg"}
            alt={currentTrack.title || "Video"}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{currentTrack.title}</p>
          <p className="truncate text-xs text-slate-400">{currentTrack.artist}</p>
        </div>
        <button
          onClick={(event) => {
            event.stopPropagation();
            togglePlay();
          }}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white transition hover:bg-slate-800"
          aria-label={isPlaying ? "Pause video" : "Play video"}
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <button
          onClick={(event) => {
            event.stopPropagation();
            openWatchPage();
          }}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white transition hover:bg-slate-800"
          aria-label="Open video page"
        >
          <Maximize2 size={16} />
        </button>
        <button
          onClick={(event) => {
            event.stopPropagation();
            stopTrack();
          }}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white transition hover:bg-slate-800"
          aria-label="Close mini player"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
