// apps/player/src/app/components/AdvancedPlayer.tsx
// @ts-nocheck
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { 
  Play, Pause, SkipForward, SkipBack,
  Volume2, VolumeX, Heart, 
  ListMusic, Music, X,
  RotateCw, Minimize2, Maximize2,
  ShoppingCart, Lock, Sparkles,
  Volume1, Activity
} from 'lucide-react';
import { AudioVisualizer } from './AudioVisualizer';

interface Track {
  id: number;
  title: string;
  artist?: string;
  artistName?: string;
  album?: string;
  artCoverUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  url: string;
  accessType: 'FREE' | 'PREMIUM' | 'PAY_PER_VIEW';
  price?: number;
  currency?: string;
  isDRMProtected: boolean;
  encryptionKey?: string;
  maxDevices?: number;
}

interface AdvancedPlayerProps {
  track: Track;
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onClose: () => void;
  onQueue?: () => void;
  onPurchase?: () => void;
  userId?: number;
  purchaseId?: string;
  className?: string;
}

export const AdvancedPlayer: React.FC<AdvancedPlayerProps> = ({
  track,
  isPlaying,
  onPlayPause,
  onNext,
  onPrevious,
  onClose,
  onQueue,
  onPurchase,
  userId,
  purchaseId,
  className
}) => {
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [showVisualizer, setShowVisualizer] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [previewTimeLeft, setPreviewTimeLeft] = useState(30);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const previewTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Check if track requires purchase
  const requiresPurchase = track.accessType === 'PREMIUM' || track.accessType === 'PAY_PER_VIEW';
  const isPurchased = !!purchaseId;
  
  // Initialize audio with simple validation
  useEffect(() => {
    const initAudio = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Show preview mode for non-purchased premium tracks
        if (requiresPurchase && !isPurchased) {
          setIsPreviewMode(true);
        } else {
          setIsPreviewMode(false);
        }
        
        if (!audioRef.current) {
          audioRef.current = new Audio();
        }
        
        const audio = audioRef.current;
        audio.src = track.url;
        audio.volume = isMuted ? 0 : volume;
        audio.playbackRate = playbackRate;
        audio.loop = isLooping;
        
        const handleDurationChange = () => setDuration(audio.duration || 0);
        const handleTimeUpdate = () => {
          setCurrentTime(audio.currentTime);
          
          // Preview mode: stop at 30 seconds
          if (isPreviewMode && audio.currentTime >= 30) {
            audio.pause();
            if (onPlayPause) onPlayPause();
            setError('Preview ended. Purchase to continue listening.');
          }
        };
        const handleEnded = () => {
          if (isLooping) {
            audio.currentTime = 0;
            audio.play();
          } else {
            onPlayPause();
          }
        };
        const handleCanPlay = () => setIsLoading(false);
        const handleError = (e: Event) => {
          console.error('Audio error:', e);
          setError('Failed to play track. Please try again.');
          setIsLoading(false);
        };
        
        audio.addEventListener('durationchange', handleDurationChange);
        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('canplay', handleCanPlay);
        audio.addEventListener('error', handleError);
        
        return () => {
          audio.removeEventListener('durationchange', handleDurationChange);
          audio.removeEventListener('timeupdate', handleTimeUpdate);
          audio.removeEventListener('ended', handleEnded);
          audio.removeEventListener('canplay', handleCanPlay);
          audio.removeEventListener('error', handleError);
        };
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize player');
        setIsLoading(false);
      }
    };
    
    initAudio();
    
    return () => {
      if (previewTimerRef.current) {
        clearTimeout(previewTimerRef.current);
      }
    };
  }, [track.id, track.url, requiresPurchase, isPurchased, purchaseId, onPlayPause]);
  
  // Handle play/pause
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || isLoading) return;
    
    if (isPlaying) {
      audio.play().catch((err) => {
        console.error('Play failed:', err);
        setError('Failed to play. Please try again.');
      });
    } else {
      audio.pause();
    }
  }, [isPlaying, isLoading, track.id]);
  
  // Handle volume changes
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);
  
  // Handle playback rate
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.playbackRate = playbackRate;
    }
  }, [playbackRate]);
  
  // Handle loop
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.loop = isLooping;
    }
  }, [isLooping]);
  
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !progressBarRef.current) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };
  
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };
  
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };
  
  const toggleLoop = () => {
    setIsLooping(!isLooping);
  };
  
  const changePlaybackRate = () => {
    const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const currentIndex = rates.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % rates.length;
    setPlaybackRate(rates[nextIndex]);
  };
  
  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const notifyMinimized = (minimized: boolean) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('player:minimized', {
          detail: { minimized, title: track.title, artist: track.artist || track.artistName }
        })
      );
    }
  };
  
  // Animated waveform for minimized view
  const MinimizedWaveform = () => (
    <div className="flex items-center justify-center gap-[2px] h-8">
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="w-0.5 bg-gradient-to-t from-[#e51f48] to-[#ff4d6d] rounded-full"
          animate={{
            height: isPlaying ? [4, 12, 8, 16, 6] : 4,
          }}
          transition={{
            duration: 0.8,
            delay: i * 0.05,
            repeat: isPlaying ? Infinity : 0,
            repeatType: 'reverse',
          }}
        />
      ))}
    </div>
  );
  
  return (
    <AnimatePresence>
      {/* Minimized Floating Button */}
      {isMinimized && (
        <motion.button
          onClick={() => {
            setIsMinimized(false);
            notifyMinimized(false);
          }}
          className="fixed bottom-20 right-4 z-50 rounded-full shadow-2xl overflow-hidden focus:outline-none active:scale-95 transition-transform"
          initial={{ scale: 0, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="relative w-14 h-14 rounded-full overflow-hidden">
            <Image
              src={track.artCoverUrl || track.thumbnailUrl || '/default-cover.jpg'}
              alt={track.title}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <MinimizedWaveform />
            </div>
            {isPreviewMode && (
              <div className="absolute top-0 right-0 bg-amber-500 text-[8px] px-1 rounded-bl">
                PREVIEW
              </div>
            )}
          </div>
        </motion.button>
      )}
      
      {/* Main Player */}
      {!isMinimized && (
        <motion.div
          ref={containerRef}
          className={`fixed left-0 right-0 z-50 bg-gradient-to-br from-[#0a3747] via-[#0a2f3d] to-[#0a1f29] border-t border-white/10 shadow-2xl backdrop-blur-lg ${
            isExpanded ? 'h-[70vh] sm:h-[80vh]' : 'h-28 sm:h-24'
          } ${className || ''}`}
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 120 }}
          style={{ bottom: 0 }}
        >
          {/* Error Toast */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-0 left-0 right-0 bg-red-500/90 text-white text-center py-2 text-sm z-10 backdrop-blur-sm"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Preview Mode Banner */}
          {isPreviewMode && !error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-0 left-0 right-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-center py-1.5 text-xs z-10 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-3 h-3" />
              <span>30-Second Preview • {Math.floor(30 - currentTime)} seconds remaining</span>
              <button
                onClick={onPurchase}
                className="ml-2 px-2 py-0.5 bg-white/20 rounded text-xs hover:bg-white/30 transition-colors"
              >
                Unlock Full Track
              </button>
            </motion.div>
          )}
          
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Music className="w-4 h-4 text-[#e51f48]" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">
                  {track.title}
                  {isPreviewMode && (
                    <span className="ml-2 text-[10px] text-amber-400">(Preview)</span>
                  )}
                  {track.isDRMProtected && !isPreviewMode && (
                    <Lock className="inline-block w-3 h-3 ml-1 text-green-400" />
                  )}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {track.artist || track.artistName || 'Unknown Artist'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setIsMinimized(true);
                  notifyMinimized(true);
                }}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                {isExpanded ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Content */}
          <div className={`flex ${isExpanded ? 'flex-col' : 'flex-row'} h-[calc(100%-44px)] px-3 py-2 gap-3`}>
            {/* Album Art */}
            {!isExpanded && (
              <div className="relative flex-shrink-0">
                <div className="relative w-12 h-12 rounded-lg overflow-hidden shadow-lg">
                  <Image
                    src={track.artCoverUrl || track.thumbnailUrl || '/default-cover.jpg'}
                    alt={track.title}
                    fill
                    className="object-cover"
                  />
                  {isLoading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="animate-spin w-4 h-4 border-2 border-[#e51f48] border-t-transparent rounded-full" />
                    </div>
                  )}
                  {isPreviewMode && (
                    <div className="absolute top-0 right-0 bg-amber-500 text-[8px] px-1 rounded-bl">
                      PREVIEW
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Main Controls */}
            <div className="flex-1 flex flex-col justify-center">
              {/* Progress Bar */}
              <div 
                ref={progressBarRef}
                className="relative h-1 bg-white/10 rounded-full cursor-pointer group"
                onClick={handleSeek}
              >
                <div 
                  className="absolute h-full bg-gradient-to-r from-[#e51f48] to-[#ff4d6d] rounded-full transition-all duration-100"
                  style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                />
                <div 
                  className="absolute w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity -top-1"
                  style={{ left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`, transform: 'translateX(-50%)' }}
                />
              </div>
              
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
              
              {/* Control Buttons */}
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={toggleLoop}
                    className={`p-2 rounded-full transition-colors ${
                      isLooping ? 'text-[#e51f48] bg-white/10' : 'text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                  {onPrevious && (
                    <button
                      onClick={onPrevious}
                      className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                    >
                      <SkipBack className="w-5 h-5" />
                    </button>
                  )}
                </div>
                
                <button
                  onClick={onPlayPause}
                  disabled={isLoading}
                  className="p-3 bg-gradient-to-br from-[#e51f48] to-[#ff4d6d] rounded-full shadow-lg hover:shadow-[#e51f48]/30 transition-all disabled:opacity-50 active:scale-95"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 text-white" />
                  ) : (
                    <Play className="w-5 h-5 text-white ml-0.5" />
                  )}
                </button>
                
                <div className="flex items-center gap-1">
                  {onNext && (
                    <button
                      onClick={onNext}
                      className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                    >
                      <SkipForward className="w-5 h-5" />
                    </button>
                  )}
                  <div className="relative group">
                    <button
                      onClick={toggleMute}
                      className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX className="w-4 h-4" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </button>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-[#0a3747] p-2 rounded-lg shadow-lg">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={isMuted ? 0 : volume}
                        onChange={handleVolumeChange}
                        className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Expanded View */}
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center px-4 py-4 overflow-y-auto"
            >
              {/* Large Album Art */}
              <motion.div
                className="relative w-48 h-48 sm:w-64 sm:h-64 rounded-2xl overflow-hidden shadow-2xl mb-4"
                whileHover={{ scale: 1.02 }}
              >
                <Image
                  src={track.artCoverUrl || track.thumbnailUrl || '/default-cover.jpg'}
                  alt={track.title}
                  fill
                  className="object-cover"
                />
                {isPlaying && (
                  <motion.div
                    className="absolute inset-0 bg-black/30 flex items-center justify-center"
                    animate={{ opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Play className="w-8 h-8 text-white" />
                  </motion.div>
                )}
                {isPreviewMode && (
                  <div className="absolute top-2 right-2 bg-amber-500 text-xs px-2 py-1 rounded-full">
                    Preview
                  </div>
                )}
              </motion.div>
              
              {/* Track Info */}
              <div className="text-center mb-4">
                <h2 className="text-xl font-bold text-white mb-1">{track.title}</h2>
                <p className="text-gray-300">{track.artist || track.artistName}</p>
                {track.album && (
                  <p className="text-sm text-gray-400 mt-1">{track.album}</p>
                )}
                {requiresPurchase && !isPurchased && track.price && (
                  <div className="mt-2 inline-flex items-center gap-1 bg-amber-500/20 px-3 py-1 rounded-full">
                    <ShoppingCart className="w-3 h-3 text-amber-400" />
                    <span className="text-xs text-amber-400">
                      {track.price} {track.currency || 'USD'} to unlock
                    </span>
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-4 mb-6">
                <button
                  onClick={() => setIsLiked(!isLiked)}
                  className="flex flex-col items-center gap-1"
                >
                  {isLiked ? (
                    <Heart className="w-6 h-6 text-[#e51f48]" fill="currentColor" />
                  ) : (
                    <Heart className="w-6 h-6 text-gray-400" />
                  )}
                  <span className="text-xs text-gray-400">Like</span>
                </button>
                
                {onQueue && (
                  <button
                    onClick={onQueue}
                    className="flex flex-col items-center gap-1"
                  >
                    <ListMusic className="w-6 h-6 text-gray-400" />
                    <span className="text-xs text-gray-400">Queue</span>
                  </button>
                )}
                
                {requiresPurchase && !isPurchased && onPurchase && (
                  <button
                    onClick={onPurchase}
                    className="flex flex-col items-center gap-1"
                  >
                    <ShoppingCart className="w-6 h-6 text-amber-400" />
                    <span className="text-xs text-amber-400">Purchase</span>
                  </button>
                )}
                
                <button
                  onClick={changePlaybackRate}
                  className="flex flex-col items-center gap-1"
                >
                  <span className="text-lg font-semibold text-gray-400">{playbackRate}x</span>
                  <span className="text-xs text-gray-400">Speed</span>
                </button>
                
                <button
                  onClick={() => setShowVisualizer(!showVisualizer)}
                  className="flex flex-col items-center gap-1"
                >
                  <Activity className="w-6 h-6 text-gray-400" />
                  <span className="text-xs text-gray-400">Visualizer</span>
                </button>
              </div>
              
              {/* Audio Visualizer */}
              {showVisualizer && audioRef.current && (
                <div className="w-full max-w-md">
                  <AudioVisualizer
                    audioElement={audioRef.current}
                    isPlaying={isPlaying}
                    height={100}
                    barColor="#e51f48"
                  />
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};