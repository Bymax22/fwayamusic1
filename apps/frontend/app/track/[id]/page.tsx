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
  FaTimes,
  FaMusic,
  FaFire,
  FaStar,
  FaEye,
  FaCheckCircle
} from 'react-icons/fa';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { useAuth } from '@/context/AuthContext';
import { formatDuration } from '@/lib/utils';

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

  useEffect(() => {
    const fetchTrack = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/media/${params.id}`);
        if (!response.ok) {
          throw new Error('Track not found');
        }
        const data = await response.json();
        setTrack(data);

        // Fetch comments
        const commentsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/media/${params.id}/comments`);
        if (commentsRes.ok) {
          const commentsData = await commentsRes.json();
          setComments(commentsData);
        }

        // Fetch related tracks (same genre or artist)
        const relatedRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/media?genre=${data.genre}&limit=5`);
        if (relatedRes.ok) {
          const relatedData = await relatedRes.json();
          setRelatedTracks(relatedData.filter((t: MediaItem) => t.id !== params.id).slice(0, 4));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load track');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchTrack();
    }
  }, [params.id]);

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

  const handleShare = async () => {
    if (!track) return;
    
    const shareUrl = `${window.location.origin}/track/${track.id}`;
    if (navigator.share) {
      navigator.share({
        title: track.title,
        text: `Check out "${track.title}" by ${track.artist} on Fwaya Music`,
        url: shareUrl
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a1f29] to-[#050d12] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error || !track) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a1f29] to-[#050d12] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Track Not Found</h1>
          <button
            onClick={() => router.back()}
            className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1f29] to-[#050d12]">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0a1f29]/95 backdrop-blur border-b border-green-500/10 p-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-white hover:text-green-400 transition-colors"
        >
          <FaArrowLeft size={16} />
          Back
        </button>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Track Info and Player */}
          <div className="lg:col-span-2">
            {/* Cover Art and Play Button */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative mb-8"
            >
              <Image
                src={track.coverArt}
                alt={track.title}
                width={400}
                height={400}
                className="w-full rounded-2xl shadow-2xl"
              />
              
              {/* Overlay Gradient */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              {/* Play Button Overlay */}
              <button
                onClick={handlePlayTrack}
                className="absolute inset-0 flex items-center justify-center rounded-2xl hover:bg-black/20 transition-colors"
              >
                <div className="w-20 h-20 rounded-full bg-green-500 hover:bg-green-400 flex items-center justify-center transition-colors shadow-lg">
                  {currentTrack?.id === track.id && isPlaying ? (
                    <FaPause size={32} className="text-black ml-1" />
                  ) : (
                    <FaPlay size={32} className="text-black ml-2" />
                  )}
                </div>
              </button>

              {/* Badge */}
              {track.accessType === 'PREMIUM' && (
                <div className="absolute top-4 left-4 flex items-center gap-2 px-4 py-2 bg-yellow-500 rounded-full text-black font-semibold text-sm">
                  <FaCrown size={14} />
                  Premium
                </div>
              )}
            </motion.div>

            {/* Track Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8"
            >
              <h1 className="text-4xl font-bold text-white mb-2">{track.title}</h1>
              
              <div className="flex items-center gap-3 mb-6">
                {track.user?.avatarUrl && (
                  <Image
                    src={track.user.avatarUrl}
                    alt={track.artist}
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                )}
                <div>
                  <p className="text-lg text-white font-semibold flex items-center gap-2">
                    {track.artist}
                    {track.user?.isVerified && <FaCheckCircle className="text-green-400" size={16} />}
                  </p>
                  <p className="text-gray-400 text-sm">{track.genre}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 mb-8">
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all ${
                    isLiked
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {isLiked ? <FaHeart size={16} /> : <FaRegHeart size={16} />}
                  {track.likes + (isLiked ? 1 : 0)}
                </button>

                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all font-semibold"
                >
                  <FaShare size={16} />
                  Share
                </button>

                {track.accessType === 'FREE' && (
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all font-semibold"
                  >
                    <FaDownload size={16} />
                    Download
                  </button>
                )}

                {track.accessType === 'PREMIUM' && (
                  <button className="flex items-center gap-2 px-6 py-3 rounded-full bg-yellow-500 text-black hover:bg-yellow-600 transition-all font-semibold">
                    <FaCrown size={16} />
                    Premium
                  </button>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-4 p-4 bg-white/5 rounded-xl mb-8">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-green-400 mb-1">
                    <FaEye size={14} />
                    <span className="text-lg font-bold">{(track.views / 1000).toFixed(1)}K</span>
                  </div>
                  <p className="text-gray-400 text-xs">Views</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-red-400 mb-1">
                    <FaHeart size={14} />
                    <span className="text-lg font-bold">{(track.likes / 1000).toFixed(1)}K</span>
                  </div>
                  <p className="text-gray-400 text-xs">Likes</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-blue-400 mb-1">
                    <FaDownload size={14} />
                    <span className="text-lg font-bold">{(track.downloads / 1000).toFixed(1)}K</span>
                  </div>
                  <p className="text-gray-400 text-xs">Downloads</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-purple-400 mb-1">
                    <FaShare size={14} />
                    <span className="text-lg font-bold">{(track.shares / 1000).toFixed(1)}K</span>
                  </div>
                  <p className="text-gray-400 text-xs">Shares</p>
                </div>
              </div>

              {/* Description */}
              {track.description && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-white mb-3">About this track</h3>
                  <p className="text-gray-300 leading-relaxed">{track.description}</p>
                </div>
              )}

              {/* Tags */}
              {track.tags.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-white mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {track.tags.map((tag, index) => (
                      <button
                        key={index}
                        className="px-4 py-2 bg-green-500/20 text-green-400 rounded-full hover:bg-green-500/30 transition-colors text-sm"
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tabs */}
              <div className="flex gap-4 border-b border-white/10 mb-6">
                <button
                  onClick={() => setShowDetails(true)}
                  className={`pb-3 font-semibold transition-colors ${
                    showDetails
                      ? 'text-green-400 border-b-2 border-green-400'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Details
                </button>
                <button
                  onClick={() => setShowDetails(false)}
                  className={`pb-3 font-semibold transition-colors ${
                    !showDetails
                      ? 'text-green-400 border-b-2 border-green-400'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Lyrics
                </button>
              </div>

              {/* Details or Lyrics */}
              {showDetails ? (
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between py-2 border-b border-white/10">
                    <span className="text-gray-400">Duration</span>
                    <span className="text-white font-semibold">{formatDuration(track.duration)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/10">
                    <span className="text-gray-400">Released</span>
                    <span className="text-white font-semibold">{new Date(track.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/10">
                    <span className="text-gray-400">Genre</span>
                    <span className="text-white font-semibold">{track.genre}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/10">
                    <span className="text-gray-400">Type</span>
                    <span className="text-white font-semibold capitalize">{track.accessType}</span>
                  </div>
                  {track.isDRMProtected && (
                    <div className="flex justify-between py-2 border-b border-white/10">
                      <span className="text-gray-400">Protection</span>
                      <span className="text-yellow-400 font-semibold">DRM Protected</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white/5 rounded-lg p-6 mb-8">
                  {track.lyrics ? (
                    <div className="whitespace-pre-wrap text-gray-300 leading-relaxed">
                      {track.lyrics}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-center py-8">No lyrics available for this track</p>
                  )}
                </div>
              )}
            </motion.div>

            {/* Related Tracks */}
            {relatedTracks.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h3 className="text-2xl font-bold text-white mb-6">Related Tracks</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {relatedTracks.map((relatedTrack, index) => (
                    <motion.button
                      key={relatedTrack.id}
                      onClick={() => router.push(`/track/${relatedTrack.id}`)}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="group text-left p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-all"
                    >
                      <div className="flex gap-3">
                        <Image
                          src={relatedTrack.coverArt}
                          alt={relatedTrack.title}
                          width={60}
                          height={60}
                          className="rounded w-16 h-16 object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white group-hover:text-green-400 transition-colors truncate">
                            {relatedTrack.title}
                          </p>
                          <p className="text-gray-400 text-sm truncate">{relatedTrack.artist}</p>
                          <p className="text-xs text-gray-500 mt-1">{formatDuration(relatedTrack.duration)}</p>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Right: Comments Section */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 rounded-xl p-6 sticky top-24"
            >
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <FaComment size={18} />
                Comments ({comments.length})
              </h2>

              {/* Comment Input */}
              <div className="mb-6">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full bg-white/10 text-white placeholder-gray-500 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-green-500 mb-3"
                  rows={3}
                />
                <button
                  onClick={handlePostComment}
                  disabled={!newComment.trim()}
                  className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
                >
                  Post Comment
                </button>
              </div>

              {/* Comments List */}
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {comments.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No comments yet. Be the first!</p>
                ) : (
                  comments.map((comment) => (
                    <motion.div
                      key={comment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white/10 rounded-lg p-4"
                    >
                      <div className="flex gap-3">
                        <Image
                          src={comment.userAvatar}
                          alt={comment.userName}
                          width={32}
                          height={32}
                          className="rounded-full w-8 h-8"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-white text-sm">{comment.userName}</p>
                            {comment.isVerified && <FaCheckCircle className="text-green-400" size={12} />}
                          </div>
                          <p className="text-gray-300 text-sm mb-2">{comment.content}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            <span>{new Date(comment.timestamp).toLocaleDateString()}</span>
                            <button className="hover:text-green-400 transition-colors flex items-center gap-1">
                              <FaHeart size={10} />
                              {comment.likes}
                            </button>
                            <button
                              onClick={() => setReplyingTo(comment.id)}
                              className="hover:text-green-400 transition-colors flex items-center gap-1"
                            >
                              <FaReply size={10} />
                              Reply
                            </button>
                          </div>

                          {/* Reply Input */}
                          {replyingTo === comment.id && (
                            <div className="mt-3 pt-3 border-t border-white/10">
                              <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Write a reply..."
                                className="w-full bg-white/10 text-white placeholder-gray-500 rounded p-2 resize-none focus:outline-none focus:ring-2 focus:ring-green-500 text-sm mb-2"
                                rows={2}
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleReply(comment.id)}
                                  className="flex-1 px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-sm rounded transition-colors"
                                >
                                  Reply
                                </button>
                                <button
                                  onClick={() => {
                                    setReplyingTo(null);
                                    setReplyText('');
                                  }}
                                  className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-sm rounded transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Replies */}
                          {comment.replies && comment.replies.length > 0 && (
                            <div className="mt-3 space-y-2 pl-3 border-l-2 border-white/10">
                              {comment.replies.map((reply) => (
                                <div key={reply.id} className="text-xs">
                                  <p className="font-semibold text-gray-300">{reply.userName}</p>
                                  <p className="text-gray-400">{reply.content}</p>
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
          </div>
        </div>
      </div>
    </div>
  );
}
