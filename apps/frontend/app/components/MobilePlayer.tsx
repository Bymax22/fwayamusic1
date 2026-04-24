"use client";
import Image from 'next/image';
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlayIcon,
  PauseIcon,
  ForwardIcon,
  BackwardIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  HeartIcon,
  QueueListIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { HeartIcon as HeartOutline } from "@heroicons/react/24/outline";

type TrackType = {
  id: string | number;
  title?: string;
  artist?: string;
  album?: string;
  imageUrl?: string;
  audioUrl?: string;
  duration?: number;
  accessType?: 'FREE' | 'PREMIUM' | 'PAY_PER_VIEW';
  price?: number;
  currency?: string;
};

interface MobilePlayerProps {
  track: TrackType;
  isPlaying: boolean;
  onPlayPause: () => void;
  onClose: () => void;
  className?: string;
}

export default function MobilePlayer({
  track,
  isPlaying,
  onPlayPause,
  onClose,
  className,
}: MobilePlayerProps) {
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    const audio = audioRef.current;

    const updateDuration = () => setDuration(audio.duration || 0);
    const updateTime = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => {
      if (onPlayPause) onPlayPause();
    };
    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleError = (e: Event) => {
      console.error('Audio error:', e);
      setIsLoading(false);
    };

    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("loadstart", handleLoadStart);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("loadstart", handleLoadStart);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("error", handleError);
      audio.pause();
    };
  }, [onPlayPause]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (track?.audioUrl && typeof track.audioUrl === "string") {
      const src = track.audioUrl.trim();
      if (src && audio.src !== src) {
        audio.preload = 'metadata';
        audio.crossOrigin = 'anonymous';
        audio.src = src;
        audio.load();
        setCurrentTime(0);
        setDuration(0);
      }
    } else {
      audio.pause();
      audio.src = "";
      setIsLoading(false);
      setCurrentTime(0);
      setDuration(0);
    }

    audio.volume = isMuted ? 0 : volume;
    audio.muted = isMuted;

    if (isPlaying) {
      if (audio.readyState >= 2) {
        audio.play().catch((err) => {
          console.error("Audio play() failed:", err);
          setIsLoading(false);
        });
      } else {
        const playWhenReady = () => {
          audio.removeEventListener('canplay', playWhenReady);
          audio.play().catch((err) => {
            console.error("Audio play() failed after canplay:", err);
            setIsLoading(false);
          });
        };
        audio.addEventListener('canplay', playWhenReady);
      }
    } else {
      audio.pause();
    }
  }, [track, track?.audioUrl, isPlaying, volume, isMuted, onPlayPause]);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !progressBarRef.current) return;

    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;

    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    const audio = audioRef.current;
    if (audio && !isMuted) {
      audio.volume = newVolume;
    }
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    setIsMuted((m) => {
      const next = !m;
      if (audio) audio.volume = next ? 0 : volume;
      return next;
    });
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Modern Waveform Component
  const ModernWaveform = ({ isPlaying = false, progress = 0, className = "" }) => {
    const bars = Array.from({ length: 40 }, (_, i) => {
      const baseHeight = Math.random() * 20 + 8; // Height between 8-28
      const isActive = i < progress * 40;
      return { height: baseHeight, isActive, delay: i * 0.02 };
    });

    return (
      <div className={`flex items-end gap-0.5 ${className}`}>
        {bars.map((bar, i) => (
          <motion.div
            key={i}
            className={`w-0.5 rounded-full transition-all duration-200 ${
              bar.isActive
                ? "bg-gradient-to-t from-purple-500 to-pink-500 shadow-lg shadow-purple-500/50"
                : isPlaying
                  ? "bg-white/60"
                  : "bg-white/30"
            }`}
            style={{
              height: isPlaying && i % 6 === 0 ? `${bar.height * 1.4}px` : `${bar.height}px`,
            }}
            animate={isPlaying && i % 8 === 0 ? {
              height: [bar.height, bar.height * 1.6, bar.height * 0.7, bar.height],
              scaleY: [1, 1.3, 0.8, 1]
            } : {}}
            transition={{
              duration: 0.8,
              delay: bar.delay,
              repeat: isPlaying ? Infinity : 0,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        className={`fixed left-0 right-0 bottom-16 z-40 bg-gradient-to-r from-purple-600/95 via-purple-500/95 to-pink-500/95 backdrop-blur-xl border-t border-white/20 shadow-2xl ${className || ""}`}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 120 }}
      >
        <div className="p-4">
          {/* Track Info */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative">
              <Image
                src={track.imageUrl || "/default-cover.jpg"}
                alt={track.title || "Track cover"}
                width={60}
                height={60}
                className="rounded-xl object-cover shadow-lg"
              />
              {isLoading && (
                <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-bold text-lg truncate">
                {track.title || "Unknown Title"}
              </h3>
              <p className="text-white/80 text-sm truncate">
                {track.artist || "Unknown Artist"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Close player"
            >
              <XMarkIcon className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Modern Waveform */}
          <div className="mb-4 flex justify-center">
            <ModernWaveform
              isPlaying={isPlaying}
              progress={duration > 0 ? currentTime / duration : 0}
              className="h-8"
            />
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div
              className="h-1.5 bg-white/20 rounded-full cursor-pointer relative overflow-hidden"
              onClick={handleSeek}
            >
              <motion.div
                className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"
                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                transition={{ duration: 0.1 }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
            </div>
            <div className="flex justify-between text-xs text-white/70 mt-2">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsLiked(!isLiked)}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Like track"
              >
                {isLiked ? (
                  <HeartIcon className="w-6 h-6 text-pink-400" />
                ) : (
                  <HeartOutline className="w-6 h-6 text-white/70" />
                )}
              </button>

              <button
                onClick={() => { if (audioRef.current) audioRef.current.currentTime = Math.max(0, currentTime - 10); }}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Rewind 10 seconds"
              >
                <BackwardIcon className="w-6 h-6 text-white" />
              </button>
            </div>

            <button
              onClick={onPlayPause}
              disabled={isLoading}
              className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all disabled:opacity-50 active:scale-95"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <PauseIcon className="w-7 h-7 text-purple-600 ml-0.5" />
              ) : (
                <PlayIcon className="w-7 h-7 text-purple-600 ml-0.5" />
              )}
            </button>

            <div className="flex items-center gap-4">
              <button
                onClick={() => { if (audioRef.current) audioRef.current.currentTime = Math.min(duration, currentTime + 10); }}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Forward 10 seconds"
              >
                <ForwardIcon className="w-6 h-6 text-white" />
              </button>

              <div className="relative group">
                <button
                  onClick={toggleMute}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                  aria-label={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted || volume === 0 ? (
                    <SpeakerXMarkIcon className="w-6 h-6 text-white/70" />
                  ) : (
                    <SpeakerWaveIcon className="w-6 h-6 text-white" />
                  )}
                </button>

                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-black/80 p-3 rounded-lg shadow-lg z-10">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-24 h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                    aria-label="Volume control"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
