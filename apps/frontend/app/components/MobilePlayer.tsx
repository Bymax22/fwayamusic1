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

    const updateDuration = () => {
      console.log('MobilePlayer: Duration loaded:', audio.duration);
      setDuration(audio.duration || 0);
    };
    const updateTime = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => {
      console.log('MobilePlayer: Track ended');
      if (onPlayPause) onPlayPause();
    };
    const handleLoadStart = () => {
      console.log('MobilePlayer: Load started');
      setIsLoading(true);
    };
    const handleCanPlay = () => {
      console.log('MobilePlayer: Can play now');
      setIsLoading(false);
    };
    const handleError = (e: Event) => {
      console.error('MobilePlayer: Audio error:', e);
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

    console.log('MobilePlayer: Setting up audio for track:', track);

    if (track?.audioUrl && typeof track.audioUrl === "string") {
      const src = track.audioUrl.trim();
      console.log('MobilePlayer: Audio URL:', src);
      
      if (src && audio.src !== src) {
        audio.preload = 'metadata';
        audio.crossOrigin = 'anonymous';
        audio.src = src;
        audio.load();
        setCurrentTime(0);
        setDuration(0);
        console.log('MobilePlayer: Audio source set and loaded');
      }
    } else {
      console.log('MobilePlayer: No valid audio URL provided');
      audio.pause();
      audio.src = "";
      setIsLoading(false);
      setCurrentTime(0);
      setDuration(0);
    }

    audio.volume = isMuted ? 0 : volume;
    audio.muted = isMuted;

    if (isPlaying) {
      console.log('MobilePlayer: Attempting to play');
      if (audio.readyState >= 2) {
        audio.play().catch((err) => {
          console.error("MobilePlayer: Audio play() failed:", err);
          setIsLoading(false);
        });
      } else {
        const playWhenReady = () => {
          console.log('MobilePlayer: Audio can play, starting playback');
          audio.removeEventListener('canplay', playWhenReady);
          audio.play().catch((err) => {
            console.error("MobilePlayer: Audio play() failed after canplay:", err);
            setIsLoading(false);
          });
        };
        audio.addEventListener('canplay', playWhenReady);
      }
    } else {
      console.log('MobilePlayer: Pausing audio');
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

  // Modern Waveform Component - Advanced Version
  const ModernWaveform = ({ isPlaying = false, progress = 0, className = "" }) => {
    const bars = Array.from({ length: 50 }, (_, i) => {
      const baseHeight = Math.sin(i * 0.3) * 8 + Math.random() * 6 + 4; // Sine wave with randomness
      const isActive = i < progress * 50;
      const isNearActive = i < (progress * 50) + 3; // Glow effect near active bars
      return { 
        height: baseHeight, 
        isActive, 
        isNearActive,
        delay: i * 0.01,
        frequency: Math.sin(i * 0.2) * 0.5 + 0.5 // For color variation
      };
    });

    return (
      <div className={`flex items-end gap-0.5 justify-center ${className}`}>
        {bars.map((bar, i) => (
          <motion.div
            key={i}
            className={`w-0.5 rounded-full transition-all duration-300 ${
              bar.isActive
                ? "bg-gradient-to-t from-purple-400 via-purple-300 to-white shadow-lg"
                : bar.isNearActive && isPlaying
                  ? "bg-gradient-to-t from-purple-500/60 to-purple-300/40"
                  : isPlaying
                    ? "bg-purple-400/40"
                    : "bg-white/30"
            }`}
            style={{
              height: isPlaying && bar.isActive ? `${bar.height * 1.8}px` : `${bar.height}px`,
              boxShadow: bar.isActive ? `0 0 8px rgba(147, 51, 234, ${bar.frequency * 0.6})` : 'none',
            }}
            animate={isPlaying ? {
              height: [
                bar.height, 
                bar.height * (bar.isActive ? 2.2 : 1.4), 
                bar.height * (bar.isActive ? 1.6 : 0.8), 
                bar.height
              ],
              scaleY: bar.isActive ? [1, 1.3, 0.9, 1] : [1, 1.1, 0.95, 1],
            } : {}}
            transition={{
              duration: bar.isActive ? 0.6 : 0.8,
              delay: bar.delay,
              repeat: isPlaying ? Infinity : 0,
              ease: "easeInOut",
              repeatType: "reverse"
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        className={`fixed left-0 right-0 bottom-16 z-40 bg-gradient-to-r from-purple-600/95 via-purple-700/95 to-purple-800/95 backdrop-blur-xl border-t border-white/20 shadow-2xl ${className || ""}`}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 120 }}
      >
        <div className="p-3">
          {/* Compact Track Info and Controls */}
          <div className="flex items-center gap-3">
            {/* Track Image */}
            <div className="relative">
              <Image
                src={track.imageUrl || "/default-cover.jpg"}
                alt={track.title || "Track cover"}
                width={48}
                height={48}
                className="rounded-lg object-cover shadow-lg"
              />
              {isLoading && (
                <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                </div>
              )}
            </div>

            {/* Track Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold text-sm truncate">
                {track.title || "Unknown Title"}
              </h3>
              <p className="text-white/70 text-xs truncate">
                {track.artist || "Unknown Artist"}
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsLiked(!isLiked)}
                className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Like track"
              >
                {isLiked ? (
                  <HeartIcon className="w-4 h-4 text-pink-400" />
                ) : (
                  <HeartOutline className="w-4 h-4 text-white/70" />
                )}
              </button>

              <button
                onClick={onPlayPause}
                disabled={isLoading}
                className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all disabled:opacity-50 active:scale-95"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <PauseIcon className="w-5 h-5 text-purple-600 ml-0.5" />
                ) : (
                  <PlayIcon className="w-5 h-5 text-purple-600 ml-0.5" />
                )}
              </button>

              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Close player"
              >
                <XMarkIcon className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* Compact Progress and Waveform */}
          <div className="mt-3">
            {/* Progress Bar */}
            <div className="mb-2">
              <div
                className="h-1 bg-white/20 rounded-full cursor-pointer relative overflow-hidden"
                onClick={handleSeek}
              >
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-400 to-purple-500 rounded-full"
                  style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
              <div className="flex justify-between text-xs text-white/60 mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Advanced Waveform */}
            <ModernWaveform
              isPlaying={isPlaying}
              progress={duration > 0 ? currentTime / duration : 0}
              className="h-6"
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
