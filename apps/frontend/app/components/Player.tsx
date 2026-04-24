"use client";
import Image from 'next/image';
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MobileMoneyPaymentPreviewModal } from "./modal/MobileMoneyPaymentPreviewModal";
import {
  PlayIcon,
  PauseIcon,
  ForwardIcon,
  BackwardIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  HeartIcon,
  QueueListIcon,
  MusicalNoteIcon,
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

interface PlayerProps {
  track: TrackType;
  isPlaying: boolean;
  onPlayPause: () => void;
  onClose: () => void;
  className?: string;
}

export default function Player({
  track,
  isPlaying,
  onPlayPause,
  onClose,
  className,
}: PlayerProps) {
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const previewTimerRef = useRef<number | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      console.log('Created new audio element');
    }
    const audio = audioRef.current;
    console.log('Audio element:', audio);

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
    audio.addEventListener("canplaythrough", handleCanPlay);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("loadstart", handleLoadStart);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("canplaythrough", handleCanPlay);
      audio.removeEventListener("error", handleError);
      audio.pause();
      if (previewTimerRef.current) {
        window.clearTimeout(previewTimerRef.current);
        previewTimerRef.current = null;
      }
    };
  }, [onPlayPause]);

  // Reset unlocked when the track changes
  useEffect(() => {
    setUnlocked(false);
  }, [track?.id]);

  // Audio playback logic (keep your existing useEffect)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (track?.audioUrl && typeof track.audioUrl === "string") {
      const src = track.audioUrl.trim();
      if (src && audio.src !== src) {
        // Your existing audio loading logic
        const ext = src.split(".").pop()?.split("?")[0].toLowerCase() || "";
        const mimeMap: Record<string, string> = {
          mp3: "audio/mpeg",
          m4a: "audio/mp4",
          aac: "audio/aac",
          ogg: "audio/ogg",
          oga: "audio/ogg",
          wav: "audio/wav",
          webm: "audio/webm",
          opus: "audio/ogg; codecs=opus",
          flac: "audio/flac",
        };
        const guessedMime = mimeMap[ext] || "";

        if (guessedMime) {
          const canPlay = audio.canPlayType(guessedMime);
          if (!canPlay) {
            console.warn(`Audio may not be supported: ${guessedMime}`);
          }
        }

        audio.preload = 'metadata'; // Preload metadata for better handling
        audio.crossOrigin = 'anonymous'; // Enable CORS for streaming
        audio.src = src;
        audio.load(); // Explicitly load the audio
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
    console.log('Setting audio volume to:', audio.volume, 'muted:', audio.muted);
    audio.playbackRate = playbackRate;
    audio.loop = isLooping;

    // Handle preview behavior for premium/pay-per-view tracks: play only first 30s
    const isPremiumTrack = track?.accessType === 'PREMIUM' || track?.accessType === 'PAY_PER_VIEW';

    if (isPlaying) {
      console.log('Attempting to play audio:', audio.src, 'volume:', audio.volume, 'muted:', audio.muted, 'readyState:', audio.readyState);
      
      // Wait for audio to be ready
      if (audio.readyState >= 2) { // HAVE_CURRENT_DATA or better
        audio.play().then(() => {
          console.log('Audio started playing successfully');
        }).catch((err) => {
          console.error("Audio play() failed:", err);
          setIsLoading(false);
        });
      } else {
        console.log('Audio not ready yet, waiting for canplay event');
        const playWhenReady = () => {
          audio.removeEventListener('canplay', playWhenReady);
          audio.play().then(() => {
            console.log('Audio started playing successfully after canplay');
          }).catch((err) => {
            console.error("Audio play() failed after canplay:", err);
            setIsLoading(false);
          });
        };
        audio.addEventListener('canplay', playWhenReady);
      }

      // If premium and not unlocked, ensure we only play a 30-second preview
      if (isPremiumTrack && !unlocked) {
        if (previewTimerRef.current) {
          window.clearTimeout(previewTimerRef.current);
        }
        previewTimerRef.current = window.setTimeout(() => {
          // Pause playback and notify parent
          audio.pause();
          if (onPlayPause) onPlayPause();
          // Show purchase modal
          setShowPurchaseModal(true);
        }, 30000);
      }
    } else {
      console.log('Pausing audio');
      audio.pause();
      if (previewTimerRef.current) {
        window.clearTimeout(previewTimerRef.current);
        previewTimerRef.current = null;
      }
    }
  }, [track, track?.audioUrl, isPlaying, volume, isMuted, playbackRate, isLooping, onPlayPause, unlocked]);

  // Rest of your existing functions (handleSeek, handleVolumeChange, etc.)
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

  const toggleLoop = () => {
    const audio = audioRef.current;
    setIsLooping((l) => {
      const next = !l;
      if (audio) audio.loop = next;
      return next;
    });
  };

  const changePlaybackRate = () => {
    const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const currentIndex = rates.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % rates.length;
    const newRate = rates[nextIndex];

    setPlaybackRate(newRate);
    if (audioRef.current) audioRef.current.playbackRate = newRate;
  };

  const handleClosePurchaseModal = () => {
    setShowPurchaseModal(false);
  };

  

  const handlePaymentSuccess = () => {
    // mark current track as unlocked and resume playback
    setUnlocked(true);
    setShowPurchaseModal(false);
    if (previewTimerRef.current) {
      window.clearTimeout(previewTimerRef.current);
      previewTimerRef.current = null;
    }
    const audio = audioRef.current;
    if (audio) {
      audio.play().catch(() => {});
    }
    if (!isPlaying && onPlayPause) {
      onPlayPause();
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Advanced Waveform component
  const AudioWaveform = ({ isPlaying = false, progress = 0, className = "" }) => {
    const bars = Array.from({ length: 25 }, (_, i) => {
      const baseHeight = Math.random() * 16 + 4; // Random height between 4-20
      const isActive = i < progress * 25; // Show progress
      return { height: baseHeight, isActive, delay: i * 0.05 };
    });

    return (
      <div className={`flex items-end gap-0.5 ${className}`}>
        {bars.map((bar, i) => (
          <motion.div
            key={i}
            className={`w-0.5 rounded-sm transition-all duration-200 ${
              bar.isActive
                ? "bg-gradient-to-t from-purple-500 to-pink-500"
                : isPlaying
                  ? "bg-white/40"
                  : "bg-white/20"
            }`}
            style={{
              height: isPlaying && i % 4 === 0 ? `${bar.height * 1.3}px` : `${bar.height}px`,
            }}
            animate={isPlaying && i % 5 === 0 ? {
              height: [bar.height, bar.height * 1.5, bar.height * 0.8, bar.height],
              scaleY: [1, 1.2, 0.9, 1]
            } : {}}
            transition={{
              duration: 0.6,
              delay: bar.delay,
              repeat: isPlaying ? Infinity : 0,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
    );
  };

  const notifyMinimized = (minimized: boolean) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("player:minimized", {
          detail: { minimized, title: track?.title, artist: track?.artist },
        })
      );
      // Request opening/closing of bottom header in the app layout
      window.dispatchEvent(new CustomEvent("player:openBottomHeader", { detail: { open: minimized } }));
    }
  };

  return (
    <AnimatePresence>
      {/* Minimized Floating Button */}
      {isMinimized && (
        <motion.button
          onClick={() => {
            setIsMinimized(false);
            notifyMinimized(false);
          }}
          className="fixed bottom-20 md:bottom-4 right-4 z-40 rounded-full shadow-2xl overflow-hidden focus:outline-none active:scale-95 transition-transform"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          aria-label="Open player"
        >
          <div className="relative w-16 h-16 rounded-full overflow-hidden">
            {/* Album Art Background */}
            <Image
              src={track.imageUrl || "/default-cover.jpg"}
              alt={track.title || "Track cover"}
              width={64}
              height={64}
              className="w-full h-full object-cover"
            />
            
            {/* Light overlay */}
            <div className="absolute inset-0 bg-black/20" />
            
            {/* Waveform */}
            <div className="absolute inset-0 flex items-center justify-center">
              <AudioWaveform isPlaying={isPlaying} progress={currentTime / duration} className="scale-75" />
            </div>
          </div>
        </motion.button>
      )}

      {/* Main Player */}
      {!isMinimized && (
        <motion.div
          className={`fixed left-0 right-0 z-50 ${
            isExpanded ? "h-[60vh]" : "h-32 sm:h-28"
          } bg-gradient-to-br from-[#0a1f29]/95 to-[#0a3747]/95 border-t border-white/10 shadow-2xl backdrop-blur-lg bottom-0 md:bottom-0 ${
            className || ""
          }`}
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 120 }}
        >
        {/* Compact Player Header - Minimal height */}
        <div className="flex items-center justify-between py-1 px-3 sm:py-0.5 sm:px-2 border-b border-white/10">
          <div className="flex items-center gap-3 sm:gap-2 min-w-0 flex-1">
            <div className="relative flex-shrink-0">
              <MusicalNoteIcon className="w-4 h-4 text-purple-400" />
              {isPlaying && (
                <motion.div
                  className="absolute -top-0.5 -right-0.5 w-0.5 h-0.5 bg-purple-400 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
            </div>
            <div className="flex-1 min-w-0 overflow-hidden">
              <motion.div
                className="flex gap-3"
                animate={{ x: isPlaying ? [`0%`, `-100%`] : 0 }}
                transition={
                  isPlaying ? { duration: 8, repeat: Infinity, ease: "linear" } : { duration: 0 }
                }
              >
                <div className="flex-shrink-0 whitespace-nowrap">
                  <p className="text-xs font-bold text-white truncate">
                    {track.title || "Unknown Title"}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {track.artist || "Unknown Artist"}
                  </p>
                </div>
                {isPlaying && (
                  <div className="flex-shrink-0 whitespace-nowrap">
                    <p className="text-xs font-bold text-white truncate">
                      {track.title || "Unknown Title"}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {track.artist || "Unknown Artist"}
                    </p>
                  </div>
                )}
              </motion.div>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => {
                setIsMinimized(true);
                notifyMinimized(true);
              }}
              className="p-2 sm:p-1.5 rounded-full hover:bg-white/10 transition-colors active:bg-white/20"
              aria-label="Minimize player"
              title="Minimize"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 sm:w-3 sm:h-3 text-white">
                <path d="M12 9v6m-6 0v-6m12 0v6" />
                <circle cx="12" cy="12" r="10" />
              </svg>
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 sm:p-1.5 rounded-full hover:bg-white/10 transition-colors active:bg-white/20"
              aria-label={isExpanded ? "Minimize player" : "Expand player"}
            >
              {isExpanded ? (
                <ArrowsPointingInIcon className="w-4 h-4 sm:w-3 sm:h-3 text-white" />
              ) : (
                <ArrowsPointingOutIcon className="w-4 h-4 sm:w-3 sm:h-3 text-white" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 sm:p-1.5 rounded-full hover:bg-white/10 transition-colors active:bg-white/20"
              aria-label="Close player"
            >
              <XMarkIcon className="w-4 h-4 sm:w-3 sm:h-3 text-white" />
            </button>
          </div>
        </div>

        {/* Compact Player Content */}
        <div
          className={`flex ${isExpanded ? "flex-col h-[calc(100%-2rem)] sm:h-[calc(100%-1.5rem)]" : "flex-row h-[calc(100%-1.5rem)]"} px-3 sm:px-2 py-2 sm:py-1 gap-2 sm:gap-1 ${!isExpanded ? "overflow-hidden" : "overflow-y-auto"}`}
        >
          {/* Album Cover - Only in compact mode */}
          {!isExpanded && (
            <div className="flex-shrink-0">
              <div className="relative flex-shrink-0 group">
                <Image
                  src={track.imageUrl || "/default-cover.jpg"}
                  alt={track.title || "Track cover"}
                  width={56}
                  height={56}
                  className="rounded-lg object-cover shadow-lg transition-all duration-300 group-hover:shadow-[#e51f48]/50 w-14 h-14 sm:w-12 sm:h-12"
                />
                {isLoading ? (
                  <div className="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-400"></div>
                  </div>
                ) : isPlaying ? (
                  <motion.div
                    className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center"
                    animate={{ opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <PlayIcon className="w-4 h-4 text-white" />
                  </motion.div>
                ) : null}
              </div>
            </div>
          )}

          {/* Compact Player Controls */}
          <div className={`${isExpanded ? "mt-auto w-full" : "flex-1 flex flex-col justify-center"}`}>
            {/* Compact Progress Bar */}
            <div className={`relative ${isExpanded ? "my-3" : "my-1 sm:my-0.5 w-full"}`} onClick={handleSeek}>
              <div className="h-1 bg-white/10 rounded-full w-full cursor-pointer">
                <div
                  ref={progressBarRef}
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-100"
                  style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1 sm:mt-0.5">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
              {isPlaying && (
                <div className="mt-2 flex justify-center">
                  <AudioWaveform isPlaying={isPlaying} progress={currentTime / duration} className="h-4" />
                </div>
              )}
            </div>

            {/* Compact Main Controls */}
            <div className="flex items-center justify-between gap-2 sm:gap-1.5 mt-1 sm:mt-0.5">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <button 
                  onClick={toggleLoop} 
                  className={`p-2 sm:p-1.5 rounded-full ${isLooping ? "text-[#e51f48] bg-white/10" : "text-gray-400 hover:text-white hover:bg-white/10"} transition-colors active:bg-white/20`} 
                  aria-label={isLooping ? "Disable loop" : "Enable loop"}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:w-4 sm:h-4">
                    <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                    <path d="M21 3v5h-5" />
                  </svg>
                </button>

                <button 
                  onClick={() => { if (audioRef.current) audioRef.current.currentTime = Math.max(0, currentTime - 10); }} 
                  className="p-2 sm:p-1.5 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors active:bg-white/20" 
                  aria-label="Rewind 10 seconds"
                >
                  <BackwardIcon className="w-5 h-5 sm:w-4 sm:h-4" />
                </button>
              </div>

              <button 
                onClick={onPlayPause} 
                disabled={isLoading} 
                className="p-3 sm:p-2.5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full hover:shadow-lg hover:shadow-purple-500/30 transition-all shadow-md disabled:opacity-50 active:scale-95" 
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <PauseIcon className="w-5 h-5 sm:w-4 sm:h-4 text-white" /> : <PlayIcon className="w-5 h-5 sm:w-4 sm:h-4 text-white" />}
              </button>

              <div className="flex items-center gap-1 sm:gap-1.5">
                <button 
                  onClick={() => { if (audioRef.current) audioRef.current.currentTime = Math.min(duration, currentTime + 10); }} 
                  className="p-2 sm:p-1.5 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors active:bg-white/20" 
                  aria-label="Forward 10 seconds"
                >
                  <ForwardIcon className="w-5 h-5 sm:w-4 sm:h-4" />
                </button>

                <div className="relative group">
                  <button 
                    onClick={toggleMute} 
                    className="p-2 sm:p-1.5 text-gray-400 hover:text-white rounded-full transition-colors hover:bg-white/10 active:bg-white/20" 
                    aria-label={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted || volume === 0 ? <SpeakerXMarkIcon className="w-5 h-5 sm:w-4 sm:h-4" /> : <SpeakerWaveIcon className="w-5 h-5 sm:w-4 sm:h-4" />}
                  </button>

                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-[#0a3747] p-2 rounded-lg shadow-lg z-10">
                    <input 
                      type="range" 
                      min="0" 
                      max="1" 
                      step="0.01" 
                      value={isMuted ? 0 : volume} 
                      onChange={handleVolumeChange} 
                      className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white" 
                      aria-label="Volume control" 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Compact Expanded View Controls */}
            {isExpanded && (
              <div className="mt-4 w-full">
                <h4 className="text-sm font-medium text-gray-300 mb-3">Playback Speed</h4>
                <button 
                  onClick={changePlaybackRate} 
                  className="px-4 py-2.5 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition-colors active:bg-white/30 font-medium"
                >
                  {playbackRate}x
                </button>
              </div>
            )}
          </div>

          {/* Album Cover Section - Expanded View */}
          {isExpanded && (
            <div className="flex items-center mb-4 gap-4">
              <div className="relative flex-shrink-0 group">
                <Image
                  src={track.imageUrl || "/default-cover.jpg"}
                  alt={track.title || "Track cover"}
                  width={120}
                  height={120}
                  className="rounded-lg object-cover shadow-lg transition-all duration-300 group-hover:shadow-[#e51f48]/50 w-30 h-30"
                />
                {isLoading ? (
                  <div className="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-400"></div>
                  </div>
                ) : isPlaying ? (
                  <motion.div
                    className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center"
                    animate={{ opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <PlayIcon className="w-4 h-4 text-white" />
                  </motion.div>
                ) : null}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-lg font-bold text-white truncate">
                      {track.title || "Unknown Title"}
                    </h3>
                  {isLiked && <HeartIcon className="flex-shrink-0 w-4 h-4 text-purple-400" />}
                </div>
                <p className="text-sm text-gray-300 truncate">
                  {track.artist || "Unknown Artist"}
                </p>
                {track.album && (
                  <p className="text-xs text-gray-400 mt-0.5">{track.album}</p>
                )}

                <div className="flex items-center mt-4 space-x-4">
                  <button 
                    onClick={() => setIsLiked(!isLiked)} 
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm hover:bg-white/10 hover:text-purple-400 transition-colors active:bg-white/20"
                  >
                    {isLiked ? <HeartIcon className="w-4 h-4 text-purple-400" /> : <HeartOutline className="w-4 h-4 text-gray-400" />}
                    <span>Like</span>
                  </button>

                  <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/10 transition-colors active:bg-white/20">
                    <QueueListIcon className="w-4 h-4" />
                    <span>Queue</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Purchase modal for premium preview */}
        {/* Use the preview-specific modal for premium preview flows */}
        <MobileMoneyPaymentPreviewModal
          isOpen={showPurchaseModal}
          onClose={handleClosePurchaseModal}
          media={{
            id: Number(track.id),
            title: track.title || "",
            artist: track.artist || "",
            price: track.price || 0,
            currency: track.currency || "ZMW",
          }}
          onSuccess={handlePaymentSuccess}
        />
      </motion.div>
      )}
    </AnimatePresence>
  );
}