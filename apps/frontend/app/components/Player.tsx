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
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  HeartIcon,
  QueueListIcon,
  MusicalNoteIcon,
  EllipsisHorizontalIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { HeartIcon as HeartOutline } from "@heroicons/react/24/outline";

type TrackType = {
  id: string;
  title: string;
  artist: string;
  album?: string;
  imageUrl?: string;
  audioUrl?: string;
  duration?: number;
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
  const [isLiked, setIsLiked] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [equalizerPreset, setEqualizerPreset] = useState("default");
  const [isLoading, setIsLoading] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  // Audio initialization (keep your existing useEffect)
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

    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("loadstart", handleLoadStart);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("canplaythrough", handleCanPlay);

    return () => {
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("loadstart", handleLoadStart);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("canplaythrough", handleCanPlay);
      audio.pause();
    };
  }, []);

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
    audio.playbackRate = playbackRate;
    audio.loop = isLooping;

    if (isPlaying) {
      audio.play().catch((err) => {
        console.warn("Audio play() failed:", err);
        setIsLoading(false);
      });
    } else {
      audio.pause();
    }
  }, [track?.audioUrl, isPlaying, volume, isMuted, playbackRate, isLooping]);

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

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <AnimatePresence>
      <motion.div
        className={`fixed bottom-0 left-0 right-0 z-50 ${
          isExpanded ? "h-[60vh]" : "h-20" // Reduced from h-32 to h-20
        } bg-gradient-to-br from-[#0a3747]/95 to-[#0a1f29]/95 border-t border-white/10 shadow-2xl backdrop-blur-lg ${
          className || ""
        }`}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 120 }}
      >
        {/* Compact Player Header */}
        <div className="flex items-center justify-between p-2 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <MusicalNoteIcon className="w-4 h-4 text-[#e51f48]" />
              {isPlaying && (
                <motion.div
                  className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-[#e51f48] rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
            </div>
            <span className="text-xs font-medium text-white mobile-text-xs">Now Playing</span>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded-full hover:bg-white/10 transition-colors touch-target"
              aria-label={isExpanded ? "Minimize player" : "Expand player"}
            >
              {isExpanded ? (
                <ArrowsPointingInIcon className="w-3 h-3 text-white" />
              ) : (
                <ArrowsPointingOutIcon className="w-3 h-3 text-white" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-white/10 transition-colors touch-target"
              aria-label="Close player"
            >
              <XMarkIcon className="w-3 h-3 text-white" />
            </button>
          </div>
        </div>

        {/* Compact Player Content */}
        <div
          className={`flex ${isExpanded ? "flex-col h-[calc(100%-2rem)]" : "flex-row h-[calc(100%-2rem)]"} p-2 overflow-y-auto`}
        >
          {/* Compact Track Info */}
          <div className={`flex items-center ${isExpanded ? "mb-4" : "flex-1 min-w-0"}`}>
            <div className="relative flex-shrink-0 group">
              <Image
                src={track.imageUrl || "/default-cover.jpg"}
                alt={track.title}
                width={isExpanded ? 120 : 48} // Reduced sizes
                height={isExpanded ? 120 : 48}
                className={`rounded-lg object-cover shadow-lg transition-all duration-300 group-hover:shadow-[#e51f48]/50 ${
                  isExpanded ? "w-30 h-30" : "w-12 h-12" // Reduced sizes
                }`}
              />
              {isLoading ? (
                <div className="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#e51f48]"></div>
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

            <div className={`ml-2 ${isExpanded ? "flex-1" : "flex-1 min-w-0"}`}>
              <div className="flex items-center">
                <h3 className={`${isExpanded ? "text-lg" : "text-sm"} font-bold text-white truncate mobile-text-sm`}>
                  {track.title}
                </h3>
                {isLiked && <HeartIcon className="ml-1 w-3 h-3 text-[#e51f48]" />}
              </div>
              <p className={`${isExpanded ? "text-sm" : "text-xs"} text-gray-300 truncate mobile-text-xs`}>
                {track.artist}
              </p>
              {isExpanded && track.album && (
                <p className="text-xs text-gray-400 mt-0.5 mobile-text-xs">{track.album}</p>
              )}

              {isExpanded && (
                <div className="flex items-center mt-2 space-x-3">
                  <button 
                    onClick={() => setIsLiked(!isLiked)} 
                    className="flex items-center text-xs hover:text-[#e51f48] transition-colors touch-target"
                  >
                    {isLiked ? <HeartIcon className="w-4 h-4 text-[#e51f48]" /> : <HeartOutline className="w-4 h-4 text-gray-400" />}
                    <span className="ml-1 mobile-text-xs">Like</span>
                  </button>

                  <button className="flex items-center text-xs text-gray-400 hover:text-white transition-colors touch-target">
                    <QueueListIcon className="w-4 h-4" />
                    <span className="ml-1 mobile-text-xs">Queue</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Compact Player Controls */}
          <div className={`${isExpanded ? "mt-auto" : "flex-1 flex flex-col justify-center"}`}>
            {/* Compact Progress Bar */}
            <div className={`relative ${isExpanded ? "my-3" : "my-1 w-full"}`} onClick={handleSeek}>
              <div className="h-1 bg-white/10 rounded-full w-full cursor-pointer">
                <div 
                  ref={progressBarRef} 
                  className="h-full bg-gradient-to-r from-[#e51f48] to-[#ff4d6d] rounded-full transition-all duration-100" 
                  style={{ width: `${progressPercentage}%` }} 
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-0.5 mobile-text-xs">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Compact Main Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button 
                  onClick={toggleLoop} 
                  className={`p-1.5 rounded-full ${isLooping ? "text-[#e51f48]" : "text-gray-400 hover:text-white"} transition-colors touch-target`} 
                  aria-label={isLooping ? "Disable loop" : "Enable loop"}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                    <path d="M21 3v5h-5" />
                  </svg>
                </button>

                <button 
                  onClick={() => { if (audioRef.current) audioRef.current.currentTime = Math.max(0, currentTime - 10); }} 
                  className="p-1.5 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors touch-target" 
                  aria-label="Rewind 10 seconds"
                >
                  <BackwardIcon className="w-4 h-4" />
                </button>
              </div>

              <button 
                onClick={onPlayPause} 
                disabled={isLoading} 
                className="p-2.5 bg-gradient-to-br from-[#e51f48] to-[#ff4d6d] rounded-full hover:shadow-lg hover:shadow-[#e51f48]/30 transition-all shadow-md disabled:opacity-50 touch-target" 
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <PauseIcon className="w-4 h-4 text-white" /> : <PlayIcon className="w-4 h-4 text-white" />}
              </button>

              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => { if (audioRef.current) audioRef.current.currentTime = Math.min(duration, currentTime + 10); }} 
                  className="p-1.5 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors touch-target" 
                  aria-label="Forward 10 seconds"
                >
                  <ForwardIcon className="w-4 h-4" />
                </button>

                <div className="relative group">
                  <button 
                    onClick={toggleMute} 
                    className="p-1.5 text-gray-400 hover:text-white rounded-full transition-colors touch-target" 
                    aria-label={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted || volume === 0 ? <SpeakerXMarkIcon className="w-4 h-4" /> : <SpeakerWaveIcon className="w-4 h-4" />}
                  </button>

                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block bg-[#0a3747] p-1.5 rounded-lg shadow-lg z-10">
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
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <h4 className="text-xs font-medium text-gray-300 mb-1 mobile-text-xs">Playback Speed</h4>
                  <button 
                    onClick={changePlaybackRate} 
                    className="px-2 py-1 bg-white/10 rounded-full text-xs hover:bg-white/20 transition-colors touch-target mobile-text-xs"
                  >
                    {playbackRate}x
                  </button>
                </div>

                <div>
                  <h4 className="text-xs font-medium text-gray-300 mb-1 mobile-text-xs">Equalizer</h4>
                  <select 
                    value={equalizerPreset} 
                    onChange={(e) => setEqualizerPreset(e.target.value)} 
                    className="px-2 py-1 bg-white/10 rounded-full text-xs hover:bg-white/20 w-full transition-colors mobile-text-xs"
                  >
                    <option value="default">Default</option>
                    <option value="pop">Pop</option>
                    <option value="rock">Rock</option>
                    <option value="jazz">Jazz</option>
                    <option value="classical">Classical</option>
                    <option value="bassBoost">Bass Boost</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}