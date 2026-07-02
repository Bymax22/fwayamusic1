'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, VolumeX, Maximize2, Play, Pause, Minimize2 } from 'lucide-react';

interface VideoPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  title?: string;
  artist?: string;
  coverUrl?: string | null;
  duration?: number;
  relatedVideos?: Array<any>;
  onSelectVideo?: (video: any) => void;
}

export default function VideoPlayer({
  isOpen,
  onClose,
  videoUrl,
  title = 'Video',
  artist = 'Unknown',
  coverUrl,
  duration,
  relatedVideos = [],
  onSelectVideo,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(duration || 0);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const controlsTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkViewport = () => setIsMobile(window.innerWidth < 768);
    checkViewport();
    window.addEventListener('resize', checkViewport);

    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current !== null) {
        window.clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setIsPlaying(false);
      setCurrentTime(0);
      setVideoDuration(duration || 0);
      setIsMinimized(false);
      setShowControls(true);
      return;
    }

    setIsMinimized(false);
    setShowControls(true);
    const video = videoRef.current;

    if (!video) return;

    video.load();
    video.currentTime = 0;
    setCurrentTime(0);
    setVideoDuration(duration || 0);

    const playVideo = async () => {
      try {
        await video.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('Failed to autoplay video:', error);
        setIsPlaying(false);
      }
    };

    void playVideo();
  }, [isOpen, videoUrl, duration]);

  const togglePlayPause = async () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
      return;
    }

    try {
      await videoRef.current.play();
      setIsPlaying(true);
    } catch (error) {
      console.error('Failed to play video:', error);
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
      if (Number.isFinite(videoRef.current.duration)) {
        setVideoDuration(videoRef.current.duration);
      }
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
        await videoRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Fullscreen toggle failed:', error);
    }
  };

  const showControlsTemporarily = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current !== null) {
      window.clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = window.setTimeout(() => {
      setShowControls(false);
    }, 2500);
  };

  const handleMouseMove = () => {
    if (isPlaying || isMobile) {
      showControlsTemporarily();
    } else {
      setShowControls(true);
    }
  };

  const handleMouseLeave = () => {
    if (isPlaying) {
      setShowControls(false);
    } else {
      setShowControls(true);
    }
  };

  const handleMediaTap = async (event?: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    event?.stopPropagation();

    if (isMinimized && isMobile) {
      await togglePlayPause();
      return;
    }

    if (showControls) {
      setShowControls(false);
    } else {
      showControlsTemporarily();
    }

    await togglePlayPause();
  };

  const formatTime = (seconds: number) => {
    if (Number.isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const visibleRelatedVideos = relatedVideos.filter((video: any) => video?.url && video.url !== videoUrl).slice(0, 6);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={isMinimized && isMobile ? 'fixed bottom-4 right-4 z-[70] w-[180px] sm:w-[220px]' : 'fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-2 sm:p-4'}
          onClick={isMinimized && isMobile ? undefined : onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className={isMinimized && isMobile ? 'w-full overflow-hidden rounded-[20px] bg-black/90 shadow-2xl backdrop-blur' : 'w-full max-w-5xl overflow-hidden rounded-[24px] bg-[#050509]/95 shadow-2xl'}
          >
            <div
              className="relative bg-black"
              style={{ touchAction: 'manipulation' }}
              onClick={handleMediaTap}
              onTouchStart={handleMediaTap}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <video
                ref={videoRef}
                src={videoUrl}
                poster={coverUrl ?? undefined}
                className={isMinimized && isMobile ? 'aspect-video w-full object-cover' : 'aspect-video w-full object-contain bg-black'}
                onTouchEnd={handleMediaTap}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleTimeUpdate}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
                autoPlay
                muted={isMuted}
                playsInline
                preload="metadata"
                webkit-playsinline="true"
              />

              <div className={`absolute inset-0 pointer-events-none ${isMinimized && isMobile ? 'bg-gradient-to-t from-black/80 via-black/20 to-transparent' : 'bg-gradient-to-t from-black/90 via-black/20 to-transparent'}`} />

              <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3 sm:p-4" onClick={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()} onTouchEnd={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{title}</p>
                  <p className="truncate text-xs text-white/70">{artist}</p>
                </div>
                <div className="flex items-center gap-2">
                  {isMobile && !isMinimized && (
                    <button
                      onClick={() => setIsMinimized(true)}
                      className="rounded-full bg-black/40 p-2 text-white transition hover:bg-white/10"
                    >
                      <Minimize2 className="h-4 w-4" />
                    </button>
                  )}
                  {isMobile && isMinimized && (
                    <button
                      onClick={() => setIsMinimized(false)}
                      className="rounded-full bg-black/40 p-2 text-white transition hover:bg-white/10"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="rounded-full bg-black/40 p-2 text-white transition hover:bg-white/10"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {!isMinimized && (
                <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4" onClick={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()} onTouchEnd={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
                  <motion.div
                    animate={{ opacity: showControls ? 1 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-[18px] border border-white/10 bg-black/40 p-3 backdrop-blur"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={togglePlayPause}
                          className="rounded-full bg-white/15 p-2 text-white transition hover:bg-white/25"
                        >
                          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-white" />}
                        </button>
                        <div>
                          <p className="text-sm font-semibold text-white">{title}</p>
                          <p className="text-xs text-white/70">{artist}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={toggleMute} className="rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20">
                          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                        </button>
                        <button onClick={toggleFullscreen} className="rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20">
                          <Maximize2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <input
                      type="range"
                      min="0"
                      max={videoDuration || 0}
                      value={currentTime}
                      onChange={handleSeek}
                      className="mb-2 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-purple-500"
                    />

                    <div className="flex items-center justify-between text-[11px] text-white/70">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(videoDuration)}</span>
                    </div>
                  </motion.div>
                </div>
              )}

              {isMinimized && isMobile && (
                <div className="absolute inset-0 flex items-center justify-center" onClick={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()} onTouchEnd={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => { e.stopPropagation(); void togglePlayPause(); }}
                    className="rounded-full bg-white/15 p-3 text-white shadow-lg backdrop-blur"
                  >
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 fill-white" />}
                  </button>
                </div>
              )}
            </div>

            {!isMinimized && (
              <div className="bg-[#050509] p-3 sm:p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">Related videos</p>
                    <p className="text-xs text-gray-400">Swipe or scroll to explore more</p>
                  </div>
                </div>
                {visibleRelatedVideos.length > 0 ? (
                  <div className="grid max-h-56 gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
                    {visibleRelatedVideos.map((video: any, index: number) => (
                      <button
                        key={video.id || `${video.url}-${index}`}
                        onClick={() => onSelectVideo?.(video)}
                        className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-2 text-left transition hover:bg-white/[0.06]"
                      >
                        <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                          {video.artCoverUrl || video.thumbnailUrl ? (
                            <img src={video.artCoverUrl || video.thumbnailUrl} alt={video.title} className="h-full w-full object-cover" />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-white">{video.title}</p>
                          <p className="truncate text-xs text-gray-400">
                            {video.user?.displayName || video.user?.username || 'Unknown artist'}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No related videos available right now.</p>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
