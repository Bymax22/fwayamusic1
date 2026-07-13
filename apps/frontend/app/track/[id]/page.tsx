'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaPlay,
  FaPause,
  FaHeart,
  FaRegHeart,
  FaShare,
  FaDownload,
  FaCrown,
  FaArrowLeft,
  FaComment,
  FaReply,
  FaEllipsisV,
  FaUser,
  FaMusic,
  FaClock,
  FaFire,
  FaStar,
  FaEye,
  FaCheckCircle
} from 'react-icons/fa';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import ShareModal from '@/components/ShareModal';
import { useAuth } from '@/context/AuthContext';
import { createMediaSlug, extractMediaIdFromSlug, formatDuration } from '@/lib/utils';

interface Comment {
  id: number;
  userId: number;
  userName: string;
  userAvatar: string;
  content: string;
  timestamp: string;
  likes: number;
  isVerified?: boolean;
  replies?: Comment[];
}

interface MediaItem {
  id: number;
  title: string;
  artist: string;
  artistId: number;
  url: string;
  duration: number;
  coverArt: string;
  views: number;
  likes: number;
  downloads: number;
  shares: number;
  genre?: string;
  accessType: 'FREE' | 'PREMIUM' | 'PAY_PER_VIEW';
  price?: number;
  currency?: string;
  isExplicit: boolean;
  createdAt: string;
  description?: string;
  lyrics?: string;
  tags: string[];
  isDRMProtected?: boolean;
  user?: {
    id: number;
    username?: string;
    displayName?: string;
    avatarUrl?: string;
    isVerified?: boolean;
  };
}

export default function TrackPage() {
  const params = useParams();
  const router = useRouter();
  const { currentTrack, isPlaying, playTrack, togglePlay } = useAudioPlayer();
  const trackSlug = Array.isArray(params.id) ? params.id[0] : params.id;
  const trackId = extractMediaIdFromSlug(trackSlug);
  const [track, setTrack] = useState<MediaItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const { getToken } = useAuth();
  const [showComments, setShowComments] = useState(true);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [showLyrics, setShowLyrics] = useState(false);
  const [showDetails, setShowDetails] = useState(true);
  const [relatedTracks, setRelatedTracks] = useState<MediaItem[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    const fetchTrack = async () => {
      if (!trackId) {
        setError('Invalid track identifier');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/media/${trackId}`);
        if (!response.ok) {
          throw new Error('Track not found');
        }
        const data = await response.json();
        setTrack(data);

        // Fetch comments
        const commentsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/media/${trackId}/comments`);
        if (commentsRes.ok) {
          const commentsData = await commentsRes.json();
          setComments(commentsData);
        }

        // Fetch related tracks (same genre or artist)
        const relatedRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/media?genre=${data.genre}&limit=5`);
        if (relatedRes.ok) {
          const relatedData = await relatedRes.json();
          setRelatedTracks(relatedData.filter((t: MediaItem) => trackId === undefined ? true : t.id !== trackId).slice(0, 4));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load track');
      } finally {
        setLoading(false);
      }
    };

    if (trackId) {
      fetchTrack();
    }
  }, [trackId]);

  // Realtime updates for like counts/state
  useEffect(() => {
    let unsub: (() => void) | undefined;
    const setup = async () => {
      try {
        const { subscribe } = await import('@/lib/realtime');
        unsub = await subscribe('media:liked', (payload: any) => {
          if (!track) return;
          if (Number(payload?.mediaId) === Number(track.id)) {
            if (typeof payload.likes === 'number') {
              setTrack((prev) => prev ? { ...prev, likes: payload.likes } : prev);
            }
            if (typeof payload.liked === 'boolean') {
              // If payload.userId matches current user, ignore (local update handled elsewhere)
              setIsLiked(Boolean(payload.liked));
            }
          }
        });
      } catch (err) {
        // ignore
      }
    };
    void setup();
    return () => {
      if (unsub) unsub();
    };
  }, [track]);

  const handlePlayTrack = async () => {
    if (!track) return;
    
    if (currentTrack?.id === track.id) {
      togglePlay();
      return;
    }

    playTrack({
      id: track.id,
      title: track.title,
      artist: track.artist,
      imageUrl: track.coverArt,
      audioUrl: track.url
    });

    const token = await getToken();
    if (!token) return;

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/media/${track.id}/interact/play`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (err) {
      console.warn('Unable to record play event', err);
    }
  };

  const handleLike = async () => {
    if (!track) return;

    const token = await getToken();
    if (!token) {
      alert('Please sign in to like tracks.');
      return;
    }

    const nextLikedState = !isLiked;
    setIsLiked(nextLikedState);
    setTrack((prev) =>
      prev
        ? {
            ...prev,
            likes: prev.likes + (nextLikedState ? 1 : -1),
          }
        : prev,
    );

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/media/${track.id}/interact/like`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Like request failed');
      }
    } catch (err) {
      setIsLiked((prev) => !prev);
      setTrack((prev) =>
        prev
          ? {
              ...prev,
              likes: prev.likes + (isLiked ? 1 : -1),
            }
          : prev,
      );
      console.error('Failed to like track', err);
    }
  };

  const handleDownload = async () => {
    if (!track) return;

    if (track.accessType === 'PREMIUM' || track.accessType === 'PAY_PER_VIEW') {
      alert('This track requires premium access to download.');
      return;
    }

    const token = await getToken();
    if (!token) {
      alert('Please sign in to download tracks.');
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/media/${track.id}/interact/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ deviceId: 'web' }),
      });

      if (!response.ok) {
        throw new Error('Download request failed');
      }

      const downloadUrl = track.url;
      const anchor = document.createElement('a');
      anchor.href = downloadUrl;
      anchor.download = `${track.title}.mp3`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    } catch (err) {
      console.error('Failed to record download', err);
      alert('Download failed. Please try again.');
    }
  };

  const getTrackShareUrl = () => track ? `${window.location.origin}/track/${createMediaSlug(track.title, track.id)}` : '';

  const shareUrl = track ? getTrackShareUrl() : '';
  const shareText = track ? `Listen to ${track.title} by ${track.artist} on Fwaya.\n${shareUrl}` : undefined;
  const coverUrl = track ? track.coverArt || (track as any).artCoverUrl || (track as any).thumbnailUrl || (track as any).coverUrl || '/default-cover.jpg' : '/default-cover.jpg';

  const handleShare = () => {
    setShowShareModal(true);
  };

  const handlePostComment = async () => {
    if (!newComment.trim() || !track) return;

    const token = await getToken();
    if (!token) {
      alert('Please sign in to post comments.');
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/media/${track.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newComment }),
      });

      if (!response.ok) {
        throw new Error('Failed to post comment');
      }

      const savedComment = await response.json();
      setComments((prev) => [savedComment, ...prev]);
      setNewComment('');
    } catch (err) {
      console.error('Failed to post comment', err);
      alert('Unable to post comment. Please try again.');
    }
  };

  const handleReply = async (commentId: number) => {
    if (!replyText.trim() || !track) return;

    const token = await getToken();
    if (!token) {
      alert('Please sign in to reply to comments.');
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/media/${track.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: replyText, parentId: commentId }),
      });

      if (!response.ok) {
        throw new Error('Failed to post reply');
      }

      const savedReply = await response.json();
      setComments((prev) =>
        prev.map((comment) =>
          comment.id === commentId
            ? {
                ...comment,
                replies: [...(comment.replies || []), savedReply],
              }
            : comment,
        ),
      );
      setReplyText('');
      setReplyingTo(null);
    } catch (err) {
      console.error('Failed to post reply', err);
      alert('Unable to reply. Please try again.');
    }
  };

    const artistDisplay = track?.user?.displayName || track?.artist || 'Unknown Artist';
    const coverArtUrl = track?.coverArt || (track as any)?.artCoverUrl || (track as any)?.thumbnailUrl || (track as any)?.coverUrl || '/default-cover.jpg';
  const viewCount = typeof track?.views === 'number' ? track.views : 0;
  const likeCount = typeof track?.likes === 'number' ? track.likes : 0;
  const downloadCount = typeof track?.downloads === 'number' ? track.downloads : 0;
  const shareCount = typeof track?.shares === 'number' ? track.shares : 0;
  const emojiOptions = ['👍', '❤️', '😂', '🔥', '🎉'];

  const formatLargeNumber = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  const handleAddEmoji = (emoji: string) => {
    setNewComment((prev) => `${prev}${emoji}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
      </div>
    );
  }

  if (!track) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4 text-white">
        {error || 'Track not found.'}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <div className="relative max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-white/5 rounded-full px-4 py-2 hover:bg-white/10 transition"
          >
            <FaArrowLeft size={14} />
            Back
          </button>

          <div className="flex flex-wrap gap-3 text-xs text-gray-400">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1">
              <FaMusic size={12} />
              {track.genre || 'Unknown Genre'}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1">
              <FaClock size={12} />
              {formatDuration(track.duration)}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1">
              <FaEye size={12} />
              {formatLargeNumber(viewCount)} plays
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1">
              <FaHeart size={12} />
              {formatLargeNumber(likeCount)} likes
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1">
              <FaDownload size={12} />
              {formatLargeNumber(downloadCount)} downloads
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1">
              <FaShare size={12} />
              {formatLargeNumber(shareCount)} shares
            </span>
            {track.accessType !== 'FREE' && (
              <span className="inline-flex items-center gap-2 rounded-full bg-purple-600/20 px-3 py-1 text-purple-200">
                <FaCrown size={12} />
                {track.accessType}
              </span>
            )}
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.3fr_0.95fr] min-w-0">
          <div className="space-y-5 min-w-0">
            <div className="grid gap-4 md:grid-cols-[minmax(0,280px)_1fr] items-start">
              <div className="relative overflow-hidden rounded-[32px] bg-black shadow-sm w-full max-w-full h-[260px] sm:h-[320px] md:h-[420px]">
                <Image
                  src={coverArtUrl}
                  alt={track.title}
                  width={600}
                  height={600}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/default-cover.jpg';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <button
                  onClick={handlePlayTrack}
                  className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-600 text-white shadow-sm transition hover:bg-purple-500">
                    {currentTrack?.id === track.id && isPlaying ? (
                      <FaPause size={28} />
                    ) : (
                      <FaPlay size={28} />
                    )}
                  </div>
                </button>
                {track.accessType === 'PREMIUM' && (
                  <div className="absolute top-4 left-4 inline-flex items-center gap-2 rounded-full bg-purple-600 px-3 py-2 text-xs font-semibold text-white">
                    <FaCrown size={12} />
                    Premium
                  </div>
                )}
                <div className="absolute bottom-4 right-4 flex gap-2 z-10">
                  <button
                    onClick={handleLike}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition"
                  >
                    {isLiked ? <FaHeart size={16} className="text-red-500" /> : <FaRegHeart size={16} />}
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition"
                  >
                    <FaDownload size={16} />
                  </button>
                  <button
                    onClick={handleShare}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition"
                  >
                    <FaShare size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-[32px] bg-black p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.35em] text-purple-300">Now playing</p>
                  <h1 className="mt-4 text-3xl sm:text-4xl font-semibold text-white leading-tight">{track.title}</h1>
                  <p className="mt-3 text-lg text-gray-300 flex items-center gap-2">
                    <FaCheckCircle className="text-purple-400" size={16} />
                    {artistDisplay}
                  </p>
                </div>

                <div className="rounded-[32px] bg-black p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-4 mb-5">
                    <div>
                      <h2 className="text-2xl font-semibold text-white">Details</h2>
                      <p className="text-gray-400 text-sm">Track metadata, release info, and status.</p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowDetails(true)}
                        className={`text-sm font-semibold transition ${showDetails ? 'text-purple-300 border-b-2 border-purple-400 pb-1' : 'text-gray-400 hover:text-white'}`}
                      >
                        Details
                      </button>
                      <button
                        onClick={() => setShowDetails(false)}
                        className={`text-sm font-semibold transition ${!showDetails ? 'text-purple-300 border-b-2 border-purple-400 pb-1' : 'text-gray-400 hover:text-white'}`}
                      >
                        Lyrics
                      </button>
                    </div>
                  </div>

                  {showDetails ? (
                    <div className="flex flex-wrap gap-4 text-sm">
                      <span className="text-gray-400">Artist:</span>
                      <span className="text-white font-semibold">{artistDisplay}</span>
                      <span className="text-gray-400">Released:</span>
                      <span className="text-white font-semibold">{track.createdAt ? new Date(track.createdAt).toLocaleDateString() : 'Unknown'}</span>
                      <span className="text-gray-400">Genre:</span>
                      <span className="text-white font-semibold">{track.genre || 'Unknown'}</span>
                      <span className="text-gray-400">Access:</span>
                      <span className="text-white font-semibold">{track.isDRMProtected ? 'DRM Protected' : track.accessType}</span>
                    </div>
                  ) : (
                    <div className="rounded-3xl bg-white/5 p-5 text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {track.lyrics ? track.lyrics : 'No lyrics are available for this track.'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {relatedTracks.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-[32px] bg-black p-5 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3 mb-5">
                  <div>
                    <h3 className="text-2xl font-semibold text-white">Related tracks</h3>
                    <p className="text-gray-400 text-sm">Swipe horizontally for more music.</p>
                  </div>
                  <span className="text-xs uppercase tracking-[0.3em] text-purple-300">Browse</span>
                </div>
                <div className="overflow-x-auto pb-2 w-full">
                  <div className="flex gap-2 px-2 snap-x snap-mandatory w-full">
                    {relatedTracks.map((relatedTrack) => (
                      <button
                        key={relatedTrack.id}
                        onClick={() => router.push(`/track/${createMediaSlug(relatedTrack.title, relatedTrack.id)}`)}
                        className="snap-start min-w-[110px] max-w-[110px] sm:min-w-[120px] sm:max-w-[120px] lg:min-w-[240px] lg:max-w-[240px] rounded-[32px] bg-black p-2 sm:p-3 lg:p-4 text-left transition hover:bg-white/5 shadow-sm"
                      >
                        <div className="relative mb-2 sm:mb-3 lg:mb-4 h-20 sm:h-28 lg:h-36 overflow-hidden rounded-3xl bg-slate-900">
                          <Image
                            src={relatedTrack.coverArt || (relatedTrack as any).artCoverUrl || (relatedTrack as any).thumbnailUrl || (relatedTrack as any).coverUrl || '/default-cover.jpg'}
                            alt={relatedTrack.title}
                            fill
                            className="object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/default-cover.jpg';
                            }}
                          />
                        </div>
                        <p className="font-semibold text-white text-xs sm:text-sm lg:text-base truncate">{relatedTrack.title}</p>
                        <p className="text-xs sm:text-sm text-gray-400 truncate">{relatedTrack.artist}</p>
                        <div className="mt-1 sm:mt-2 lg:mt-3 flex items-center gap-1 sm:gap-2 text-xs text-gray-500">
                          <FaFire size={10} />
                          <span>{formatLargeNumber(relatedTrack.views || 0)} plays</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          <aside className="space-y-6 min-w-0">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-[32px] bg-black p-5 shadow-sm"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-semibold text-white">Comments</h2>
                  <p className="text-gray-400 text-sm">Add reactions and feedback</p>
                </div>
                <span className="text-sm text-gray-500">{comments.length} total</span>
              </div>

              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts..."
                className="w-full min-h-[100px] resize-none rounded-3xl bg-[#15121f] px-4 py-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm"
              />

              <div className="mt-4 flex flex-wrap gap-2">
                {emojiOptions.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleAddEmoji(emoji)}
                    className="rounded-full bg-white/10 px-3 py-2 text-lg transition hover:bg-white/20"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <button
                onClick={handlePostComment}
                disabled={!newComment.trim()}
                className="mt-4 w-full rounded-full bg-purple-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:bg-gray-700"
              >
                Post comment
              </button>

              <div className="mt-6 space-y-4">
                {comments.length === 0 ? (
                  <div className="rounded-3xl bg-white/5 p-6 text-center text-gray-400">No comments yet. Be the first!</div>
                ) : (
                  comments.map((comment) => (
                    <motion.div
                      key={comment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-3xl bg-white/10 p-4"
                    >
                      <div className="flex gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/20 text-purple-300">
                          <FaUser size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <p className="font-semibold text-white text-sm truncate">{comment.userName}</p>
                            {comment.isVerified && <FaCheckCircle className="text-purple-400" size={12} />}
                            <span className="text-xs text-gray-500">{new Date(comment.timestamp).toLocaleDateString()}</span>
                          </div>
                          <p className="text-gray-300 text-sm leading-relaxed mb-3">{comment.content}</p>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
                            <button className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1 hover:bg-white/10 transition">
                              <FaHeart size={12} />
                              {comment.likes}
                            </button>
                            <button
                              onClick={() => setReplyingTo(comment.id)}
                              className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1 hover:bg-white/10 transition"
                            >
                              <FaReply size={12} />
                              Reply
                            </button>
                            <div className="flex gap-1 text-lg">
                              {emojiOptions.map((emoji) => (
                                <span key={emoji} className="select-none">{emoji}</span>
                              ))}
                            </div>
                          </div>

                          {replyingTo === comment.id && (
                            <div className="mt-4 rounded-3xl bg-white/5 p-4">
                              <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Write a reply..."
                                className="w-full min-h-[90px] resize-none rounded-2xl bg-[#15121f] px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm mb-2 shadow-sm"
                              />
                              <div className="flex flex-wrap gap-2">
                                <button
                                  onClick={() => handleReply(comment.id)}
                                  className="rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500 transition"
                                >
                                  Reply
                                </button>
                                <button
                                  onClick={() => {
                                    setReplyingTo(null);
                                    setReplyText('');
                                  }}
                                  className="rounded-full bg-white/10 px-4 py-2 text-sm text-gray-300 hover:bg-white/20 transition"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}

                          {comment.replies && comment.replies.length > 0 && (
                            <div className="mt-3 space-y-2 pl-3 border-l-2 border-white/10">
                              {comment.replies.map((reply) => (
                                <div key={reply.id} className="text-xs text-gray-400">
                                  <p className="font-semibold text-gray-200">{reply.userName}</p>
                                  <p>{reply.content}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <button className="text-gray-400 hover:text-white transition-colors">
                          <FaEllipsisV size={12} />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </aside>
        </div>
      </div>
      <ShareModal
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        title={track?.title ?? ''}
        artist={track?.artist}
        coverUrl={coverUrl}
        url={shareUrl}
        description={track?.description ?? undefined}
        genre={track?.genre ?? undefined}
        duration={track?.duration ? `${Math.floor(track.duration / 60)}:${String(track.duration % 60).padStart(2, '0')}` : undefined}
        shareText={shareText}
      />
    </div>
  );
}
