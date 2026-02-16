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
  XMarkIcon,
  ClockIcon,
} from "@heroicons/react/24/solid";

type TrackType = {
  id: string | number;
  title?: string;
  artist?: string;
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

// Equalizer presets with gain values (bass, mid, treble)
const EQ_PRESETS = {
  default: { bass: 0, mid: 0, treble: 0 },
  pop: { bass: 2, mid: 3, treble: 4 },
  rock: { bass: 5, mid: 2, treble: 3 },
  jazz: { bass: 1, mid: 4, treble: 5 },
  classical: { bass: 0, mid: 2, treble: 6 },
  bassBoost: { bass: 8, mid: 1, treble: 0 },
  electronic: { bass: 6, mid: 3, treble: 5 },
  vocals: { bass: 1, mid: 6, treble: 3 },
};

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
  const [isLooping, setIsLooping] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [equalizerPreset, setEqualizerPreset] = useState("default");
  const [isLoading, setIsLoading] = useState(false);
  const [audioQuality, setAudioQuality] = useState<"low" | "medium" | "high" | "lossless">("high");
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [gainNode, setGainNode] = useState<GainNode | null>(null);
  const [bassFilter, setBassFilter] = useState<BiquadFilterNode | null>(null);
  const [midFilter, setMidFilter] = useState<BiquadFilterNode | null>(null);
  const [trebleFilter, setTrebleFilter] = useState<BiquadFilterNode | null>(null);
  const [isAudioContextInitialized, setIsAudioContextInitialized] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  // Initialize Audio Context and EQ filters
  const initAudioContext = () => {
    if (!audioRef.current || isAudioContextInitialized) return;

    try {
      // Create audio context with high quality
      const AudioContextClass = window.AudioContext || (window as unknown as Record<string, unknown>).webkitAudioContext as typeof window.AudioContext;
      const context = new AudioContextClass({
        latencyHint: 'playback',
        sampleRate: audioQuality === 'lossless' ? 96000 : 48000,
      });
      
      // Create analyzer for waveform
      const analyserNode = context.createAnalyser();
      analyserNode.fftSize = 256;
      analyserNode.smoothingTimeConstant = 0.8;
      
      // Create EQ filters
      const bass = context.createBiquadFilter();
      bass.type = 'lowshelf';
      bass.frequency.value = 320;
      
      const mid = context.createBiquadFilter();
      mid.type = 'peaking';
      mid.frequency.value = 1000;
      mid.Q.value = 1;
      
      const treble = context.createBiquadFilter();
      treble.type = 'highshelf';
      treble.frequency.value = 3200;
      
      // Create gain node for volume
      const gain = context.createGain();
      gain.gain.value = isMuted ? 0 : volume;
      
      // Create source from audio element
      const source = context.createMediaElementSource(audioRef.current);
      sourceRef.current = source;
      
      // Connect: source -> bass -> mid -> treble -> gain -> analyser -> destination
      source
        .connect(bass)
        .connect(mid)
        .connect(treble)
        .connect(gain)
        .connect(analyserNode)
        .connect(context.destination);
      
      // Apply current EQ preset
      const preset = EQ_PRESETS[equalizerPreset as keyof typeof EQ_PRESETS];
      bass.gain.value = preset.bass;
      mid.gain.value = preset.mid;
      treble.gain.value = preset.treble;
      
      setAudioContext(context);
      setAnalyser(analyserNode);
      setGainNode(gain);
      setBassFilter(bass);
      setMidFilter(mid);
      setTrebleFilter(treble);
      setIsAudioContextInitialized(true);
      
      // Resume context if needed
      if (context.state === 'suspended') {
        context.resume();
      }
    } catch (error) {
      console.warn('Web Audio API not supported, falling back to standard audio', error);
    }
  };

  // Generate real-time waveform data
  useEffect(() => {
    if (!analyser || !canvasRef.current || !isPlaying) return;
    
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const animateWaveform = () => {
      if (!analyser || !ctx) return;
      
      analyser.getByteFrequencyData(dataArray);
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const barWidth = canvas.width / 64; // Show 64 bars
      let x = 0;
      
      for (let i = 0; i < 64; i++) {
        const value = dataArray[i] / 255; // Normalize to 0-1
        const barHeight = value * canvas.height * 0.8;
        const y = (canvas.height - barHeight) / 2;
        
        // Create gradient based on frequency
        const gradient = ctx.createLinearGradient(x, y, x + barWidth - 2, y + barHeight);
        gradient.addColorStop(0, '#e51f48');
        gradient.addColorStop(0.5, '#ff4d6d');
        gradient.addColorStop(1, '#ff758f');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x + 1, y, barWidth - 2, barHeight);
        
        x += barWidth;
      }
      
      animationRef.current = requestAnimationFrame(animateWaveform);
    };
    
    animateWaveform();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyser, isPlaying]);

  // Apply EQ changes
  useEffect(() => {
    if (!bassFilter || !midFilter || !trebleFilter) return;
    
    const preset = EQ_PRESETS[equalizerPreset as keyof typeof EQ_PRESETS];
    bassFilter.gain.setValueAtTime(preset.bass, audioContext?.currentTime || 0);
    midFilter.gain.setValueAtTime(preset.mid, audioContext?.currentTime || 0);
    trebleFilter.gain.setValueAtTime(preset.treble, audioContext?.currentTime || 0);
  }, [equalizerPreset, bassFilter, midFilter, trebleFilter, audioContext]);

  // Audio initialization with high quality settings
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      
      // Set high quality audio preferences
      audioRef.current.preload = 'auto';
      audioRef.current.crossOrigin = 'anonymous';
    }
    
    const audio = audioRef.current;

    const updateDuration = () => setDuration(audio.duration || 0);
    const updateTime = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => {
      if (onPlayPause) onPlayPause();
    };
    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => {
      setIsLoading(false);
      // Initialize audio context when audio can play
      if (!isAudioContextInitialized) {
        initAudioContext();
      }
    };

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
      
      // Clean up audio context
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close();
      }
    };
  }, []);

  // Audio playback logic with quality handling
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (track?.audioUrl && typeof track.audioUrl === "string") {
      const src = track.audioUrl.trim();
      if (src && audio.src !== src) {
        // Add quality parameter if supported by your backend
        let qualitySrc = src;
        if (src.includes('?')) {
          qualitySrc += `&quality=${audioQuality}`;
        } else {
          qualitySrc += `?quality=${audioQuality}`;
        }
        
        // Check and set MIME type for high quality
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
          if (canPlay === 'probably') {
            console.log(`High quality playback supported for ${guessedMime}`);
          }
        }

        audio.src = qualitySrc;
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

    // Update volume through gain node if available
    if (gainNode) {
      gainNode.gain.setValueAtTime(isMuted ? 0 : volume, audioContext?.currentTime || 0);
    } else {
      audio.volume = isMuted ? 0 : volume;
    }
    
    audio.playbackRate = playbackRate;
    audio.loop = isLooping;

    if (isPlaying) {
      // Resume audio context if suspended
      if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
      }
      
      audio.play().catch((err: Error) => {
        console.warn("Audio play() failed:", err);
        setIsLoading(false);
      });
    } else {
      audio.pause();
      // Suspend audio context to save resources
      if (audioContext && audioContext.state === 'running') {
        audioContext.suspend();
      }
    }
  }, [track?.audioUrl, isPlaying, volume, isMuted, playbackRate, isLooping, audioQuality, gainNode, audioContext, onPlayPause, initAudioContext, isAudioContextInitialized]);

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
    
    if (gainNode) {
      gainNode.gain.setValueAtTime(isMuted ? 0 : newVolume, audioContext?.currentTime || 0);
    } else {
      const audio = audioRef.current;
      if (audio && !isMuted) {
        audio.volume = newVolume;
      }
    }
    
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    setIsMuted((m) => {
      const next = !m;
      if (gainNode) {
        gainNode.gain.setValueAtTime(next ? 0 : volume, audioContext?.currentTime || 0);
      } else {
        const audio = audioRef.current;
        if (audio) audio.volume = next ? 0 : volume;
      }
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

  const qualityOptions = [
    { value: 'low', label: 'Low (128kbps)', bitrate: 128 },
    { value: 'medium', label: 'Medium (192kbps)', bitrate: 192 },
    { value: 'high', label: 'High (320kbps)', bitrate: 320 },
    { value: 'lossless', label: 'Lossless (FLAC)', bitrate: 1411 },
  ];

  return (
    <AnimatePresence>
      <motion.div
        className={`fixed left-0 right-0 z-50 ${
          isExpanded ? "h-[80vh]" : "h-28"
        } bg-gradient-to-br from-[#0a1f2e] via-[#0a2a3a] to-[#0a3747] border-t border-white/10 shadow-2xl backdrop-blur-xl ${
          className || ""
        }`}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 120 }}
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 0rem)' }}
      >
        {/* Glass morphism overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
        
        {/* Compact Player Header */}
        <div className="relative flex items-center justify-between px-4 py-2 border-b border-white/10 bg-black/20">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-2 h-2 bg-[#e51f48] rounded-full animate-pulse" />
              {isPlaying && (
                <motion.div
                  className="absolute -inset-1 bg-[#e51f48] rounded-full opacity-30"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </div>
            <span className="text-xs font-medium text-white/80 tracking-wider uppercase">Now Playing</span>
            {audioQuality === 'lossless' && (
              <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full border border-yellow-500/30">
                Lossless
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-full hover:bg-white/10 transition-all duration-300 touch-target group"
              aria-label={isExpanded ? "Minimize player" : "Expand player"}
            >
              {isExpanded ? (
                <ArrowsPointingInIcon className="w-4 h-4 text-white/60 group-hover:text-white transition-colors" />
              ) : (
                <ArrowsPointingOutIcon className="w-4 h-4 text-white/60 group-hover:text-white transition-colors" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 transition-all duration-300 touch-target group"
              aria-label="Close player"
            >
              <XMarkIcon className="w-4 h-4 text-white/60 group-hover:text-white transition-colors" />
            </button>
          </div>
        </div>

        {/* Compact Player Content */}
        <div
          className={`relative flex ${
            isExpanded ? "flex-col h-[calc(100%-3rem)] p-6" : "flex-row h-[calc(100%-3rem)] px-4 py-3"
          } overflow-y-auto`}
        >
          {/* Track Info with Glowing Effect */}
          <div className={`flex items-center ${isExpanded ? "mb-8" : "flex-1 min-w-0"}`}>
            <div className="relative flex-shrink-0 group">
              <div className={`absolute -inset-1 bg-gradient-to-r from-[#e51f48] to-[#ff4d6d] rounded-xl opacity-0 group-hover:opacity-30 blur-lg transition-opacity duration-500 ${
                isPlaying ? "opacity-40" : ""
              }`} />
              <Image
                src={track.imageUrl || "/default-cover.jpg"}
                alt={track.title || "Track cover"}
                width={isExpanded ? 140 : 56}
                height={isExpanded ? 140 : 56}
                className={`relative rounded-xl object-cover shadow-2xl transition-all duration-500 ${
                  isExpanded ? "w-36 h-36" : "w-14 h-14"
                } ${isPlaying ? "animate-[spin_10s_linear_infinite]" : ""}`}
              />
              {isLoading && (
                <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#e51f48] border-t-transparent" />
                </div>
              )}
            </div>

            <div className={`ml-4 ${isExpanded ? "flex-1" : "flex-1 min-w-0"}`}>
              <div className="flex items-center">
                <h3 className={`${isExpanded ? "text-2xl" : "text-base"} font-bold text-white truncate tracking-tight`}>
                  {track.title || "Unknown Title"}
                </h3>
              </div>
              <p className={`${isExpanded ? "text-base" : "text-sm"} text-gray-300/90 truncate`}>
                {track.artist || "Unknown Artist"}
              </p>
              {isExpanded && track.album && (
                <p className="text-sm text-gray-400 mt-1 flex items-center">
                  <ClockIcon className="w-4 h-4 mr-1" />
                  {track.album}
                </p>
              )}
            </div>
          </div>

          {/* Main Controls Area */}
          <div className={`${isExpanded ? "flex-1" : "flex-1 flex flex-col justify-center"}`}>
            {/* Waveform Visualization */}
            {isExpanded && (
              <div className="mb-6">
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={120}
                  className="w-full h-32 rounded-lg bg-black/20 backdrop-blur-sm"
                />
                <div className="flex justify-between mt-2 text-xs text-gray-400">
                  <span>Frequency Spectrum</span>
                  <span>{equalizerPreset.charAt(0).toUpperCase() + equalizerPreset.slice(1)} EQ</span>
                </div>
              </div>
            )}

            {/* Progress Bar with Time */}
            <div className={`relative ${isExpanded ? "mb-4" : "mb-2"}`}>
              <div
                className="relative h-2 bg-white/10 rounded-full overflow-hidden cursor-pointer group"
                onClick={handleSeek}
              >
                <div
                  ref={progressBarRef}
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#e51f48] via-[#ff4d6d] to-[#ff758f] rounded-full transition-all duration-100"
                  style={{ width: `${progressPercentage}%` }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  style={{ left: `calc(${progressPercentage}% - 8px)` }}
                />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-xs text-gray-400 font-mono">{formatTime(currentTime)}</span>
                <span className="text-xs text-gray-400 font-mono">{formatTime(duration)}</span>
              </div>
            </div>

            {/* Main Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleLoop}
                  className={`p-2 rounded-full transition-all duration-300 ${
                    isLooping 
                      ? "text-[#e51f48] bg-[#e51f48]/20" 
                      : "text-gray-400 hover:text-white hover:bg-white/10"
                  }`}
                  aria-label={isLooping ? "Disable loop" : "Enable loop"}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                    <path d="M21 3v5h-5" />
                  </svg>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { if (audioRef.current) audioRef.current.currentTime = Math.max(0, currentTime - 10); }}
                  className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-all duration-300"
                  aria-label="Rewind 10 seconds"
                >
                  <BackwardIcon className="w-5 h-5" />
                </motion.button>
              </div>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={onPlayPause}
                disabled={isLoading}
                className="relative p-4 bg-gradient-to-br from-[#e51f48] to-[#ff4d6d] rounded-full hover:shadow-2xl hover:shadow-[#e51f48]/50 transition-all duration-300 disabled:opacity-50 group"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                <div className="absolute inset-0 bg-white/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                {isPlaying ? (
                  <PauseIcon className="relative w-6 h-6 text-white" />
                ) : (
                  <PlayIcon className="relative w-6 h-6 text-white ml-0.5" />
                )}
              </motion.button>

              <div className="flex items-center space-x-3">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { if (audioRef.current) audioRef.current.currentTime = Math.min(duration, currentTime + 10); }}
                  className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-all duration-300"
                  aria-label="Forward 10 seconds"
                >
                  <ForwardIcon className="w-5 h-5" />
                </motion.button>

                <div className="relative group">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleMute}
                    className="p-2 text-gray-400 hover:text-white rounded-full transition-all duration-300"
                    aria-label={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted || volume === 0 ? (
                      <SpeakerXMarkIcon className="w-5 h-5" />
                    ) : (
                      <SpeakerWaveIcon className="w-5 h-5" />
                    )}
                  </motion.button>

                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block animate-fadeIn">
                    <div className="bg-[#0a1f2e] p-3 rounded-xl shadow-2xl border border-white/10">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={isMuted ? 0 : volume}
                        onChange={handleVolumeChange}
                        className="w-24 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg"
                        aria-label="Volume control"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Expanded View Additional Controls */}
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 grid grid-cols-4 gap-4"
              >
                <div className="bg-white/5 rounded-xl p-3 backdrop-blur-sm">
                  <h4 className="text-xs font-medium text-gray-400 mb-2">Playback Speed</h4>
                  <button
                    onClick={changePlaybackRate}
                    className="px-3 py-1.5 bg-[#e51f48]/20 text-[#e51f48] rounded-lg text-sm hover:bg-[#e51f48]/30 transition-all duration-300"
                  >
                    {playbackRate}x
                  </button>
                </div>

                <div className="bg-white/5 rounded-xl p-3 backdrop-blur-sm">
                  <h4 className="text-xs font-medium text-gray-400 mb-2">Equalizer</h4>
                  <select
                    value={equalizerPreset}
                    onChange={(e) => setEqualizerPreset(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#e51f48]/20 text-[#e51f48] rounded-lg text-sm hover:bg-[#e51f48]/30 transition-all duration-300 outline-none cursor-pointer"
                  >
                    {Object.keys(EQ_PRESETS).map((preset) => (
                      <option key={preset} value={preset} className="bg-[#0a1f2e]">
                        {preset.charAt(0).toUpperCase() + preset.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-white/5 rounded-xl p-3 backdrop-blur-sm relative">
                  <h4 className="text-xs font-medium text-gray-400 mb-2">Quality</h4>
                  <button
                    onClick={() => setShowQualityMenu(!showQualityMenu)}
                    className="w-full px-3 py-1.5 bg-[#e51f48]/20 text-[#e51f48] rounded-lg text-sm hover:bg-[#e51f48]/30 transition-all duration-300"
                  >
                    {qualityOptions.find(q => q.value === audioQuality)?.label.split(' ')[0]}
                  </button>
                  
                  {showQualityMenu && (
                    <div className="absolute bottom-full left-0 mb-2 w-full bg-[#0a1f2e] rounded-lg shadow-2xl border border-white/10 overflow-hidden">
                      {qualityOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setAudioQuality(option.value as "low" | "medium" | "high" | "lossless");
                            setShowQualityMenu(false);
                          }}
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-white/10 transition-colors ${
                            audioQuality === option.value ? 'text-[#e51f48] bg-[#e51f48]/10' : 'text-gray-300'
                          }`}
                        >
                          <div className="font-medium">{option.label}</div>
                          <div className="text-xs text-gray-500">{option.bitrate} kbps</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white/5 rounded-xl p-3 backdrop-blur-sm">
                  <h4 className="text-xs font-medium text-gray-400 mb-2">Audio Info</h4>
                  <div className="text-xs text-gray-300">
                    <div>Sample Rate: {audioQuality === 'lossless' ? '96' : '48'}kHz</div>
                    <div className="text-[#e51f48] mt-1">
                      {gainNode ? '🎚️ EQ Active' : '📻 Standard'}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}