"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FastForward, Maximize2, Pause, Play, Rewind, Volume2, VolumeX } from "lucide-react";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";

interface VideoWatchPlayerProps {
  trackId?: string | number;
  videoUrl: string;
  poster?: string;
  title?: string;
  artist?: string;
  duration?: number;
  autoPlay?: boolean;
}

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export default function VideoWatchPlayer({
  trackId,
  videoUrl,
  poster,
  title = "Video",
  artist = "Unknown",
  duration: initialDuration,
  autoPlay = false,
}: VideoWatchPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.75);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialDuration || 0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const touchProgressTimeout = useRef<number | null>(null);

  const { currentTrack, setCurrentTrack, registerVideoElement } = useAudioPlayer();

  const isSameTrack = useMemo(
    () => currentTrack && trackId != null && String(currentTrack.id) === String(trackId),
    [currentTrack, trackId],
  );

  const updateGlobalTrack = () => {
    if (!trackId || !videoUrl) return;
    if (isSameTrack) return;

    setCurrentTrack({
      id: trackId,
      title,
      artist,
      imageUrl: poster,
      videoUrl,
      duration,
      type: "VIDEO",
    });
  };

  const showTouchProgress = () => {
    setShowProgress(true);
    if (touchProgressTimeout.current) {
      window.clearTimeout(touchProgressTimeout.current);
    }
    touchProgressTimeout.current = window.setTimeout(() => {
      setShowProgress(false);
      touchProgressTimeout.current = null;
    }, 2200);
  };

  useEffect(() => {
    if (!videoRef.current) return;
    registerVideoElement(videoRef.current);
  }, [registerVideoElement]);

  useEffect(() => {
    return () => {
      if (touchProgressTimeout.current) {
        window.clearTimeout(touchProgressTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.preload = "metadata";
    video.playsInline = true;
    video.crossOrigin = "anonymous";
    video.disablePictureInPicture = true;
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = isMuted;
    video.volume = volume;
    video.playbackRate = playbackRate;
  }, [isMuted, volume, playbackRate]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

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
  }, [autoPlay]);

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

    const onPlay = () => {
      setIsPlaying(true);
      updateGlobalTrack();
    };
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
      updateGlobalTrack();
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
    <div className="group rounded-3xl bg-black shadow-2xl shadow-black/40 overflow-hidden">
      <div
        className="relative bg-black"
        onMouseEnter={() => setShowProgress(true)}
        onMouseLeave={() => setShowProgress(false)}
        onTouchStart={showTouchProgress}
      >
        <div className="aspect-video w-full bg-black">
          <video
            ref={videoRef}
            src={videoUrl}
            poster={poster}
            className="h-full w-full object-contain bg-black"
            onClick={togglePlayPause}
            playsInline
            muted={isMuted}
            preload="metadata"
            disablePictureInPicture
          />
        </div>

        <div className={`absolute inset-x-0 bottom-0 px-4 pb-3 transition-all duration-200 ${showProgress ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
          <div className="rounded-full bg-black/70 px-3 py-2 backdrop-blur-sm shadow-lg shadow-black/40">
            <input
              type="range"
              min={0}
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-purple-500"
            />
            <div className="mt-2 flex items-center justify-between text-xs text-slate-300">
              <span>{formattedCurrent}</span>
              <span>{formattedDuration}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 bg-black">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSkip(-10)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-white transition hover:bg-slate-800"
                aria-label="Rewind 10 seconds"
              >
                <Rewind size={16} />
              </button>
              <button
                type="button"
                onClick={togglePlayPause}
                className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-purple-600 text-white transition hover:bg-purple-500"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>
              <button
                type="button"
                onClick={() => handleSkip(10)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-white transition hover:bg-slate-800"
                aria-label="Forward 10 seconds"
              >
                <FastForward size={16} />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleMute}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-white transition hover:bg-slate-800"
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
              <button
                type="button"
                onClick={handleToggleFullscreen}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-white transition hover:bg-slate-800"
                aria-label="Fullscreen"
              >
                <Maximize2 size={16} />
              </button>
            </div>
          </div>

          <div className="hidden grid-cols-[1.4fr_0.9fr] gap-3 sm:grid">
            <div className="flex items-center gap-2 rounded-3xl bg-[#0f1115] px-3 py-3 text-sm text-slate-300">
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
              <span className="min-w-[40px] text-right text-xs text-slate-400">{Math.round(volume * 100)}%</span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-3xl bg-[#0f1115] px-3 py-3 text-sm text-slate-300">
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
        </div>
      </div>

      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-sm text-slate-300">Loading video…</div>
      )}
    </div>
  );
}
