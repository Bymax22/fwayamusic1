"use client";
import Image from 'next/image';
import { useState, useRef, useEffect, useMemo } from "react";
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
  VideoCameraIcon,
} from "@heroicons/react/24/solid";
import { HeartIcon as HeartOutline } from "@heroicons/react/24/outline";
import { useAuth } from '@/context/AuthContext';
import { subscribe } from '@/lib/realtime';
import { isVideoUrl, isAudioUrl } from '@/lib/utils';

type TrackType = {
  id: string | number;
  title?: string;
  artist?: string;
  album?: string;
  imageUrl?: string;
  audioUrl?: string;
  videoUrl?: string;
  url?: string;
  duration?: number;
  type?: 'AUDIO' | 'VIDEO' | 'PODCAST' | 'LIVE_STREAM';
  accessType?: 'FREE' | 'PREMIUM' | 'PAY_PER_VIEW';
  price?: number;
  currency?: string;
  liked?: boolean;
  likes?: number;
};

type RepeatMode = 'off' | 'repeat-all' | 'repeat-one';

interface MobilePlayerProps {
  track: TrackType;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isLoading: boolean;
  onPlayPause: () => void;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onRepeat?: () => void;
  repeatMode?: RepeatMode;
  onSeek?: (time: number) => void;
  onVolumeChange?: (volume: number) => void;
  onToggleMute?: () => void;
  className?: string;
}

export default function MobilePlayer({
  track,
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  isLoading,
  onPlayPause,
  onClose,
  onNext,
  onPrevious,
  onRepeat,
  repeatMode,
  onSeek,
  onVolumeChange,
  onToggleMute,
  className,
}: MobilePlayerProps) {
  const [isShuffled, setIsShuffled] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState<number | null>(null);
  const [likeLoading, setLikeLoading] = useState(false);
  const { getToken } = useAuth();
  const isRepeatEnabled = repeatMode && repeatMode !== 'off';
  const isRepeatOne = repeatMode === 'repeat-one';

  // Realtime: update like state when other clients like/unlike the same media
  useEffect(() => {
    let unsub: (() => void) | undefined;
    let broadcastChannel: BroadcastChannel | null = null;

    const handleLikePayload = (payload: any) => {
      try {
        if (!track?.id) return;
        const targetId = Number(payload?.mediaId ?? payload?.id ?? payload?.trackId ?? 0);
        if (targetId !== Number(track.id)) return;

        if (typeof payload?.liked === 'boolean') {
          setIsLiked(Boolean(payload.liked));
        }
        if (typeof payload?.likes === 'number') {
          setLikesCount(payload.likes);
        }
      } catch (err) {
        console.error('MobilePlayer realtime handler error', err);
      }
    };

    const onBroadcastMessage = (event: MessageEvent) => {
      handleLikePayload(event.data);
    };

    const onStorageMessage = (event: StorageEvent) => {
      if (event.key !== 'fwaya:message' || !event.newValue) return;
      try {
        const payload = JSON.parse(event.newValue);
        if (payload?.type === 'media-liked') {
          handleLikePayload(payload);
        }
      } catch {
        // ignore invalid payload
      }
    };

    const setup = async () => {
      unsub = await subscribe('media:liked', handleLikePayload);

      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        broadcastChannel = new BroadcastChannel('fwaya');
        broadcastChannel.addEventListener('message', onBroadcastMessage);
      }

      if (typeof window !== 'undefined') {
        window.addEventListener('storage', onStorageMessage);
      }
    };

    void setup();
    return () => {
      if (unsub) unsub();
      if (broadcastChannel) {
        broadcastChannel.removeEventListener('message', onBroadcastMessage);
        broadcastChannel.close();
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', onStorageMessage);
      }
    };
  }, [track?.id]);

  useEffect(() => {
    if (track?.liked !== undefined) {
      setIsLiked(Boolean(track.liked));
    }
    if (typeof track?.likes === 'number') {
      setLikesCount(track.likes);
    }
  }, [track?.id, track?.liked, track?.likes]);

  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const isVideo = isVideoUrl(track.videoUrl || track.url || track.audioUrl);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !onSeek) return;

    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;

    onSeek(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    if (onVolumeChange) {
      onVolumeChange(newVolume);
    }
  };

  const toggleMute = () => {
    if (onToggleMute) {
      onToggleMute();
    }
  };

  const handleLike = async () => {
    if (!track?.id || likeLoading) return;

    const nextLiked = !isLiked;
    const optimisticLikes = likesCount == null ? 0 : Math.max(0, likesCount + (nextLiked ? 1 : -1));
    setLikeLoading(true);
    setIsLiked(nextLiked);
    setLikesCount(optimisticLikes);

    try {
      const token = await getToken();
      if (!token) throw new Error('Authentication required');

      const response = await fetch(`/api/media/${track.id}/interact/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error('Like request failed');
      }

      const data = await response.json().catch(() => null);
      const nextCount = typeof data?.likes === 'number' ? data.likes : optimisticLikes;
      setLikesCount(nextCount);

      try {
        if (typeof window !== 'undefined') {
          if ('BroadcastChannel' in window) {
            const bc = new BroadcastChannel('fwaya');
            bc.postMessage({ type: 'media-liked', mediaId: Number(track.id), liked: nextLiked, likes: nextCount });
            bc.close();
          }
          localStorage.setItem('fwaya:message', JSON.stringify({ type: 'media-liked', mediaId: Number(track.id), liked: nextLiked, likes: nextCount, t: Date.now() }));
        }
      } catch (_) {}
    } catch (err) {
      console.error('MobilePlayer: like failed', err);
      setIsLiked(!nextLiked);
      setLikesCount(likesCount ?? 0);
    } finally {
      setLikeLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Spectrum Visualizer Component - Stable Music Visualizer
  const SpectrumVisualizer = useMemo(() => {
    return ({ isPlaying = false, progress = 0, className = "" }: { isPlaying: boolean; progress: number; className: string }) => {
      // Create stable frequency bars that don't change on re-render
      const bars = useMemo(() => {
        return Array.from({ length: 60 }, (_, i) => {
          const frequency = i / 60;
          // Stable height based on frequency pattern (no randomness)
          const baseHeight = Math.abs(Math.sin(frequency * Math.PI * 3)) * 16 + 6;
          
          return {
            id: i,
            baseHeight,
            frequency,
            colorIndex: Math.floor(frequency * 3),
          };
        });
      }, []);

      const getBarColor = (colorIndex: number) => {
        const colors = [
          "from-purple-500 to-purple-300",
          "from-purple-400 to-pink-400",
          "from-pink-400 to-pink-300"
        ];
        return colors[colorIndex] || colors[0];
      };

      return (
        <div className={`absolute inset-0 flex items-center justify-center pointer-events-none ${className}`}>
          <div className="flex items-end gap-0.5 justify-center opacity-80">
            {bars.map((bar) => {
              const progressIndex = progress * 60;
              const distanceFromProgress = Math.abs(bar.id - progressIndex);
              const isActive = distanceFromProgress < 2;
              const isNearActive = distanceFromProgress < 5;

              const heightMultiplier = isActive ? 1.4 : isNearActive ? 1.1 : 0.7;
              const targetHeight = bar.baseHeight * heightMultiplier;

              return (
                <motion.div
                  key={bar.id}
                  className={`rounded-t-sm bg-gradient-to-t ${getBarColor(bar.colorIndex)}`}
                  style={{
                    width: '2px',
                    minHeight: '2px',
                    boxShadow: isActive ? `0 0 8px rgba(147, 51, 234, 0.8), 0 0 16px rgba(236, 72, 153, 0.6)` : 'none',
                  }}
                  animate={{
                    height: isPlaying ? targetHeight : bar.baseHeight * 0.4,
                  }}
                  transition={{
                    duration: 0.2,
                    ease: "easeOut",
                  }}
                />
              );
            })}
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
  }, []);

  // Scrolling Title Component - Auto-scroll for long titles
  const ScrollingTitle = ({ title, isPlaying }: { title: string; isPlaying: boolean }) => {
    const titleRef = useRef<HTMLSpanElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [shouldScroll, setShouldScroll] = useState(false);
    const [scrollDistance, setScrollDistance] = useState(0);

    useEffect(() => {
      if (!titleRef.current || !containerRef.current) return;

      const textWidth = titleRef.current.offsetWidth;
      const containerWidth = containerRef.current.offsetWidth;
      
      if (textWidth > containerWidth) {
        setShouldScroll(true);
        // Add padding for smooth loop
        setScrollDistance(-(textWidth + 20));
      } else {
        setShouldScroll(false);
      }
    }, [title]);

    return (
      <div ref={containerRef} className="overflow-hidden w-full">
        <motion.div
          animate={shouldScroll && isPlaying ? {
            x: [0, scrollDistance, scrollDistance],
          } : {
            x: 0,
          }}
          transition={{
            duration: shouldScroll ? (Math.abs(scrollDistance) / 100 + 3) : 0,
            repeat: shouldScroll && isPlaying ? Infinity : 0,
            repeatDelay: 1,
            ease: "linear",
          }}
          className="whitespace-nowrap"
        >
          <span ref={titleRef} className="text-white font-semibold text-sm pr-8">
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
              {isVideo && (
                <div className="absolute top-1 left-1 rounded-full bg-black/70 p-1">
                  <VideoCameraIcon className="w-3 h-3 text-white" />
                </div>
              )}
            </div>

            {/* Track Info with Scrolling Title */}
            <div className="flex-1 min-w-0 relative z-10">
              <ScrollingTitle title={track.title || "Unknown Title"} isPlaying={isPlaying} />
              <p className="text-white/70 text-xs truncate">
                {isVideo ? 'Video • ' : ''}{track.artist || 'Unknown Artist'}
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1 relative z-10">
                <button
                  onClick={handleLike}
                  disabled={likeLoading}
                  className="p-1 rounded-full hover:bg-white/10 transition-colors disabled:opacity-60"
                  aria-label="Like track"
                >
                  {isLiked ? (
                    <HeartIcon className="w-4 h-4 text-pink-400" />
                  ) : (
                    <HeartOutline className="w-4 h-4 text-white/70" />
                  )}
                </button>

              <button
                onClick={() => onSeek && onSeek(Math.max(0, currentTime - 10))}
                disabled={!onSeek}
                className="p-1.5 rounded-full hover:bg-white/10 transition-colors disabled:opacity-30"
                aria-label="Rewind 10 seconds"
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
                onClick={() => onSeek && onSeek(Math.min(duration, currentTime + 10))}
                disabled={!onSeek}
                className="p-1.5 rounded-full hover:bg-white/10 transition-colors disabled:opacity-30"
                aria-label="Forward 10 seconds"
              >
                <ForwardIcon className="w-4 h-4 text-white" />
              </button>

              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('fwaya:open-playlist-picker', {
                      detail: { mediaId: Number(track.id), track }
                    }));
                  }
                }}
                className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Add to playlist"
                title="Add to playlist"
              >
                <QueueListIcon className="w-4 h-4 text-white" />
              </button>

              <button
                onClick={() => {
                  if (onRepeat) onRepeat();
                }}
                className={`p-1 rounded-full hover:bg-white/10 transition-colors ${isRepeatEnabled ? 'text-purple-400' : 'text-white/70'}`}
                aria-label={isRepeatEnabled ? (isRepeatOne ? 'Repeat one' : 'Repeat all') : 'Repeat off'}
                title={isRepeatEnabled ? (isRepeatOne ? 'Repeat one' : 'Repeat all') : 'Repeat off'}
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

// Subscribe to realtime updates for this component's lifecycle
// (Note: subscription to updates for current track is handled via effect below)
