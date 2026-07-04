"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FastForward, Maximize2, Pause, Play, Rewind, Volume2, VolumeX } from "lucide-react";

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
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.75);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.preload = "metadata";
    video.playsInline = true;
    video.muted = isMuted;
    video.volume = volume;
    video.playbackRate = playbackRate;
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
  }, [videoUrl, autoPlay, isMuted, volume, playbackRate]);

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

  const handleSkip = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    const nextTime = Math.max(0, Math.min(video.duration || 0, video.currentTime + seconds));
    video.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const handlePlaybackRateChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextRate = Number(event.target.value);
    const video = videoRef.current;
    setPlaybackRate(nextRate);
    if (video) {
      video.playbackRate = nextRate;
    }
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

  const formattedCurrent = useMemo(() => formatTime(currentTime), [currentTime]);
  const formattedDuration = useMemo(() => formatTime(duration), [duration]);

  return (
    <div className="rounded-3xl bg-[#090b10] shadow-2xl shadow-black/40 overflow-hidden">
      <div className="bg-black">
        <div className="aspect-video w-full bg-black">
          <video
            ref={videoRef}
            poster={poster}
            className="h-full w-full object-contain bg-black"
            onClick={togglePlayPause}
            playsInline
            preload="metadata"
            disablePictureInPicture
          />
        </div>
      </div>

      <div className="bg-[#090b10] p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-white truncate">{title}</p>
            <p className="text-xs text-slate-400 truncate">{artist}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.2em] text-slate-500">
            <span>{formattedCurrent}</span>
            <span>•</span>
            <span>{formattedDuration}</span>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={togglePlayPause}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-purple-600 text-white transition hover:bg-purple-500"
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
            <button
              type="button"
              onClick={() => handleSkip(-10)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-white transition hover:bg-slate-800"
            >
              <Rewind size={16} />
            </button>
            <button
              type="button"
              onClick={() => handleSkip(10)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-white transition hover:bg-slate-800"
            >
              <FastForward size={16} />
            </button>
            <button
              type="button"
              onClick={toggleMute}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-white transition hover:bg-slate-800"
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <button
              type="button"
              onClick={handleToggleFullscreen}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-slate-900 px-4 text-sm text-white transition hover:bg-slate-800"
            >
              <Maximize2 size={16} />
              Fullscreen
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1.4fr_0.9fr]">
            <div className="flex items-center gap-3 rounded-3xl bg-[#0f1115] px-4 py-3 text-sm text-slate-300">
              <span className="uppercase tracking-[0.2em] text-slate-500">Volume</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={handleVolumeChange}
                className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-purple-500"
              />
              <span className="min-w-[40px] text-right">{Math.round(volume * 100)}%</span>
            </div>
            <div className="flex items-center gap-3 rounded-3xl bg-[#0f1115] px-4 py-3 text-sm text-slate-300">
              <span className="uppercase tracking-[0.2em] text-slate-500">Speed</span>
              <select
                value={playbackRate}
                onChange={handlePlaybackRateChange}
                className="rounded-2xl bg-[#090b10] px-3 py-2 text-sm text-white outline-none"
              >
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                  <option key={rate} value={rate} className="bg-[#090b10] text-white">
                    {rate}x
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-3xl bg-[#0f1115] px-4 py-3">
            <input
              type="range"
              min={0}
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-purple-500"
            />
          </div>
        </div>
      </div>

      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-sm text-slate-300">Loading video…</div>
      )}
    </div>
  );
}
