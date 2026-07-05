"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { FaHeart, FaReply, FaCheckCircle, FaEye } from "react-icons/fa";
import { BookmarkCheck, BookmarkPlus, ListPlus, Share2, ThumbsDown, ThumbsUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import VideoWatchPlayer from "@/components/VideoWatchPlayer";
import VideoCard from "@/components/VideoCard";

interface VideoDetail {
  id: number;
  title: string;
  artist: string;
  channelName: string;
  channelId?: number;
  channelAvatar?: string;
  followerCount?: number;
  isFollowing?: boolean;
  description: string;
  duration: number;
  views: number;
  likes: number;
  createdAt: string;
  thumbnail: string;
  videoUrl: string;
  related: Array<{
    id: number;
    title: string;
    artist: string;
    duration: number;
    views: number;
    createdAt: string;
    thumbnail: string;
  }>;
}

interface VideoComment {
  id: number;
  userId: number;
  userName: string;
  userAvatar: string;
  content: string;
  timestamp: string;
  likes: number;
  isVerified?: boolean;
  replies?: VideoComment[];
}

const formatDuration = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

function VideoPageSkeleton({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen px-4 pb-24 pt-6 lg:px-10">
      <div className="max-w-7xl mx-auto space-y-6">
        <button
          className="mb-6 rounded-full bg-purple-600 px-4 py-2 text-sm text-white transition hover:bg-purple-500"
          onClick={onBack}
        >
          Back
        </button>
        <div className="h-[420px] rounded-3xl bg-[#11131a] animate-pulse" />
        <div className="space-y-4 rounded-3xl bg-[#0f1115] p-6 shadow-lg shadow-black/20">
          <div className="h-6 w-2/5 rounded-full bg-[#11131a] animate-pulse" />
          <div className="h-4 w-3/5 rounded-full bg-[#11131a] animate-pulse" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="h-28 rounded-3xl bg-[#11131a] animate-pulse" />
            <div className="h-28 rounded-3xl bg-[#11131a] animate-pulse" />
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-[1.5fr_0.9fr]">
          <div className="space-y-4">
            <div className="h-20 rounded-3xl bg-[#11131a] animate-pulse" />
            <div className="h-80 rounded-3xl bg-[#11131a] animate-pulse" />
          </div>
          <div className="space-y-4">
            <div className="h-96 rounded-3xl bg-[#11131a] animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VideoWatchPage() {
  const params = useParams();
  const router = useRouter();
  const { getToken } = useAuth();
  const searchParams = useSearchParams();
  const [video, setVideo] = useState<VideoDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comments, setComments] = useState<VideoComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [likedComments, setLikedComments] = useState<number[]>([]);
  const [followLoading, setFollowLoading] = useState(false);
  const [relativeTime, setRelativeTime] = useState('Recently uploaded');
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [isInPlaylist, setIsInPlaylist] = useState(false);

  const fetchComments = async (mediaId?: string) => {
    try {
      setComments([]);
      const targetId = mediaId || videoId;
      if (!targetId) return;
      const commentsResponse = await fetch(`/api/media/${targetId}/comments`);
      if (!commentsResponse.ok) return;
      const commentsData = await commentsResponse.json();
      setComments(commentsData);
    } catch (err) {
      console.warn('Unable to fetch comments', err);
    }
  };

  const fetchLikedCommentIds = async (mediaId?: string | number) => {
    try {
      const targetId = mediaId || videoId;
      if (!targetId) return;
      const token = await getToken();
      if (!token) {
        setLikedComments([]);
        return;
      }

      const response = await fetch(`/api/media/${targetId}/comments/likes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) return;
      const data = await response.json();
      if (Array.isArray(data)) {
        setLikedComments(data.map((id) => Number(id)).filter((id) => Number.isFinite(id)));
      }
    } catch (err) {
      console.warn('Unable to fetch liked comments', err);
    }
  };

  const videoId = Array.isArray(params.id) ? params.id[0] : params.id;
  const shouldAutoplay = searchParams?.get('autoplay') === '1';

  useEffect(() => {
    if (!video?.createdAt) return;

    const parsedDate = new Date(video.createdAt);
    const isValidDate = !Number.isNaN(parsedDate.getTime());

    const updateRelativeTime = () => {
      if (!isValidDate) {
        setRelativeTime('Recently uploaded');
        return;
      }
      setRelativeTime(formatDistanceToNow(parsedDate, { addSuffix: true }));
    };

    updateRelativeTime();
    const intervalId = window.setInterval(updateRelativeTime, 60000);

    return () => window.clearInterval(intervalId);
  }, [video?.createdAt]);

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        setLoading(true);
        let res = await fetch(`/api/media/${videoId}`);

        if (!res.ok) {
          const backendUrl = process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/media/${videoId}` : null;
          if (backendUrl) {
            try {
              res = await fetch(backendUrl);
            } catch (fallbackError) {
              console.warn('Fallback backend fetch failed', fallbackError);
            }
          }
        }

        if (!res.ok) {
          const errorDetails = await res.json().catch(() => null);
          throw new Error(errorDetails?.error || `Video not found (${res.status})`);
        }

        const data = await res.json();
        const item = data.data || data;
        const mapped = {
          id: item.id,
          title: item.title || item.name || "Untitled",
          artist: item.user?.displayName || item.user?.username || item.artist || "Unknown",
          channelName: item.user?.displayName || item.user?.username || "Unknown",
          channelId: item.user?.id ?? item.artistId ?? item.channelId,
          channelAvatar: item.user?.avatarUrl || item.user?.avatar || item.channelAvatar || "/default-avatar.jpg",
          followerCount: item.user?.followersCount || item.user?.followerCount || item.followersCount || 0,
          isFollowing: Boolean(item.user?.isFollowing ?? item.isFollowing),
          description: item.description || item.summary || "No description available.",
          duration: item.duration || item.length || 0,
          views: item.views || item.playCount || 0,
          likes: item.likes || 0,
          createdAt: item.createdAt || item.publishedAt || new Date().toISOString(),
          thumbnail: item.thumbnailUrl || item.artCoverUrl || item.coverArt || "/default-cover.jpg",
          videoUrl: item.videoUrl || item.url || item.audioUrl || "",
          related: (item.relatedVideos || item.related || []).map((relatedItem: any) => ({
            id: relatedItem.id,
            title: relatedItem.title || relatedItem.name || "Untitled",
            artist: relatedItem.user?.displayName || relatedItem.user?.username || relatedItem.artist || "Unknown",
            duration: relatedItem.duration || relatedItem.length || 0,
            views: relatedItem.views || relatedItem.playCount || 0,
            createdAt: relatedItem.createdAt || relatedItem.publishedAt || new Date().toISOString(),
            thumbnail: relatedItem.thumbnailUrl || relatedItem.artCoverUrl || relatedItem.coverArt || "/default-cover.jpg",
            videoUrl: relatedItem.videoUrl || relatedItem.url || relatedItem.audioUrl || undefined,
          })),
        };
        setVideo(mapped);
        setLoading(false);

        void fetchComments(videoId);
        void fetchLikedCommentIds(videoId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load video");
        setLoading(false);
      }
    };

    if (videoId) {
      void fetchVideo();
    }
  }, [videoId, shouldAutoplay]);

  useEffect(() => {
    const fetchFollowStatus = async () => {
      if (!video?.channelId) return;

      const token = await getToken();
      if (!token) return;

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/follow/status/${video.channelId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) return;

        const data = await response.json();
        setVideo((prev) => (prev ? { ...prev, isFollowing: Boolean(data.isFollowing) } : prev));
      } catch (err) {
        console.warn('Unable to load follow status', err);
      }
    };

    void fetchFollowStatus();
  }, [getToken, video?.channelId]);

  const handleFollow = async () => {
    if (!video?.channelId) return;

    const token = await getToken();
    if (!token) {
      alert('Please sign in to follow this creator.');
      return;
    }

    const isCurrentlyFollowing = Boolean(video.isFollowing);
    const nextFollowing = !isCurrentlyFollowing;
    const nextFollowerCount = Math.max(0, (video.followerCount || 0) + (nextFollowing ? 1 : -1));

    setFollowLoading(true);
    setVideo((prev) => (prev ? { ...prev, isFollowing: nextFollowing, followerCount: nextFollowerCount } : prev));

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/follow/${video.channelId}`, {
        method: isCurrentlyFollowing ? 'DELETE' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to update follow state');
      }
    } catch (err) {
      console.error('Follow update failed', err);
      setVideo((prev) => (prev ? { ...prev, isFollowing: isCurrentlyFollowing, followerCount: Math.max(0, (prev.followerCount || 0) + (nextFollowing ? -1 : 1)) } : prev));
      alert('Unable to update follow state right now.');
    } finally {
      setFollowLoading(false);
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim() || !video) return;

    const token = await getToken();
    if (!token) {
      alert('Please sign in to post a comment.');
      return;
    }

    setCommentLoading(true);
    try {
      const response = await fetch(`/api/media/${video.id}/comments`, {
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

      await fetchComments();
      setNewComment('');
    } catch (err) {
      console.error('Failed to post comment', err);
      alert('Unable to post comment. Please try again.');
    } finally {
      setCommentLoading(false);
    }
  };

  const handleToggleCommentLike = async (commentId: number) => {
    if (!video) return;

    const token = await getToken();
    if (!token) {
      alert('Please sign in to like comments.');
      return;
    }

    const isCurrentlyLiked = likedComments.includes(commentId);
    const method = isCurrentlyLiked ? 'DELETE' : 'POST';

    try {
      const response = await fetch(`/api/media/${video.id}/comments/${commentId}/like`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to update comment like');
      }

      const updated = await response.json();
      setComments((prev) =>
        prev.map((comment) => {
          if (comment.id !== commentId) return comment;
          return {
            ...comment,
            likes: updated.likes,
          };
        }),
      );

      setLikedComments((prev) =>
        isCurrentlyLiked ? prev.filter((id) => id !== commentId) : [...prev, commentId],
      );
    } catch (err) {
      console.error('Failed to update comment like', err);
      alert('Unable to update like. Please try again.');
    }
  };

  const handleReply = async (commentId: number) => {
    if (!replyText.trim() || !video) return;

    const token = await getToken();
    if (!token) {
      alert('Please sign in to reply to comments.');
      return;
    }

    try {
      const response = await fetch(`/api/media/${video.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: replyText, parentId: commentId }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Reply failed response', response.status, errorText);
        throw new Error('Failed to post reply');
      }

      await Promise.all([fetchComments(), fetchLikedCommentIds(video.id)]);
      setReplyText('');
      setReplyingTo(null);
    } catch (err) {
      console.error('Failed to post reply', err);
      alert('Unable to reply. Please try again.');
    }
  };

  return (
    <div className="min-h-screen px-4 pb-24 pt-6 lg:px-10">
      <div className="max-w-7xl mx-auto">
        <button
            className="mb-6 rounded-full bg-purple-600 px-4 py-2 text-sm text-white transition hover:bg-purple-500"
            onClick={() => router.back()}
        >
          Back
        </button>



        {error ? (
          <div className="rounded-3xl bg-[#181b20] border border-white/10 p-6 text-sm text-red-300">{error}</div>
        ) : loading || !video ? (
          <VideoPageSkeleton onBack={() => router.back()} />
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1.5fr_0.9fr]">
            <div className="space-y-6">
              <div className="rounded-3xl bg-[#0f1115] p-4 shadow-lg shadow-black/20">
                <VideoWatchPlayer
                  trackId={video.id}
                  videoUrl={video.videoUrl}
                  poster={video.thumbnail}
                  title={video.title}
                  artist={video.artist}
                  duration={video.duration}
                  autoPlay={shouldAutoplay}
                />

                <div className="mt-3 space-y-2 sm:mt-4">
                  <p className="text-base font-semibold text-white sm:hidden">{video.title}</p>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
                    <span className="inline-flex items-center gap-1.5 text-slate-300">
                      <FaEye className="text-slate-400" />
                      {video.views.toLocaleString()} views
                    </span>
                    <span>{relativeTime}</span>
                    <span>{formatDuration(video.duration)}</span>
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between gap-3 px-1 py-1 sm:mt-3 sm:px-0">
                  <div className="flex min-w-0 items-center gap-3">
                    <img
                      src={video.channelAvatar || '/default-avatar.jpg'}
                      alt={video.channelName}
                      className="h-11 w-11 rounded-full object-cover ring-1 ring-white/10"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{video.channelName}</p>
                      <p className="text-xs text-slate-400">{(video.followerCount || 0).toLocaleString()} followers</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleFollow}
                    disabled={followLoading || !video.channelId}
                    className="rounded-full bg-purple-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {video.isFollowing ? 'Following' : 'Follow'}
                  </button>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const shareUrl = `${window.location.origin}/videos/${video.id}`;
                      if (navigator.share) {
                        navigator.share({ title: video.title, text: video.description, url: shareUrl }).catch(console.error);
                      } else {
                        navigator.clipboard.writeText(shareUrl).catch(console.error);
                        alert('Link copied to clipboard');
                      }
                    }}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black text-white transition hover:bg-neutral-800"
                    aria-label="Share"
                    title="Share"
                  >
                    <Share2 size={18} strokeWidth={1.8} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsLiked((prev) => !prev);
                      if (isDisliked) setIsDisliked(false);
                    }}
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-full transition ${isLiked ? 'bg-black text-white' : 'bg-black text-slate-200 hover:bg-neutral-800'}`}
                    aria-label="Like"
                    title="Like"
                  >
                    <ThumbsUp size={18} strokeWidth={1.8} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDisliked((prev) => !prev);
                      if (isLiked) setIsLiked(false);
                    }}
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-full transition ${isDisliked ? 'bg-black text-white' : 'bg-black text-slate-200 hover:bg-neutral-800'}`}
                    aria-label="Dislike"
                    title="Dislike"
                  >
                    <ThumbsDown size={18} strokeWidth={1.8} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsInPlaylist((prev) => !prev)}
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-full transition ${isInPlaylist ? 'bg-black text-white' : 'bg-black text-slate-200 hover:bg-neutral-800'}`}
                    aria-label="Add to playlist"
                    title="Add to playlist"
                  >
                    <ListPlus size={18} strokeWidth={1.8} />
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!video) return;
                      const token = await getToken();
                      if (!token) {
                        alert('Please sign in to save this video.');
                        return;
                      }

                      try {
                        await fetch(`/api/media/${video.id}/interact/heart`, {
                          method: 'POST',
                          headers: {
                            Authorization: `Bearer ${token}`,
                          },
                        });
                        setIsSaved(true);
                      } catch (err) {
                        console.error('Save failed', err);
                        alert('Unable to save this video yet.');
                      }
                    }}
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-full transition ${isSaved ? 'bg-black text-white' : 'bg-black text-slate-200 hover:bg-neutral-800'}`}
                    aria-label="Save"
                    title="Save"
                  >
                    {isSaved ? <BookmarkCheck size={18} strokeWidth={1.8} /> : <BookmarkPlus size={18} strokeWidth={1.8} />}
                  </button>
                </div>
              </div>

              <div className="rounded-3xl bg-[#0f1115] p-6 shadow-lg shadow-black/20">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 rounded-full bg-[#090b10]" />
                  <div>
                    <p className="text-sm font-semibold text-white">{video.channelName}</p>
                    <p className="text-xs text-slate-400">Channel</p>
                  </div>
                </div>
                <div className="mt-6 text-sm leading-7 text-slate-300">{video.description}</div>
              </div>

              <div className="rounded-3xl bg-[#0f1115] p-6 shadow-lg shadow-black/20">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-white">Comments</h2>
                      <p className="text-sm text-slate-500">{comments.length} discussion{comments.length === 1 ? '' : 's'}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={4}
                      placeholder="Write a comment..."
                      className="w-full rounded-3xl border border-white/10 bg-[#121418] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-purple-500 focus:outline-none"
                    />
                    <button
                      onClick={handlePostComment}
                      disabled={commentLoading || !newComment.trim()}
                      className="inline-flex items-center justify-center rounded-full bg-purple-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {commentLoading ? 'Posting...' : 'Post comment'}
                    </button>
                  </div>

                  <div className="space-y-4 pt-4">
                    {comments.length === 0 ? (
                      <div className="rounded-3xl bg-[#121418] p-4 text-sm text-slate-400">
                        No comments yet. Be the first to share your thoughts.
                      </div>
                    ) : (
                      comments.map((comment) => (
                        <div key={comment.id} className="rounded-3xl bg-[#121418] p-4">
                          <div className="flex items-start gap-3">
                            <img
                              src={comment.userAvatar}
                              alt={comment.userName}
                              className="h-10 w-10 rounded-full object-cover bg-slate-800"
                            />
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-semibold text-white">{comment.userName}</p>
                                {comment.isVerified && <FaCheckCircle className="h-4 w-4 text-sky-400" />}
                                <span className="text-xs text-slate-500">{formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}</span>
                              </div>
                              <p className="mt-3 text-sm leading-6 text-slate-300">{comment.content}</p>
                              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-400">
                                <button
                                  type="button"
                                  onClick={() => handleToggleCommentLike(comment.id)}
                                  className={`inline-flex items-center gap-2 ${likedComments.includes(comment.id) ? 'text-red-400' : 'text-slate-300 hover:text-white'}`}
                                >
                                  <FaHeart size={14} />
                                  {comment.likes}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setReplyingTo(comment.id)}
                                  className="inline-flex items-center gap-2 text-slate-300 hover:text-white"
                                >
                                  <FaReply size={14} />
                                  Reply
                                </button>
                              </div>

                              {comment.replies && comment.replies.length > 0 && (
                                <div className="mt-4 space-y-4 rounded-3xl bg-[#121418] p-4">
                                  {comment.replies.map((reply) => (
                                    <div key={reply.id} className="rounded-3xl bg-[#14161b] p-4">
                                      <div className="flex items-start gap-3">
                                        <img
                                          src={reply.userAvatar}
                                          alt={reply.userName}
                                          className="h-10 w-10 rounded-full object-cover bg-slate-800"
                                        />
                                        <div className="flex-1">
                                          <div className="flex flex-wrap items-center gap-2">
                                            <p className="text-sm font-semibold text-white">{reply.userName}</p>
                                            {reply.isVerified && <FaCheckCircle className="h-4 w-4 text-sky-400" />}
                                            <span className="text-xs text-slate-500">{formatDistanceToNow(new Date(reply.timestamp), { addSuffix: true })}</span>
                                          </div>
                                          <p className="mt-2 text-sm leading-6 text-slate-300">{reply.content}</p>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {replyingTo === comment.id && (
                                <div className="mt-3 space-y-3">
                                  <textarea
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    rows={3}
                                    placeholder="Write a reply..."
                                    className="w-full rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-purple-500 focus:outline-none"
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleReply(comment.id)}
                                      className="inline-flex items-center justify-center rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-500"
                                    >
                                      Reply
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setReplyingTo(null);
                                        setReplyText('');
                                      }}
                                      className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm text-white transition hover:bg-slate-800"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            <aside className="space-y-4">
              <div className="rounded-3xl bg-[#0f1115] p-6 shadow-lg shadow-black/20">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Related videos</p>
                  <button className="text-sm text-purple-400 hover:text-purple-300">See all</button>
                </div>
                <div className="space-y-4">
                  {video.related.map((relatedItem) => (
                    <VideoCard
                      key={relatedItem.id}
                      {...relatedItem}
                      href={`/videos/${relatedItem.id}`}
                    />
                  ))}
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
