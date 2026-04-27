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
  ArrowPathIcon,
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
  onNext?: () => void;
  onPrevious?: () => void;
  onRepeat?: () => void;
  className?: string;
}

export default function MobilePlayer({
  track,
  isPlaying,
  onPlayPause,
  onClose,
  onNext,
  onPrevious,
  onRepeat,
  className,
}: MobilePlayerProps) {
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
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

  // Spectrum Visualizer Component - Music Visualizer Style
  const SpectrumVisualizer = ({ isPlaying = false, progress = 0, className = "" }) => {
    // Create frequency bars with different heights for spectrum effect
    const bars = Array.from({ length: 60 }, (_, i) => {
      // Create frequency-like distribution (more bars in middle frequencies)
      const frequency = i / 60;
      const baseHeight = Math.sin(frequency * Math.PI * 2) * 12 + Math.random() * 8 + 4;
      const isActive = i < progress * 60;
      const isNearActive = i < (progress * 60) + 3;

      // Create spectrum-like height variations
      const spectrumHeight = Math.abs(Math.sin(frequency * Math.PI * 4)) * 20 + Math.random() * 6 + 2;

      return {
        height: isPlaying ? spectrumHeight : baseHeight,
        isActive,
        isNearActive,
        delay: i * 0.005,
        frequency: frequency,
        // Create different colors for different frequency ranges
        colorIndex: Math.floor(frequency * 3) // 0, 1, 2 for different color bands
      };
    });

    const getBarColor = (bar: any) => {
      if (bar.isActive) {
        // Active bars: purple to pink gradient based on frequency
        const colors = [
          "from-purple-500 to-purple-300", // Low frequencies
          "from-purple-400 to-pink-400",   // Mid frequencies
          "from-pink-400 to-pink-300"      // High frequencies
        ];
        return colors[bar.colorIndex] || colors[0];
      } else if (bar.isNearActive && isPlaying) {
        return "from-purple-600/70 to-pink-500/70";
      } else if (isPlaying) {
        return "from-purple-500/40 to-pink-400/40";
      }
      return "from-purple-400/20 to-pink-300/20";
    };

    return (
      <div className={`absolute inset-0 flex items-center justify-center pointer-events-none ${className}`}>
        <div className="flex items-end gap-0.5 justify-center opacity-80">
          {bars.map((bar, i) => (
            <motion.div
              key={i}
              className={`rounded-t-sm transition-all duration-200 bg-gradient-to-t ${getBarColor(bar)}`}
              style={{
                width: '2px',
                minHeight: '2px',
                boxShadow: bar.isActive ? `0 0 8px rgba(147, 51, 234, 0.8), 0 0 16px rgba(236, 72, 153, 0.6)` : 'none',
              }}
              animate={isPlaying ? {
                height: [
                  bar.height * 0.3,
                  bar.height * (bar.isActive ? 1.8 : 1.4),
                  bar.height * (bar.isActive ? 1.2 : 0.8),
                  bar.height * (bar.isActive ? 1.6 : 1.1),
                  bar.height
                ],
                scaleY: bar.isActive ? [0.8, 1.3, 0.9, 1.1, 1] : [0.9, 1.1, 0.95, 1.05, 1],
              } : {
                height: bar.height * 0.5,
                scaleY: 1
              }}
              transition={{
                duration: bar.isActive ? 0.4 : 0.6,
                delay: bar.delay,
                repeat: isPlaying ? Infinity : 0,
                ease: "easeInOut",
                repeatType: "reverse"
              }}
            />
          ))}
        </div>

        {/* Progress indicator line */}
        {isPlaying && (
          <motion.div
            className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500"
            style={{ width: `${progress * 100}%` }}
            animate={{
              boxShadow: [
                "0 0 4px rgba(147, 51, 234, 0.6)",
                "0 0 8px rgba(236, 72, 153, 0.8)",
                "0 0 4px rgba(147, 51, 234, 0.6)"
              ]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}
      </div>
    );
  };

  // Scrolling Title Component
  const ScrollingTitle = ({ title, isPlaying }: { title: string; isPlaying: boolean }) => {
    const shouldScroll = title.length > 20 && isPlaying;

    return (
      <div className="overflow-hidden relative">
        <motion.div
          className="whitespace-nowrap"
          animate={shouldScroll ? {
            x: [0, -100, 0],
          } : {}}
          transition={{
            duration: 8,
            repeat: shouldScroll ? Infinity : 0,
            ease: "linear",
            repeatType: "loop"
          }}
        >
          <span className="text-white font-semibold text-sm">
            {title}
          </span>
        </motion.div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        className={`fixed left-0 right-0 bottom-16 z-40 bg-black/90 backdrop-blur-2xl border-t border-white/10 shadow-2xl ${className || ""}`}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 120 }}
      >
        <div className="p-2 relative">
          {/* Waveform Background */}
          <SpectrumVisualizer
            isPlaying={isPlaying}
            progress={duration > 0 ? currentTime / duration : 0}
            className="h-full"
          />

          {/* Compact Track Info and Controls */}
          <div className="flex items-center gap-2 relative z-10">
            {/* Track Image */}
            <div className="relative">
              <Image
                src={track.imageUrl || "/default-cover.jpg"}
                alt={track.title || "Track cover"}
                width={40}
                height={40}
                className="rounded-md object-cover shadow-lg"
              />
              {isLoading && (
                <div className="absolute inset-0 bg-black/40 rounded-md flex items-center justify-center">
                  <div className="animate-spin rounded-full h-2 w-2 border-b-2 border-white"></div>
                </div>
              )}
            </div>

            {/* Track Info with Scrolling Title */}
            <div className="flex-1 min-w-0 relative z-10">
              <ScrollingTitle title={track.title || "Unknown Title"} isPlaying={isPlaying} />
              <p className="text-white/70 text-xs truncate">
                {track.artist || "Unknown Artist"}
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1 relative z-10">
              <button
                onClick={() => setIsLiked(!isLiked)}
                className="p-1 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Like track"
              >
                {isLiked ? (
                  <HeartIcon className="w-4 h-4 text-pink-400" />
                ) : (
                  <HeartOutline className="w-4 h-4 text-white/70" />
                )}
              </button>

              <button
                onClick={onPrevious}
                disabled={!onPrevious}
                className="p-1.5 rounded-full hover:bg-white/10 transition-colors disabled:opacity-30"
                aria-label="Previous track"
              >
                <BackwardIcon className="w-4 h-4 text-white" />
              </button>

              <button
                onClick={onPlayPause}
                disabled={isLoading}
                className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all disabled:opacity-50 active:scale-95"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <PauseIcon className="w-4 h-4 text-black ml-0.5" />
                ) : (
                  <PlayIcon className="w-4 h-4 text-black ml-0.5" />
                )}
              </button>

              <button
                onClick={onNext}
                disabled={!onNext}
                className="p-1.5 rounded-full hover:bg-white/10 transition-colors disabled:opacity-30"
                aria-label="Next track"
              >
                <ForwardIcon className="w-4 h-4 text-white" />
              </button>

              <button
                onClick={() => {
                  setIsRepeat(!isRepeat);
                  if (onRepeat) onRepeat();
                }}
                className={`p-1 rounded-full hover:bg-white/10 transition-colors ${isRepeat ? 'text-purple-400' : 'text-white/70'}`}
                aria-label="Repeat"
              >
                <ArrowPathIcon className="w-4 h-4" />
              </button>

              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Close player"
              >
                <XMarkIcon className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* Compact Progress Bar */}
          <div className="mt-2 relative z-10">
            <div
              className="h-0.5 bg-white/20 rounded-full cursor-pointer relative overflow-hidden"
              onClick={handleSeek}
            >
              <motion.div
                className="h-full bg-gradient-to-r from-purple-400 to-purple-500 rounded-full"
                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
            <div className="flex justify-between text-xs text-white/60 mt-0.5">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
