"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Play, Pause, Volume2, VolumeX, Maximize2 } from "lucide-react";
import { FaHeart, FaShare, FaDownload, FaReply, FaCheckCircle } from "react-icons/fa";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import VideoCard from "@/components/VideoCard";

interface VideoDetail {
  id: number;
  title: string;
  artist: string;
  channelName: string;
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
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const { currentTrack, isPlaying, isMuted, playTrack, togglePlay, toggleMute, registerVideoElement } = useAudioPlayer();

  const videoId = Array.isArray(params.id) ? params.id[0] : params.id;
  const shouldAutoplay = searchParams?.get('autoplay') === '1';
  const playTrackRef = useRef(playTrack);

  useEffect(() => {
    playTrackRef.current = playTrack;
  }, [playTrack]);

  const isCurrentVideo = useMemo(
    () => currentTrack?.type === 'VIDEO' && String(currentTrack.id) === String(video?.id),
    [currentTrack, video?.id],
  );

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

        if (shouldAutoplay && mapped.videoUrl) {
          playTrackRef.current?.({
            id: mapped.id,
            title: mapped.title,
            artist: mapped.artist,
            imageUrl: mapped.thumbnail,
            videoUrl: mapped.videoUrl,
            type: 'VIDEO',
            duration: mapped.duration,
          });
        }

        void fetchComments();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load video");
      } finally {
        setLoading(false);
      }
    };

    const fetchComments = async () => {
      try {
        setComments([]);
        const commentsResponse = await fetch(`/api/media/${videoId}/comments`);
        if (!commentsResponse.ok) return;
        const commentsData = await commentsResponse.json();
        setComments(commentsData);
      } catch (err) {
        console.warn('Unable to fetch comments', err);
      }
    };

    if (videoId) {
      void fetchVideo();
    }
  }, [videoId, shouldAutoplay]);

  useEffect(() => {
    if (!videoRef.current) return;
    registerVideoElement(videoRef.current);
    return () => registerVideoElement(null);
  }, [registerVideoElement]);

  const handlePlay = async () => {
    if (!video) return;
    if (isCurrentVideo) {
      togglePlay();
      return;
    }

    playTrack({
      id: video.id,
      title: video.title,
      artist: video.artist,
      imageUrl: video.thumbnail,
      videoUrl: video.videoUrl,
      type: 'VIDEO',
      duration: video.duration,
    });
  };

  const handleMute = () => {
    toggleMute();
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

      const savedComment = await response.json();
      setComments((prev) => [savedComment, ...prev]);
      setNewComment('');
    } catch (err) {
      console.error('Failed to post comment', err);
      alert('Unable to post comment. Please try again.');
    } finally {
      setCommentLoading(false);
    }
  };

  const handleToggleCommentLike = (commentId: number) => {
    setComments((prev) =>
      prev.map((comment) => {
        if (comment.id !== commentId) return comment;
        return {
          ...comment,
          likes: comment.likes + 1,
        };
      }),
    );
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
          <div className="rounded-3xl bg-slate-950 p-6 text-sm text-red-300">{error}</div>
        ) : loading || !video ? (
          <div className="space-y-4">
            <div className="h-[420px] rounded-3xl bg-slate-900 animate-pulse" />
            <div className="h-8 w-3/5 rounded-full bg-slate-900 animate-pulse" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-48 rounded-3xl bg-slate-900 animate-pulse" />
              ))}
            </div>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1.5fr_0.9fr]">
            <div className="space-y-6">
              <div className="rounded-3xl bg-slate-950 p-4">
                <div className="aspect-video w-full overflow-hidden rounded-3xl bg-slate-900">
                  <video
                    ref={videoRef}
                    src={video.videoUrl}
                    controls
                    autoPlay={shouldAutoplay}
                    muted={isMuted}
                    className="h-full w-full bg-black"
                    onClick={() => {}}
                    onTouchStart={() => {}}
                    onMouseMove={() => {}}
                  />
                </div>
                <p className="mt-2 text-sm text-slate-400">{video.artist}</p>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                  <span>{video.views.toLocaleString()} views</span>
                  <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                  <span>{formatDuration(video.duration)}</span>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    onClick={handlePlay}
                    className="inline-flex items-center gap-2 rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-500"
                  >
                    {isCurrentVideo && isPlaying ? <Pause size={16} /> : <Play size={16} />}
                    {isCurrentVideo && isPlaying ? 'Pause' : 'Play'}
                  </button>
                  <button
                    onClick={handleMute}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm text-white transition hover:bg-slate-800"
                  >
                    {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    {isMuted ? 'Unmute' : 'Mute'}
                  </button>
                  <button
                    onClick={() => {
                      const videoEl = videoRef.current;
                      if (!videoEl) return;
                      if (document.fullscreenElement) {
                        document.exitFullscreen().catch(console.error);
                      } else {
                        videoEl.requestFullscreen().catch(console.error);
                      }
                    }}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm text-white transition hover:bg-slate-800"
                  >
                    <Maximize2 size={16} />
                    Fullscreen
                  </button>
                  <button
                    onClick={() => {
                      setIsLiked(true);
                    }}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm text-white transition hover:bg-slate-800"
                  >
                    <FaHeart size={16} className={isLiked ? 'text-red-400' : ''} />
                    {isLiked ? 'Liked' : 'Like'}
                  </button>
                  <button
                    onClick={() => {
                      const shareUrl = `${window.location.origin}/videos/${video.id}`;
                      if (navigator.share) {
                        navigator.share({ title: video.title, text: video.description, url: shareUrl }).catch(console.error);
                      } else {
                        navigator.clipboard.writeText(shareUrl).catch(console.error);
                        alert('Link copied to clipboard');
                      }
                    }}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm text-white transition hover:bg-slate-800"
                  >
                    <FaShare size={16} />
                    Share
                  </button>
                  <button
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
                    className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm text-white transition hover:bg-slate-800"
                  >
                    <FaDownload size={16} />
                    {isSaved ? 'Saved' : 'Save'}
                  </button>
                </div>
              </div>

              <div className="rounded-3xl bg-slate-950 p-6">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 rounded-full bg-slate-800" />
                  <div>
                    <p className="text-sm font-semibold text-white">{video.channelName}</p>
                    <p className="text-xs text-slate-400">Channel</p>
                  </div>
                </div>
                <div className="mt-6 text-sm leading-7 text-slate-300">{video.description}</div>
              </div>

              <div className="rounded-3xl bg-slate-950 p-6">
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
                      className="w-full rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-purple-500 focus:outline-none"
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
                      <div className="rounded-3xl bg-slate-900 p-4 text-sm text-slate-400">
                        No comments yet. Be the first to share your thoughts.
                      </div>
                    ) : (
                      comments.map((comment) => (
                        <div key={comment.id} className="rounded-3xl bg-slate-900 p-4">
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
                                  className="inline-flex items-center gap-2 text-slate-300 hover:text-white"
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
              <div className="rounded-3xl bg-slate-950 p-6">
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
