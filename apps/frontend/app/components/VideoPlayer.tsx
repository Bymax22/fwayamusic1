'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, VolumeX, Maximize2, Play, Pause } from 'lucide-react';
import Image from 'next/image';

interface VideoPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  title?: string;
  artist?: string;
  coverUrl?: string | null;
  duration?: number;
}

export default function VideoPlayer({
  isOpen,
  onClose,
  videoUrl,
  title = 'Video',
  artist = 'Unknown',
  coverUrl,
  duration
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, [isOpen]);

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(err => {
          console.error('Failed to play video:', err);
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  const toggleFullscreen = async () => {
    if (!videoRef.current) return;
    
    try {
      if (!document.fullscreenElement) {
        await videoRef.current.requestFullscreen().catch(err => {
          console.error('Failed to enter fullscreen:', err);
        });
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Fullscreen toggle failed:', error);
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const videoDuration = videoRef.current?.duration || duration || 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl bg-black rounded-lg overflow-hidden"
          >
            {/* Video Container */}
            <div
              className="relative bg-black aspect-video"
              onMouseMove={handleMouseMove}
              onMouseLeave={() => {
                if (isPlaying) {
                  setShowControls(false);
                }
              }}
            >
              <video
                ref={videoRef}
                src={videoUrl}
                poster={coverUrl}
                className="w-full h-full object-contain bg-black"
                onTimeUpdate={handleTimeUpdate}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                playsInline
                preload="metadata"
                webkit-playsinline="true"
                controls
              />

              {/* Video Controls */}
              <motion.div
                animate={{ opacity: showControls ? 1 : 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-between pointer-events-none"
              >
                {/* Top Bar - Close Button */}
                <div className="flex justify-between items-start p-4 pointer-events-auto">
                  <div>
                    <h3 className="text-white font-semibold text-lg truncate max-w-xs">{title}</h3>
                    <p className="text-gray-300 text-sm">{artist}</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-full transition"
                  >
                    <X className="w-6 h-6 text-white" />
                  </button>
                </div>

                {/* Center Play Button (when paused) */}
                {!isPlaying && (
                  <div className="flex justify-center items-center pointer-events-auto">
                    <button
                      onClick={togglePlayPause}
                      className="p-4 bg-white/20 hover:bg-white/30 rounded-full transition backdrop-blur-sm"
                    >
                      <Play className="w-12 h-12 text-white fill-white" />
                    </button>
                  </div>
                )}

                {/* Bottom Controls */}
                <div className="space-y-3 pointer-events-auto">
                  {/* Progress Bar */}
                  <div className="px-4">
                    <input
                      type="range"
                      min="0"
                      max={videoDuration || 0}
                      value={currentTime}
                      onChange={handleSeek}
                      className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:h-2 transition-all"
                    />
                  </div>

                  {/* Time and Controls */}
                  <div className="flex items-center justify-between px-4 pb-4">
                    <div className="flex items-center gap-4">
                      {/* Play/Pause */}
                      <button
                        onClick={togglePlayPause}
                        className="p-2 hover:bg-white/10 rounded-full transition"
                      >
                        {isPlaying ? (
                          <Pause className="w-5 h-5 text-white" />
                        ) : (
                          <Play className="w-5 h-5 text-white fill-white" />
                        )}
                      </button>

                      {/* Volume Control */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={toggleMute}
                          className="p-2 hover:bg-white/10 rounded-full transition"
                        >
                          {isMuted ? (
                            <VolumeX className="w-5 h-5 text-white" />
                          ) : (
                            <Volume2 className="w-5 h-5 text-white" />
                          )}
                        </button>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={volume}
                          onChange={handleVolumeChange}
                          className="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                      </div>

                      {/* Time Display */}
                      <div className="text-sm text-white/80 ml-4 w-20 text-right">
                        {formatTime(currentTime)} / {formatTime(videoDuration)}
                      </div>
                    </div>

                    {/* Fullscreen */}
                    <button
                      onClick={toggleFullscreen}
                      className="p-2 hover:bg-white/10 rounded-full transition"
                    >
                      <Maximize2 className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Video Info */}
            <div className="bg-black p-4 border-t border-white/10">
              <h3 className="text-white font-semibold truncate">{title}</h3>
              <p className="text-gray-400 text-sm">{artist}</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
