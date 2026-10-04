"use client";
import Image from 'next/image';
import Link from 'next/link';
import { useState, useRef, useEffect, useMemo } from "react";
import type { FormEvent } from 'react';
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
  ChevronDownIcon,
  ChatBubbleLeftRightIcon,
  ShareIcon,
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
  lyrics?: string;
};

type RepeatMode = 'off' | 'repeat-all' | 'repeat-one';
type PlayerComment = { id: number; content: string; userName: string; createdAt: string };
type LyricLine = { text: string; time: number | null };

function parseLyrics(value: string): LyricLine[] {
  const lines = value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const timestamp = /\[(\d{1,2}):(\d{2}(?:\.\d{1,3})?)\]/g;
  const parsed = lines.flatMap<LyricLine>((line) => {
    const timestamps = Array.from(line.matchAll(timestamp));
    const text = line.replace(timestamp, '').trim();
    if (timestamps.length === 0) return [{ text: line, time: null }];
    return timestamps.map((match) => ({
      text,
      time: Number(match[1]) * 60 + Number(match[2]),
    }));
  });
  return parsed.length ? parsed : [{ text: 'No lyrics are available for this track.', time: null }];
}

const SPECTRUM_BARS = Array.from({ length: 48 }, (_, index) => ({
  id: index,
  height: 7 + Math.abs(Math.sin((index / 48) * Math.PI * 3)) * 20,
  duration: 0.8 + (index % 7) * 0.09,
  delay: (index % 9) * -0.13,
}));

function SpectrumVisualizer({ isPlaying, progress, className = '' }: { isPlaying: boolean; progress: number; className?: string }) {
  return (
    <div className={`mobile-spectrum absolute inset-0 flex items-center justify-center pointer-events-none ${className}`} aria-hidden="true">
      <div className="spectrum-bars flex items-end justify-center gap-[2px] opacity-80">
        {SPECTRUM_BARS.map((bar) => (
          <span
            key={bar.id}
            className={`spectrum-bar${isPlaying ? ' is-playing' : ''}`}
            style={{
              height: `${bar.height}px`,
              animationDuration: `${bar.duration}s`,
              animationDelay: `${bar.delay}s`,
            }}
          />
        ))}
      </div>
      {isPlaying && (
        <div className="spectrum-progress absolute bottom-0 left-0 h-0.5" style={{ width: `${Math.max(0, Math.min(1, progress)) * 100}%` }} />
      )}
      <style jsx>{`
        .spectrum-bar {
          display: block;
          width: 2px;
          min-height: 2px;
          transform: scaleY(0.35);
          transform-origin: bottom;
          border-radius: 2px 2px 0 0;
          background: linear-gradient(to top, #9333ea, #f472b6);
          opacity: 0.35;
        }
        .spectrum-bar.is-playing {
          animation: spectrum-pulse 1.2s ease-in-out infinite;
          opacity: 0.8;
        }
        .spectrum-progress {
          background: linear-gradient(to right, #a855f7, #f472b6, #9333ea);
          transition: width 250ms linear;
          box-shadow: 0 0 8px rgba(236, 72, 153, 0.65);
        }
        @keyframes spectrum-pulse {
          0%, 100% { transform: scaleY(0.3); opacity: 0.45; }
          25% { transform: scaleY(0.72); opacity: 0.65; }
          50% { transform: scaleY(1); opacity: 0.9; }
          75% { transform: scaleY(0.52); opacity: 0.6; }
        }
        @media (prefers-reduced-motion: reduce) {
          .spectrum-bar.is-playing { animation: none; transform: none; }
          .spectrum-progress { transition: none; }
        }
      `}</style>
    </div>
  );
}

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
  queue?: TrackType[];
  queueIndex?: number;
  onSelectTrack?: (trackId: string | number) => void;
  className?: string;
}

function ScrollingTitle({ title, isPlaying }: { title: string; isPlaying: boolean }) {
  const titleRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollDistance, setScrollDistance] = useState(0);

  useEffect(() => {
    const measureTitle = () => {
      if (!titleRef.current || !containerRef.current) return;
      const titleWidth = titleRef.current.getBoundingClientRect().width;
      setScrollDistance(titleWidth > containerRef.current.clientWidth ? titleWidth : 0);
    };

    measureTitle();
    const observer = new ResizeObserver(measureTitle);
    if (containerRef.current) observer.observe(containerRef.current);
    if (titleRef.current) observer.observe(titleRef.current);
    return () => observer.disconnect();
  }, [title]);

  const shouldScroll = scrollDistance > 0;

  return (
    <div ref={containerRef} className="w-full overflow-hidden">
      <motion.div
        animate={shouldScroll && isPlaying ? { x: -scrollDistance } : { x: 0 }}
        transition={{
          duration: shouldScroll ? scrollDistance / 40 : 0,
          repeat: shouldScroll && isPlaying ? Infinity : 0,
          repeatType: 'loop',
          ease: 'linear',
        }}
        className="flex w-max whitespace-nowrap"
      >
        <span ref={titleRef} className="pr-8 text-sm font-semibold text-white">
          {title}
        </span>
        <span aria-hidden="true" className="pr-8 text-sm font-semibold text-white">
          {title}
        </span>
      </motion.div>
    </div>
  );
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
  queue = [],
  queueIndex = -1,
  onSelectTrack,
  className,
}: MobilePlayerProps) {
  const [isShuffled, setIsShuffled] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState<number | null>(null);
  const [likeLoading, setLikeLoading] = useState(false);
  const [lyrics, setLyrics] = useState(track.lyrics || '');
  const [comments, setComments] = useState<PlayerComment[]>([]);
  const [commentDraft, setCommentDraft] = useState('');
  const [commentSending, setCommentSending] = useState(false);
  const { getToken } = useAuth();
  const isRepeatEnabled = repeatMode && repeatMode !== 'off';
  const isRepeatOne = repeatMode === 'repeat-one';
  const upcomingTracks = useMemo(
    () => queueIndex >= 0 ? queue.slice(queueIndex + 1) : queue.filter((queuedTrack) => String(queuedTrack.id) !== String(track.id)),
    [queue, queueIndex, track.id],
  );
  const lyricLines = useMemo(() => parseLyrics(lyrics), [lyrics]);
  const activeLyricIndex = useMemo(() => {
    const timedLines = lyricLines.filter((line) => line.time !== null);
    if (timedLines.length > 0) {
      let active = lyricLines.findIndex((line) => line.time !== null);
      lyricLines.forEach((line, index) => {
        if (line.time !== null && line.time <= currentTime) active = index;
      });
      return active;
    }
    if (!lyrics.trim() || duration <= 0) return 0;
    return Math.min(lyricLines.length - 1, Math.floor((currentTime / duration) * lyricLines.length));
  }, [currentTime, duration, lyricLines, lyrics]);

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

  useEffect(() => {
    setLyrics(track.lyrics || '');
    if (!isExpanded) return;

    const controller = new AbortController();
    const loadExpandedTrackData = async () => {
      try {
        const response = await fetch(`/api/media/${encodeURIComponent(String(track.id))}`, {
          cache: 'no-store',
          signal: controller.signal,
        });
        if (response.ok) {
          const payload = await response.json();
          const lyricsText = typeof payload.lyrics === 'string'
            ? payload.lyrics
            : typeof payload.description === 'string'
              ? payload.description
              : '';
          setLyrics(track.lyrics || lyricsText);
        } else {
          console.warn(`Could not load track lyrics (${response.status}).`);
        }
      } catch (error) {
        if (!controller.signal.aborted) console.warn('Could not load track lyrics:', error);
      }

      try {
        const response = await fetch(`/api/media/${encodeURIComponent(String(track.id))}/comments`, {
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!response.ok) {
          console.warn(`Could not load track comments (${response.status}).`);
          return;
        }
        const payload: unknown = await response.json();
        const items = Array.isArray(payload)
          ? payload
          : payload && typeof payload === 'object' && 'comments' in payload && Array.isArray(payload.comments)
            ? payload.comments
            : [];
        setComments(items.slice(0, 5).map((item: any, index: number) => ({
          id: Number(item.id) || index,
          content: String(item.content || item.text || ''),
          userName: String(item.userName || item.user?.displayName || item.user?.username || 'Fwaya listener'),
          createdAt: String(item.createdAt || item.timestamp || ''),
        })));
      } catch (error) {
        if (!controller.signal.aborted) console.warn('Could not load track comments:', error);
      }
    };

    void loadExpandedTrackData();
    return () => controller.abort();
  }, [isExpanded, track.id, track.lyrics]);

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

  const handlePostComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = commentDraft.trim();
    if (!content || commentSending) return;

    setCommentSending(true);
    try {
      const token = await getToken();
      if (!token) {
        window.location.assign('/auth/user/signin');
        return;
      }
      const response = await fetch(`/api/media/${encodeURIComponent(String(track.id))}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const message = payload && typeof payload === 'object' && 'message' in payload && typeof payload.message === 'string'
          ? payload.message
          : `Comment could not be posted (${response.status}).`;
        throw new Error(message);
      }
      setComments((previous) => [{
        id: Number(payload?.id) || Date.now(),
        content,
        userName: String(payload?.userName || payload?.user?.displayName || payload?.user?.username || 'You'),
        createdAt: String(payload?.createdAt || new Date().toISOString()),
      }, ...previous].slice(0, 5));
      setCommentDraft('');
    } catch (error) {
      console.error('Failed to post a player comment:', error);
      alert(error instanceof Error ? error.message : 'Could not post your comment.');
    } finally {
      setCommentSending(false);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/track/${track.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: track.title || 'Fwaya track', text: `Listen to ${track.title || 'this track'} on Fwaya`, url });
      } else {
        await navigator.clipboard.writeText(url);
        alert('Track link copied.');
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        console.error('Could not share track:', error);
      }
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <AnimatePresence>
      <motion.div
        className={`fixed left-0 right-0 bottom-16 z-40 bg-gradient-to-t from-black via-black/90 to-transparent ${className || ""}`}
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
            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full"
              aria-label="Expand player"
            >
              <Image
                src={track.imageUrl || "/default-cover.jpg"}
                alt={track.title || "Track cover"}
                width={40}
                height={40}
                className="block h-10 w-10 aspect-square rounded-full object-cover shadow-lg"
              />
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                  <div className="animate-spin rounded-full h-2 w-2 border-b-2 border-white"></div>
                </div>
              )}
              {isVideo && (
                <div className="absolute top-1 left-1 rounded-full bg-black/70 p-1">
                  <VideoCameraIcon className="w-3 h-3 text-white" />
                </div>
              )}
            </button>

            {/* Track Info with Scrolling Title */}
            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              className="flex-1 min-w-0 relative z-10 text-left"
              aria-label="Expand player"
            >
              <ScrollingTitle title={track.title || "Unknown Title"} isPlaying={isPlaying} />
              <p className="text-white/70 text-xs truncate">
                {isVideo ? 'Video • ' : ''}{track.artist || 'Unknown Artist'}
              </p>
            </button>

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

      {isExpanded && (
        <>
          <motion.button
            type="button"
            aria-label="Close expanded player"
            className="fixed inset-0 bottom-16 z-[59] bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsExpanded(false)}
          />
          <motion.section
            className="fixed inset-x-0 bottom-16 z-[60] flex h-[58dvh] min-h-[360px] max-h-[620px] flex-col overflow-hidden rounded-t-3xl bg-black shadow-2xl"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            aria-label="Expanded audio player"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="absolute inset-0 bg-black">
              <Image
                src={track.imageUrl || '/default-cover.jpg'}
                alt=""
                fill
                sizes="100vw"
                priority
                className="scale-105 object-cover opacity-75"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/45 to-black/95" />
              <div className="absolute inset-0 bg-gradient-to-tr from-[#5b0ea6]/45 via-transparent to-transparent" />
            </div>

            <div className="relative z-10 flex min-h-0 flex-1 flex-col px-4 pb-3 pt-2 text-white">
              <div className="flex items-center justify-center">
                <button
                  type="button"
                  className="rounded-full p-2 text-white/70 hover:text-white"
                  onClick={() => setIsExpanded(false)}
                  aria-label="Collapse player"
                >
                  <ChevronDownIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <Image
                  src={track.imageUrl || '/default-cover.jpg'}
                  alt={track.title || 'Track cover'}
                  width={52}
                  height={52}
                  className="h-[52px] w-[52px] rounded-xl object-cover shadow-lg"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold">{track.title || 'Unknown Title'}</p>
                  <p className="truncate text-sm text-white/65">{track.artist || 'Unknown Artist'}</p>
                </div>
                <button
                  type="button"
                  onClick={handleLike}
                  disabled={likeLoading}
                  className={`flex items-center gap-1 rounded-full bg-white/10 px-3 py-2 text-sm ${isLiked ? 'text-pink-400' : 'text-white/80'}`}
                  aria-label={isLiked ? 'Unlike track' : 'Like track'}
                >
                  {isLiked ? <HeartIcon className="h-5 w-5" /> : <HeartOutline className="h-5 w-5" />}
                  <span>{likesCount ?? track.likes ?? 0}</span>
                </button>
              </div>

              <div className="relative my-2 h-9 shrink-0 overflow-hidden rounded-lg bg-black/20">
                <SpectrumVisualizer
                  isPlaying={isPlaying}
                  progress={duration > 0 ? currentTime / duration : 0}
                  className="h-full"
                />
                <div className="absolute inset-x-2 bottom-0 z-10 h-1 cursor-pointer rounded-full bg-white/20" onClick={handleSeek}>
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-400 to-pink-400"
                    style={{ width: `${duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0}%` }}
                  />
                </div>
              </div>
              <div className="-mt-1 flex justify-between text-[10px] text-white/55">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>

              <div className="flex shrink-0 items-center justify-center gap-7 py-1">
                <button type="button" onClick={onPrevious} className="p-2 text-white/80" aria-label="Previous track">
                  <BackwardIcon className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={onPlayPause}
                  disabled={isLoading}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-black disabled:opacity-50"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <PauseIcon className="h-6 w-6" /> : <PlayIcon className="h-6 w-6" />}
                </button>
                <button type="button" onClick={onNext} className="p-2 text-white/80" aria-label="Next track">
                  <ForwardIcon className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent('fwaya:open-playlist-picker', {
                    detail: { mediaId: Number(track.id), track },
                  }))}
                  className="p-2 text-white/80"
                  aria-label="Add track to playlist"
                >
                  <QueueListIcon className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => void handleShare()}
                  className="p-2 text-white/80"
                  aria-label="Share track"
                >
                  <ShareIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain pt-2">
                <section>
                  <h2 className="mb-1 text-xs font-semibold uppercase tracking-widest text-purple-200">Lyrics</h2>
                  <div className="rounded-xl bg-[#5b0ea6] px-3 py-2">
                    <p className="min-h-5 text-sm font-semibold leading-5 text-white" aria-live="polite">
                      {lyricLines[activeLyricIndex]?.text || 'No lyrics are available for this track.'}
                    </p>
                  </div>
                </section>

                <section>
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-purple-200">
                    <QueueListIcon className="h-4 w-4" />
                    Up next
                  </div>
                  {upcomingTracks.length > 0 ? (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {upcomingTracks.map((queuedTrack) => (
                        <button
                          key={queuedTrack.id}
                          type="button"
                          onClick={() => onSelectTrack?.(queuedTrack.id)}
                          className="flex w-36 shrink-0 items-center gap-2 rounded-xl bg-white/10 p-2 text-left"
                        >
                          <Image
                            src={queuedTrack.imageUrl || '/default-cover.jpg'}
                            alt=""
                            width={36}
                            height={36}
                            className="h-9 w-9 rounded-lg object-cover"
                          />
                          <span className="min-w-0">
                            <span className="block truncate text-xs font-medium">{queuedTrack.title || 'Untitled'}</span>
                            <span className="block truncate text-[10px] text-white/55">{queuedTrack.artist || 'Unknown artist'}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-xl bg-black/25 px-3 py-2 text-xs text-white/50">No tracks are queued.</p>
                  )}
                </section>

                <section className="pb-1">
                  <h2 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-purple-200">
                    <ChatBubbleLeftRightIcon className="h-4 w-4" />
                    Comments
                  </h2>
                  {comments.length > 0 ? (
                    <div className="space-y-2">
                      {comments.map((comment) => (
                        <article key={comment.id} className="rounded-xl bg-[#5b0ea6]/70 px-3 py-2">
                          <p className="text-[11px] font-semibold text-white/80">{comment.userName}</p>
                          <p className="text-xs leading-5 text-white/65">{comment.content}</p>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-xl bg-[#5b0ea6]/70 px-3 py-2 text-xs text-white/70">No comments yet.</p>
                  )}
                  <Link href={`/track/${track.id}`} className="mt-2 inline-block text-xs font-semibold text-purple-200">
                    Open track discussion
                  </Link>
                  <form onSubmit={handlePostComment} className="mt-2 flex gap-2">
                    <input
                      value={commentDraft}
                      onChange={(event) => setCommentDraft(event.target.value)}
                      maxLength={1000}
                      placeholder="Add a comment..."
                      aria-label="Add a comment"
                      className="min-w-0 flex-1 rounded-xl bg-[#5b0ea6] px-3 py-2 text-xs text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
                    />
                    <button
                      type="submit"
                      disabled={commentSending || !commentDraft.trim()}
                      className="rounded-xl bg-black px-3 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      {commentSending ? 'Sending' : 'Post'}
                    </button>
                  </form>
                </section>
              </div>
            </div>
          </motion.section>
        </>
      )}
    </AnimatePresence>
  );
}

// Subscribe to realtime updates for this component's lifecycle
// (Note: subscription to updates for current track is handled via effect below)
