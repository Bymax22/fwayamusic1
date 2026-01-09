'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaArrowLeft,
  FaShare,
  FaHeart,
  FaRegHeart,
  FaComment,
  FaEye,
  FaCalendar,
  FaUser,
  FaReply,
  FaThumbsUp,
  FaThumbsDown,
  FaLaugh,
  FaAngry,
  FaFrown,
  FaSurprise,
  FaFire,
  FaStar,
  FaPlus,
  FaMinus
} from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';

interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  imageUrl: string;
  date: string;
  category: string;
  views: number;
  likes: number;
  comments: Comment[];
  reactions: Reaction[];
  author?: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface Comment {
  id: string;
  text: string;
  timestamp: string;
  likes: number;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
  };
  reactions: Reaction[];
  replies: Reply[];
  createdAt: string;
}

interface Reply {
  id: string;
  text: string;
  timestamp: string;
  likes: number;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
  };
  reactions: Reaction[];
  createdAt: string;
}

interface Reaction {
  emoji: string;
  count: number;
  userReacted: boolean;
  type: 'like' | 'love' | 'laugh' | 'angry' | 'sad' | 'surprise' | 'fire' | 'star';
}

const NewsDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const [news, setNews] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [userReactions, setUserReactions] = useState<Record<string, string>>({});
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [newReply, setNewReply] = useState('');
  const [showComments, setShowComments] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/news/${params.id}`);
        if (!response.ok) {
          throw new Error('News article not found');
        }
        const data = await response.json();
        setNews(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load news article');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchNews();
    }
  }, [params.id]);

  const handleLike = () => {
    setIsLiked(!isLiked);
    // TODO: Implement like functionality with API
  };

  const handleReaction = (contentId: string, reactionType: string, isReply = false) => {
    setUserReactions(prev => ({
      ...prev,
      [contentId]: prev[contentId] === reactionType ? '' : reactionType
    }));
    // TODO: Implement reaction functionality with API
  };

  const handleComment = () => {
    if (!newComment.trim()) return;

    // TODO: Implement comment functionality with API
    const comment: Comment = {
      id: Date.now().toString(),
      text: newComment,
      timestamp: new Date().toISOString(),
      likes: 0,
      user: {
        id: 'current-user',
        username: 'currentuser',
        displayName: 'Current User',
        avatarUrl: '/default-avatar.png'
      },
      reactions: [],
      replies: [],
      createdAt: new Date().toISOString()
    };

    setNews(prev => prev ? {
      ...prev,
      comments: [...prev.comments, comment]
    } : null);

    setNewComment('');
  };

  const handleReply = (commentId: string) => {
    if (!newReply.trim()) return;

    // TODO: Implement reply functionality with API
    const reply: Reply = {
      id: Date.now().toString(),
      text: newReply,
      timestamp: new Date().toISOString(),
      likes: 0,
      user: {
        id: 'current-user',
        username: 'currentuser',
        displayName: 'Current User',
        avatarUrl: '/default-avatar.png'
      },
      reactions: [],
      createdAt: new Date().toISOString()
    };

    setNews(prev => prev ? {
      ...prev,
      comments: prev.comments.map(comment =>
        comment.id === commentId
          ? { ...comment, replies: [...comment.replies, reply] }
          : comment
      )
    } : null);

    setNewReply('');
    setReplyingTo(null);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: news?.title,
        text: news?.excerpt,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const getReactionIcon = (type: string) => {
    switch (type) {
      case 'like': return <FaThumbsUp size={14} />;
      case 'love': return <FaHeart size={14} />;
      case 'laugh': return <FaLaugh size={14} />;
      case 'angry': return <FaAngry size={14} />;
      case 'sad': return <FaFrown size={14} />;
      case 'surprise': return <FaSurprise size={14} />;
      case 'fire': return <FaFire size={14} />;
      case 'star': return <FaStar size={14} />;
      default: return <FaThumbsUp size={14} />;
    }
  };

  const getReactionColor = (type: string) => {
    switch (type) {
      case 'like': return 'text-blue-500';
      case 'love': return 'text-red-500';
      case 'laugh': return 'text-yellow-500';
      case 'angry': return 'text-red-600';
      case 'sad': return 'text-blue-400';
      case 'surprise': return 'text-purple-500';
      case 'fire': return 'text-orange-500';
      case 'star': return 'text-yellow-400';
      default: return 'text-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a1f29] to-[#0a3747] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e51f48] mx-auto mb-3"></div>
          <p className="text-white">Loading news article...</p>
        </div>
      </div>
    );
  }

  if (error || !news) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a1f29] to-[#0a3747] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">News Article Not Found</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => router.back()}
            className="bg-[#e51f48] text-white px-6 py-2 rounded-lg hover:bg-[#d1183a] transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1f29] to-[#0a3747]">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0a1f29]/80" />
        <div className="relative z-10 p-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-white hover:text-[#e51f48] transition-colors mb-6"
          >
            <FaArrowLeft size={20} />
            Back to News
          </button>

          {/* Hero Image */}
          <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden mb-6">
            <Image
              src={news.imageUrl}
              alt={news.title}
              fill
              className="object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/default-news.png";
              }}
            />
            <div className="absolute top-4 left-4">
              <span className="bg-[#e51f48] text-white px-3 py-1 rounded-full text-sm font-medium">
                {news.category}
              </span>
            </div>
          </div>

          {/* Article Header */}
          <div className="text-white">
            <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">{news.title}</h1>
            <p className="text-xl text-gray-300 mb-6">{news.excerpt}</p>

            {/* Article Meta */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-400 mb-6">
              {news.author && (
                <div className="flex items-center gap-2">
                  <div className="relative w-8 h-8 rounded-full overflow-hidden">
                    <Image
                      src={news.author.avatarUrl || "/default-avatar.png"}
                      alt={news.author.displayName}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <span>{news.author.displayName}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <FaCalendar size={14} />
                <span>{formatDistanceToNow(new Date(news.createdAt), { addSuffix: true })}</span>
              </div>
              <div className="flex items-center gap-1">
                <FaEye size={14} />
                <span>{news.views?.toLocaleString() || 0} views</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mb-8">
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isLiked
                    ? 'bg-[#e51f48] text-white'
                    : 'bg-[#0a3747] text-white hover:bg-[#0b2936]'
                }`}
              >
                {isLiked ? <FaHeart size={16} /> : <FaRegHeart size={16} />}
                {news.likes + (isLiked ? 1 : 0)}
              </button>

              <button
                onClick={() => setShowComments(!showComments)}
                className="flex items-center gap-2 bg-[#0a3747] text-white px-4 py-2 rounded-lg hover:bg-[#0b2936] transition-colors"
              >
                <FaComment size={16} />
                {news.comments.length} Comments
              </button>

              <button
                onClick={handleShare}
                className="flex items-center gap-2 bg-[#0a3747] text-white px-4 py-2 rounded-lg hover:bg-[#0b2936] transition-colors"
              >
                <FaShare size={16} />
                Share
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <div className="px-6 pb-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#0a3747]/50 rounded-lg p-6 md:p-8">
            <div
              className="prose prose-lg prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: news.content }}
            />
          </div>

          {/* Reactions Section */}
          <div className="bg-[#0a3747]/50 rounded-lg p-6 mt-6">
            <h3 className="text-xl font-bold text-white mb-4">React to this article</h3>
            <div className="flex flex-wrap gap-2">
              {[
                { type: 'like', icon: FaThumbsUp, label: 'Like' },
                { type: 'love', icon: FaHeart, label: 'Love' },
                { type: 'laugh', icon: FaLaugh, label: 'Funny' },
                { type: 'surprise', icon: FaSurprise, label: 'Wow' },
                { type: 'sad', icon: FaFrown, label: 'Sad' },
                { type: 'angry', icon: FaAngry, label: 'Angry' },
                { type: 'fire', icon: FaFire, label: 'Fire' },
                { type: 'star', icon: FaStar, label: 'Star' }
              ].map(({ type, icon: Icon, label }) => (
                <button
                  key={type}
                  onClick={() => handleReaction(news.id, type)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    userReactions[news.id] === type
                      ? `${getReactionColor(type)} bg-opacity-20`
                      : 'text-gray-400 hover:text-white hover:bg-[#0b2936]'
                  }`}
                >
                  <Icon size={16} />
                  <span className="text-sm">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Comments Section */}
          <AnimatePresence>
            {showComments && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-[#0a3747]/50 rounded-lg p-6 mt-6"
              >
                <h3 className="text-xl font-bold text-white mb-6">Comments ({news.comments.length})</h3>

                {/* Add Comment */}
                <div className="mb-6">
                  <div className="flex gap-3">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                      <Image
                        src="/default-avatar.png"
                        alt="Your avatar"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write a comment..."
                        className="w-full bg-[#0b2936] text-white rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-[#e51f48]"
                        rows={3}
                      />
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={handleComment}
                          disabled={!newComment.trim()}
                          className="bg-[#e51f48] text-white px-4 py-2 rounded-lg hover:bg-[#d1183a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Comment
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Comments List */}
                <div className="space-y-6">
                  {news.comments.map((comment) => (
                    <div key={comment.id} className="border-b border-gray-700 pb-6 last:border-b-0">
                      <div className="flex gap-3">
                        <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                          <Image
                            src={comment.user.avatarUrl || "/default-avatar.png"}
                            alt={comment.user.displayName}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="bg-[#0b2936] rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium text-white">{comment.user.displayName}</span>
                              <span className="text-xs text-gray-400">
                                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                            <p className="text-gray-300">{comment.text}</p>
                          </div>

                          {/* Comment Actions */}
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <button
                              onClick={() => handleReaction(comment.id, 'like')}
                              className={`flex items-center gap-1 transition-colors ${
                                userReactions[comment.id] === 'like' ? 'text-blue-500' : 'text-gray-400 hover:text-white'
                              }`}
                            >
                              <FaThumbsUp size={12} />
                              {comment.likes + (userReactions[comment.id] === 'like' ? 1 : 0)}
                            </button>

                            <button
                              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                              className="text-gray-400 hover:text-white transition-colors"
                            >
                              Reply
                            </button>
                          </div>

                          {/* Reply Form */}
                          <AnimatePresence>
                            {replyingTo === comment.id && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-3 ml-8"
                              >
                                <div className="flex gap-3">
                                  <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                                    <Image
                                      src="/default-avatar.png"
                                      alt="Your avatar"
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <textarea
                                      value={newReply}
                                      onChange={(e) => setNewReply(e.target.value)}
                                      placeholder="Write a reply..."
                                      className="w-full bg-[#0b2936] text-white rounded-lg p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#e51f48]"
                                      rows={2}
                                    />
                                    <div className="flex justify-end gap-2 mt-2">
                                      <button
                                        onClick={() => setReplyingTo(null)}
                                        className="text-gray-400 hover:text-white text-sm"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        onClick={() => handleReply(comment.id)}
                                        disabled={!newReply.trim()}
                                        className="bg-[#e51f48] text-white px-3 py-1 rounded text-sm hover:bg-[#d1183a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                      >
                                        Reply
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Replies */}
                          {comment.replies.length > 0 && (
                            <div className="mt-4 ml-8 space-y-3">
                              {comment.replies.map((reply) => (
                                <div key={reply.id} className="flex gap-3">
                                  <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                                    <Image
                                      src={reply.user.avatarUrl || "/default-avatar.png"}
                                      alt={reply.user.displayName}
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <div className="bg-[#0b2936] rounded-lg p-2">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium text-white text-sm">{reply.user.displayName}</span>
                                        <span className="text-xs text-gray-400">
                                          {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                                        </span>
                                      </div>
                                      <p className="text-gray-300 text-sm">{reply.text}</p>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1 text-xs">
                                      <button
                                        onClick={() => handleReaction(reply.id, 'like', true)}
                                        className={`flex items-center gap-1 transition-colors ${
                                          userReactions[reply.id] === 'like' ? 'text-blue-500' : 'text-gray-400 hover:text-white'
                                        }`}
                                      >
                                        <FaThumbsUp size={10} />
                                        {reply.likes + (userReactions[reply.id] === 'like' ? 1 : 0)}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default NewsDetailPage;