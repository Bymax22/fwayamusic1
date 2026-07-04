"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize2 } from "lucide-react";

interface VideoWatchPlayerProps {
  videoUrl: string;
  poster?: string;
  title?: string;
  artist?: string;
  autoPlay?: boolean;
}

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export default function VideoWatchPlayer({
  videoUrl,
  poster,
  title = "Video",
  artist = "Unknown",
  autoPlay = false,
}: VideoWatchPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsTimeoutRef = useRef<number | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.75);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.preload = "metadata";
    video.playsInline = true;
    video.muted = isMuted;
    video.volume = volume;
    video.crossOrigin = "anonymous";
    video.disablePictureInPicture = true;
    video.src = videoUrl;

    const playWhenReady = async () => {
      if (autoPlay) {
        try {
          await video.play();
          setIsPlaying(true);
        } catch (error) {
          console.warn("VideoWatchPlayer: autoplay blocked", error);
        }
      }
    };

    void playWhenReady();
  }, [videoUrl, autoPlay, isMuted, volume]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onLoadedMetadata = () => {
      setDuration(video.duration || 0);
      setIsReady(true);
    };

    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime || 0);
    };

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);
    const onError = (event: Event) => {
      console.error("VideoWatchPlayer error:", event);
      setIsPlaying(false);
    };

    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("ended", onEnded);
    video.addEventListener("error", onError);

    return () => {
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("error", onError);
    };
  }, []);

  useEffect(() => {
    if (!showControls || !isPlaying) return;
    if (controlsTimeoutRef.current !== null) {
      window.clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = window.setTimeout(() => {
      setShowControls(false);
    }, 2500);
    return () => {
      if (controlsTimeoutRef.current !== null) {
        window.clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showControls, isPlaying]);

  const togglePlayPause = async () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
      return;
    }

    try {
      await video.play();
      setIsPlaying(true);
    } catch (error) {
      console.error("VideoWatchPlayer: play failed", error);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    const nextMuted = !isMuted;
    video.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextVolume = Number(event.target.value);
    const video = videoRef.current;
    setVolume(nextVolume);
    if (video) {
      video.volume = nextVolume;
      if (nextVolume > 0 && isMuted) {
        video.muted = false;
        setIsMuted(false);
      }
    }
  };

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextTime = Number(event.target.value);
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const handleToggleFullscreen = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (!document.fullscreenElement) {
        await video.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error("VideoWatchPlayer: fullscreen failed", error);
    }
  };

  const handleUserInteraction = () => {
    setShowControls(true);
  };

  const formattedCurrent = useMemo(() => formatTime(currentTime), [currentTime]);
  const formattedDuration = useMemo(() => formatTime(duration), [duration]);

  return (
    <div className="rounded-3xl bg-[#121418] border border-white/10 shadow-lg shadow-black/20 overflow-hidden">
      <div
        className="relative bg-black"
        onMouseMove={handleUserInteraction}
        onTouchStart={handleUserInteraction}
      >
        <video
          ref={videoRef}
          poster={poster}
          className="aspect-video w-full bg-black object-contain"
          onClick={togglePlayPause}
          playsInline
          preload="metadata"
          disablePictureInPicture
        />

        <div className="absolute inset-0 bg-black/20" />

        <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-4 p-4 text-white">
          <div>
            <p className="text-sm font-semibold text-white truncate">{title}</p>
            <p className="text-xs text-slate-400 truncate">{artist}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleMute}
              className="rounded-full border border-white/10 bg-black/60 p-2 text-white transition hover:bg-white/10"
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <button
              type="button"
              onClick={handleToggleFullscreen}
              className="rounded-full border border-white/10 bg-black/60 p-2 text-white transition hover:bg-white/10"
            >
              <Maximize2 size={16} />
            </button>
          </div>
        </div>

        {showControls && (
          <div className="absolute inset-x-0 bottom-0 p-4">
            <div className="mb-3 flex items-center justify-between gap-3 rounded-3xl border border-white/10 bg-black/70 p-3 backdrop-blur">
              <button
                type="button"
                onClick={togglePlayPause}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>
              <div className="min-w-0 flex-1">
                <input
                  type="range"
                  min={0}
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleSeek}
                  className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-purple-500"
                />
                <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                  <span>{formattedCurrent}</span>
                  <span>{formattedDuration}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Vol</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={volume}
                  onChange={handleVolumeChange}
                  className="h-1 w-24 cursor-pointer appearance-none rounded-full bg-white/20 accent-purple-500"
                />
              </div>
            </div>
          </div>
        )}

        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-sm text-slate-300">Loading video…</div>
        )}
      </div>
    </div>
  );
}
