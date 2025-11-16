"use client";
import React from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { FaUserFriends } from "react-icons/fa";
import Player from './Player';
import { 
  FaPlay, 
  FaPause,
  FaHeart,
  FaRegHeart,
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
  FaHeadphones,
  FaCrown,
  FaArrowRight,
  FaTimes,
  FaShoppingCart,
  FaDownload,
  FaShare,
  FaComment,
  FaEye
} from "react-icons/fa";
import { IoMdMusicalNote } from "react-icons/io";

// Types
interface MediaItem {
  id: number;
  title: string;
  artist: string;
  url: string;
  duration: number;
  format: string;
  createdAt: string;
  coverArt: string;
  views: number;
  likes: number;
  genre?: string;
  interactions?: { liked: boolean; saved: boolean }[];
  accessType: 'FREE' | 'PREMIUM' | 'PAY_PER_VIEW';
  price?: number;
  currency?: string;
  isExplicit: boolean;
  downloadCount: number;
  shareCount: number;
  tags: string[];
  thumbnailUrl?: string;
  artCoverUrl?: string; 
  user?: {
    id: number;
    username?: string;
    displayName?: string;
    avatarUrl?: string;
    isVerified?: boolean;
  };
  isDRMProtected?: boolean;
  artistCommissionRate?: number;
  allowReselling?: boolean;
  type?: 'AUDIO' | 'VIDEO' | 'PODCAST' | 'LIVE_STREAM';
  imageUrl?: string;
  audioUrl?: string;
  plays?: number;
  isFeatured?: boolean;
  isTrending?: boolean;
  liked?: boolean;
}

interface Playlist {
  id: number;
  name: string;
  description?: string;
  coverUrl?: string;
  isPublic: boolean;
  type: 'SYSTEM' | 'USER' | 'SMART' | 'RADIO';
  mediaCount: number;
  title?: string;
  imageUrl?: string;
  artist?: string;
  plays?: number;
}

interface Artist {
  id: string;
  name: string;
  imageUrl: string;
  followers: number;
  isVerified?: boolean;
  isFollowing?: boolean;
  mediaCount?: number; 
  avatarUrl?: string;
}

interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  imageUrl: string;
  date: string;
  category: string;
  content?: string;
  comments?: Comment[];
  reactions?: Reaction[];
  views?: number;
}

interface Comment {
  id: string;
  user: string;
  avatar: string;
  text: string;
  timestamp: string;
  likes: number;
}

interface Reaction {
  emoji: string;
  count: number;
  userReacted: boolean;
}

interface BeatItem {
  id: string;
  title: string;
  producer: string;
  imageUrl: string;
  price: number;
  isPremium: boolean;
  bpm: number;
  genre: string;
  audioUrl: string;
}

interface AudioPlayerState {
  currentTrack: MediaItem | BeatItem | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
}

// Enhanced Media Card Component with all interactions
const MediaCard = ({ 
  item, 
  onPlay,
  onLike,
  onDownload,
  onShare,
  type = 'media',
  currentTrack,
  isPlaying
}: { 
  item: MediaItem | Artist;
  onPlay: (item: MediaItem) => void;
  onLike?: (id: string) => void;
  onDownload?: (item: MediaItem) => void;
  onShare?: (item: MediaItem | Artist) => void;
  type?: 'media' | 'artist';
  currentTrack?: MediaItem | BeatItem | null;
  isPlaying?: boolean;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState((item as MediaItem).liked || false);
  const [isFollowing, setIsFollowing] = useState((item as Artist).isFollowing || false);
  
  const isCurrentTrack = currentTrack?.id === item.id;
  
  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    onLike?.(item.id.toString());
  };

  const handleFollow = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFollowing(!isFollowing);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (type === 'media' && (item as MediaItem).accessType === 'FREE') {
      onDownload?.(item as MediaItem);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShare?.(item);
  };

const getImageUrl = () => {
  if (type === 'artist') {
    return (
      (item as Artist).imageUrl ||
      (item as Artist).avatarUrl ||
      "/default-artist.png"
    );
  }
  return (
    (item as MediaItem).imageUrl ||
    (item as MediaItem).coverArt ||
    (item as MediaItem).artCoverUrl ||
    (item as MediaItem).thumbnailUrl ||
    "/default-cover.png"
  );
};

  const getTitle = () => {
    if (type === 'artist') {
      return (item as Artist).name;
    }
    return (item as MediaItem).title;
  };

const getSubtitle = () => {
  if (type === 'artist') {
    return `${Number((item as Artist).followers ?? 0).toLocaleString()} followers`;
  }
  const media = item as MediaItem;
  return (
    media.artist ||
    media.user?.displayName ||
    media.user?.username ||
    "Unknown Artist"
  );
};

  return (
    <motion.div
      className="relative bg-[#0a3747] bg-opacity-50 rounded-lg p-3 cursor-pointer flex-shrink-0 w-[160px] sm:w-[180px]"
      whileHover={{ y: -5 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => {
        if (type === 'media') {
          onPlay(item as MediaItem);
        }
      }}
    >
      <div className="relative aspect-square overflow-hidden rounded-lg">
        <Image
          src={getImageUrl()}
          alt={getTitle()}
          fill
          className="object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = type === 'artist' ? "/default-artist.png" : "/default-cover.png";
          }}
        />
        
        <AnimatePresence>
          {(isHovered || isCurrentTrack) && type === 'media' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center gap-2"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPlay(item as MediaItem);
                }}
                className="bg-[#e51f48] p-3 rounded-full"
              >
                {isCurrentTrack && isPlaying ? <FaPause size={16} /> : <FaPlay size={16} />}
              </button>
              {(item as MediaItem).accessType === 'FREE' && (
                <button 
                  onClick={handleDownload}
                  className="bg-green-600 p-3 rounded-full"
                >
                  <FaDownload size={14} />
                </button>
              )}
              <button 
                onClick={handleShare}
                className="bg-blue-600 p-3 rounded-full"
              >
                <FaShare size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-3">
        <h3 className="font-bold text-white truncate text-sm">{getTitle()}</h3>
        <p className="text-xs text-gray-300 truncate">{getSubtitle()}</p>
        
        <div className="flex justify-between items-center mt-2">
          {type === 'media' && (
            <>
              <span className="text-xs text-gray-400 flex items-center gap-2">
<span className="flex items-center gap-1">
  <FaHeadphones size={10} />
  {Number((item as MediaItem).plays ?? (item as MediaItem).views ?? 0).toLocaleString()}
</span>
<span className="flex items-center gap-1 ml-2">
  <FaHeart size={10} className="text-[#e51f48]" />
  {Number((item as MediaItem).likes ?? 0).toLocaleString()}
</span>
              </span>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleLike}
                  className="text-[#e51f48] hover:scale-110 transition-transform"
                >
                  {isLiked ? <FaHeart size={14} /> : <FaRegHeart size={14} />}
                </button>
                <button 
                  onClick={handleShare}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <FaShare size={12} />
                </button>
              </div>
            </>
          )}
          
{type === 'artist' && (
  <div className="flex items-center justify-between w-full">
<span className="text-xs text-gray-400 flex items-center gap-1">
  <FaUserFriends size={10} />
  {Number((item as Artist).followers ?? 0).toLocaleString()} followers
</span>
    <div className="flex items-center gap-1">
      <button 
        onClick={handleFollow}
        className={`
          rounded-full transition-colors text-xs px-2 py-1
          ${isFollowing 
            ? 'bg-[#e51f48] text-white' 
            : 'bg-[#0b2936] text-[#e51f48] hover:bg-[#e51f48] hover:text-white'
          }
        `}
      >
        {isFollowing ? 'Following' : 'Follow'}
      </button>
      <button 
        onClick={handleShare}
        className="text-gray-400 hover:text-white transition-colors p-1"
      >
        <FaShare size={10} />
      </button>
    </div>
  </div>
)}
        </div>
      </div>
    </motion.div>
  );
};

// Premium Media Card with Buy Button
const PremiumMediaCard = ({ 
  item, 
  onPlay,
  onPurchase,
  currentTrack,
  isPlaying
}: { 
  item: MediaItem;
  onPlay: (item: MediaItem) => void;
  onPurchase: (item: MediaItem) => void;
  currentTrack?: MediaItem | BeatItem | null;
  isPlaying?: boolean;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const isCurrent = currentTrack?.id === item.id;

  return (
    <motion.div
      className="relative bg-gradient-to-br from-amber-900/30 to-amber-800/20 rounded-lg p-3 cursor-pointer border border-amber-500/30 w-[160px] sm:w-[180px]"
      whileHover={{ y: -5 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => onPlay(item)}
    >
      <div className="relative aspect-square overflow-hidden rounded-lg">
        <Image
          src={
            item.imageUrl ||
            item.coverArt ||
            item.artCoverUrl ||
            item.thumbnailUrl ||
            "/default-cover.png"
          }
          alt={item.title}
          fill
          className="object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/default-cover.png";
          }}
        />
        
        <div className="absolute top-2 left-2 flex gap-1">
          <div className="flex items-center gap-1 px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs backdrop-blur-sm">
            <FaCrown className="w-3 h-3" />
            Premium
          </div>
        </div>
        
        <AnimatePresence>
          {(isHovered || isCurrent) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center gap-2"
            >
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onPlay(item);
                }}
                className="bg-[#e51f48] p-3 rounded-full"
              >
                {isCurrent && isPlaying ? <FaPause size={16} /> : <FaPlay size={16} />}
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onPurchase(item);
                }}
                className="bg-green-600 p-3 rounded-full text-white text-xs font-bold"
              >
                <FaShoppingCart size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-3">
        <h3 className="font-bold text-white truncate text-sm">{item.title}</h3>
        <p className="text-xs text-gray-400 truncate">
          {item.artist ||
           item.user?.displayName ||
           item.user?.username ||
           "Unknown Artist"}
        </p>
        
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <FaHeadphones size={10} />
            {Number(item.plays ?? item.views ?? 0).toLocaleString()}
          </span>
          <span className="text-sm font-bold text-amber-400">
            ZMW{item.price?.toFixed(2)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// Beat Card Component
const BeatCard = ({
  beat,
  onPlay,
  onPurchase,
  onShare,
  currentTrack,
  isPlaying
}: {
  beat: BeatItem;
  onPlay: (beat: BeatItem) => void;
  onPurchase: (beat: BeatItem) => void;
  onShare?: (beat: BeatItem) => void;
  currentTrack?: MediaItem | BeatItem | null;
  isPlaying?: boolean;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const isCurrent = currentTrack?.id === beat.id;

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShare?.(beat);
  };

  return (
    <motion.div
      className="relative bg-[#0a3747] bg-opacity-50 rounded-lg p-3 cursor-pointer flex-shrink-0 w-[160px] sm:w-[180px]"
      whileHover={{ y: -5 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => onPlay(beat)}
    >
      <div className="relative aspect-square overflow-hidden rounded-lg">
        <Image
          src={beat.imageUrl || "/default-cover.png"}
          alt={beat.title}
          fill
          className="object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/default-cover.png";
          }}
        />
        
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {beat.isPremium ? (
            <div className="flex items-center gap-1 px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs backdrop-blur-sm">
              <FaCrown className="w-3 h-3" />
              Premium
            </div>
          ) : (
            <div className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs backdrop-blur-sm">
              Free
            </div>
          )}
        </div>
        
        <AnimatePresence>
          {(isHovered || isCurrent) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center gap-2"
            >
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onPlay(beat);
                }}
                className="bg-[#e51f48] p-3 rounded-full"
              >
                {isCurrent && isPlaying ? <FaPause size={16} /> : <FaPlay size={16} />}
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onPurchase(beat);
                }}
                className="bg-green-600 p-3 rounded-full text-white text-xs font-bold"
              >
                <FaShoppingCart size={16} />
              </button>
              <button 
                onClick={handleShare}
                className="bg-blue-600 p-3 rounded-full"
              >
                <FaShare size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-3">
        <h3 className="font-bold text-white truncate text-sm">{beat.title}</h3>
        <p className="text-xs text-gray-300 truncate">{beat.producer}</p>
        
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-gray-400">
            {beat.bpm} BPM • {beat.genre}
          </span>
          
          <span className="text-sm font-bold text-[#e51f48]">
            ZMW{beat.price.toFixed(2)}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

// Enhanced News Card Component with Interactions
const NewsCard = ({ item, onNewsClick }: { item: NewsItem; onNewsClick: (item: NewsItem) => void }) => {
  const reactions: Reaction[] = item.reactions || [
    { emoji: '👍', count: 15, userReacted: false },
    { emoji: '❤️', count: 8, userReacted: false },
    { emoji: '🔥', count: 12, userReacted: false },
  ];

  const comments: Comment[] = item.comments || [
    {
      id: '1',
      user: 'MusicLover',
      avatar: '/default-avatar.png',
      text: 'Great news! Looking forward to this.',
      timestamp: '2 hours ago',
      likes: 3
    }
  ];

  return (
    <motion.div
      className="bg-[#0a3747]/70 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer"
      whileHover={{ y: -5 }}
      onClick={() => onNewsClick(item)}
    >
      <div className="relative h-48">
        <Image
          src={item.imageUrl}
          alt={item.title}
          fill
          className="object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/default-news.png";
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
          <span className="text-xs text-[#e51f48] font-medium">{item.category}</span>
          <h3 className="text-white font-bold line-clamp-1 text-sm sm:text-base">{item.title}</h3>
        </div>
      </div>
      <div className="p-4">
        <p className="text-sm text-gray-300 line-clamp-2 mb-3">{item.excerpt}</p>
        
        {/* Reactions */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {reactions.map((reaction, index) => (
              <button
                key={index}
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors ${
                  reaction.userReacted 
                    ? 'bg-[#e51f48]/20 text-[#e51f48]' 
                    : 'bg-gray-600/50 text-gray-400 hover:bg-gray-500/50'
                }`}
              >
                <span>{reaction.emoji}</span>
                <span>{reaction.count}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <button className="flex items-center gap-1 hover:text-white transition-colors">
              <FaComment size={10} />
              <span>{comments.length}</span>
            </button>
            <div className="flex items-center gap-1">
              <FaEye size={10} />
              <span>{item.views || 0}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-3 border-t border-gray-600/50">
          <span className="text-xs text-gray-400">{item.date}</span>
          <button 
            className="text-xs text-[#e51f48] hover:underline flex items-center gap-1"
            onClick={(e) => {
              e.stopPropagation();
              onNewsClick(item);
            }}
          >
            Read More <FaArrowRight size={8} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// Enhanced Welcome Notification Component for mobile
const WelcomeNotification = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-[#e51f48] to-[#ff4d6d] text-white p-4 rounded-lg shadow-lg max-w-xs sm:max-w-md mx-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm sm:text-lg mb-1">Welcome to Fwaya Music!</h3>
          <p className="text-xs sm:text-sm opacity-90 mb-2 leading-tight">
            Start earning as a reseller! Share music and earn commissions.
          </p>
          <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
            <button 
              onClick={() => window.location.href = '/auth?tab=reseller'}
              className="bg-white text-[#e51f48] px-2 sm:px-4 py-1 sm:py-2 rounded-full text-xs font-bold hover:bg-gray-100 transition-colors whitespace-nowrap"
            >
              Become Reseller
            </button>
            <button 
              onClick={() => window.location.href = '/auth'}
              className="border border-white text-white px-2 sm:px-4 py-1 sm:py-2 rounded-full text-xs font-bold hover:bg-white/10 transition-colors whitespace-nowrap"
            >
              Create Account
            </button>
          </div>
        </div>
        <button 
          onClick={() => setIsVisible(false)}
          className="text-white hover:text-gray-200 transition-colors flex-shrink-0 mt-1"
        >
          <FaTimes size={14} />
        </button>
      </div>
    </motion.div>
  );
};

// Enhanced Top Charts Section with proper play functionality
const TopChartsSection = ({ 
  songs, 
  onPlay,
  currentTrack,
  isPlaying 
}: { 
  songs: MediaItem[];
  onPlay: (item: MediaItem) => void;
  currentTrack: MediaItem | BeatItem | null;
  isPlaying: boolean;
}) => {
  return (
    <section className="mb-16 bg-gradient-to-br from-[#e51f48] to-[#ff4d6d] p-4 sm:p-6 rounded-xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">Top Charts</h2>
          <p className="text-gray-400 text-sm">Most played tracks this week</p>
        </div>
        <button className="text-sm text-[#e51f48] hover:underline">See all</button>
      </div>
      <div className="space-y-2">
        {songs.slice(0, 5).map((song, index) => {
          const isCurrent = currentTrack?.id === song.id;
          return (
            <div 
              key={song.id} 
              className="flex items-center gap-3 p-3 hover:bg-[#0a3747] rounded-lg cursor-pointer transition-colors group"
              onClick={() => onPlay(song)}
            >
              <div className="flex items-center w-full">
                <span className="text-gray-400 w-6 text-right mr-2 text-lg font-bold">
                  {index + 1}
                </span>
                <div className="relative h-12 w-12 flex-shrink-0">
                  <Image 
                    src={
                      song.imageUrl ||
                      song.coverArt ||
                      song.artCoverUrl ||
                      song.thumbnailUrl ||
                      "/default-cover.png"
                    }
                    alt={song.title} 
                    fill 
                    className="rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/default-cover.png";
                    }}
                  />
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <h3 className="font-medium truncate text-white group-hover:text-[#e51f48] transition-colors text-sm sm:text-base">
                    {song.title}
                  </h3>
                  <p className="text-xs text-gray-400 truncate">
                    {song.user?.displayName || song.user?.username || song.artist || "Unknown Artist"}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 ml-auto">
                <span className="text-xs text-gray-400 hidden sm:block">
                  {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
                </span>
                <button 
                  className={`p-2 rounded-full transition-all ${
                    isCurrent 
                      ? 'text-[#e51f48] opacity-100' 
                      : 'text-gray-400 opacity-0 group-hover:opacity-100 hover:text-[#e51f48]'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlay(song);
                  }}
                >
                  {isCurrent && isPlaying ? <FaPause size={12} /> : <FaPlay size={12} />}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

// Horizontal Scroll Section Component
const HorizontalScrollSection = ({ 
  title, 
  subtitle,
  items, 
  type = 'media',
  onPlay,
  onLike,
  onPurchase,
  onDownload,
  onShare,
  currentTrack,
  isPlaying
}: {
  title: string;
  subtitle?: string;
  items: (MediaItem | Artist | BeatItem | Playlist)[];
  type?: 'media' | 'artist' | 'beat' | 'premium' | 'playlist';
  onPlay: (item: MediaItem | BeatItem) => void;
  onLike?: (id: string) => void;
  onPurchase?: (item: MediaItem | BeatItem) => void;
  onDownload?: (item: MediaItem) => void;
  onShare?: (item: MediaItem | Artist | BeatItem) => void;
  currentTrack?: MediaItem | BeatItem | null;
  isPlaying?: boolean;
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const checkScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
    }
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const currentRef = scrollRef.current;
    if (currentRef) {
      currentRef.addEventListener('scroll', checkScroll);
      checkScroll();
      return () => {
        if (currentRef) {
          currentRef.removeEventListener('scroll', checkScroll);
        }
      };
    }
  }, [checkScroll]);

  return (
    <section className="mb-12 relative">
      <div className="flex justify-between items-center mb-6 px-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">{title}</h2>
          {subtitle && <p className="text-gray-400 mt-1 text-sm">{subtitle}</p>}
        </div>
        <button className="text-sm text-[#e51f48] hover:underline flex items-center gap-1">
          See all <FaArrowRight size={12} />
        </button>
      </div>
      
      <div className="relative">
        {showLeftArrow && (
          <button 
            onClick={() => scroll('left')}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 bg-[#0a3747] bg-opacity-80 p-2 sm:p-3 rounded-full hover:bg-opacity-100 transition-all"
          >
            <FaChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
        )}
        
<div 
  ref={scrollRef}
  className="flex overflow-x-auto scrollbar-hide gap-3 sm:gap-4 pb-4 px-2"
  style={{ scrollbarWidth: 'none' }}
>
  {items.map((item: MediaItem | Artist | BeatItem | Playlist) => (
    <div key={item.id} className="flex-shrink-0">
      {type === 'beat' ? (
        <BeatCard 
          beat={item as BeatItem} 
          onPlay={onPlay}
          onPurchase={onPurchase as (beat: BeatItem) => void}
          onShare={onShare as (beat: BeatItem) => void}
          currentTrack={currentTrack}
          isPlaying={isPlaying}
        />
      ) : type === 'premium' ? (
        <PremiumMediaCard 
          item={item as MediaItem}
          onPlay={onPlay}
          onPurchase={onPurchase as (item: MediaItem) => void}
          currentTrack={currentTrack}
          isPlaying={isPlaying}
        />
      ) : type === 'artist' ? (
        <MediaCard 
          item={item as Artist}
          onPlay={onPlay as (item: MediaItem) => void}
          onLike={onLike}
          onShare={onShare}
          type="artist"
          currentTrack={currentTrack}
          isPlaying={isPlaying}
        />
      ) : (
        <MediaCard 
          item={item as MediaItem}
          onPlay={onPlay as (item: MediaItem) => void}
          onLike={onLike}
          onDownload={onDownload}
          onShare={onShare}
          currentTrack={currentTrack}
          isPlaying={isPlaying}
        />
      )}
    </div>
  ))}
</div>
        
        {showRightArrow && (
          <button 
            onClick={() => scroll('right')}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 bg-[#0a3747] bg-opacity-80 p-2 sm:p-3 rounded-full hover:bg-opacity-100 transition-all"
          >
            <FaChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
        )}
      </div>
    </section>
  );
};


// Featured Playlists Carousel Component
// 1. Featured Playlists Carousel: make it horizontally scrollable and auto-scroll
const FeaturedPlaylistsCarousel = ({ 
  playlists, 
  onPlaylistClick 
}: { 
  playlists: Playlist[]; 
  onPlaylistClick: (playlist: Playlist) => void;
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  

  // Auto-scroll horizontally every 5s
  useEffect(() => {
    const interval = setInterval(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollBy({ left: 320, behavior: 'smooth' });
      }
      // If you want to track index, uncomment below:
      // setCurrentIndex(prev => (prev + 1) % playlists.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [playlists.length]);

return (
    <section className="mb-12">
      <div className="flex justify-between items-center mb-6 px-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">Featured Playlists</h2>
          <p className="text-gray-400 mt-1 text-sm">Curated collections for every mood</p>
        </div>
        <button className="text-sm text-[#e51f48] hover:underline flex items-center gap-1">
          View All <FaArrowRight size={12} />
        </button>
      </div>
      <div className="relative">
        <div
          ref={scrollRef}
          className="flex overflow-x-auto scrollbar-hide gap-4 px-2 pb-4"
          style={{ scrollbarWidth: 'none' }}
        >
          {playlists.map((playlist) => (
            <motion.div
              key={playlist.id}
              className="bg-gradient-to-br from-[#0a3747] to-[#0a1f29] rounded-xl overflow-hidden cursor-pointer group min-w-[320px] max-w-[320px]"
              whileHover={{ scale: 1.02 }}
              onClick={() => onPlaylistClick(playlist)}
            >
              <div className="flex h-24 sm:h-32">
                <div className="relative w-24 sm:w-32 flex-shrink-0">
                  <Image
                    src={playlist.coverUrl || playlist.imageUrl || "/default-playlist.png"}
                    alt={playlist.name}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/default-playlist.png";
                    }}
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      className="bg-[#e51f48] p-2 sm:p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <FaPlay size={14} className="sm:w-4 sm:h-4" />
                    </motion.button>
                  </div>
                </div>
                <div className="p-3 sm:p-4 flex-1">
                  <h3 className="font-bold text-white text-sm sm:text-lg mb-1 sm:mb-2">{playlist.name}</h3>
                  <p className="text-gray-300 text-xs line-clamp-2 mb-2">
                    {playlist.description || `${playlist.mediaCount} tracks`}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{playlist.mediaCount} songs</span>
                    <span>{playlist.type.toLowerCase().replace('_', ' ')}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Main Component
const GuestWelcome = () => {
  const [audioPlayerState, setAudioPlayerState] = useState<AudioPlayerState>({
    currentTrack: null,
    isPlaying: false,
    progress: 0,
    duration: 0
  });
  const [isPlayerVisible, setIsPlayerVisible] = useState(false);
  const [featuredAlbums, setFeaturedAlbums] = useState<MediaItem[]>([]);
  const [trendingSongs, setTrendingSongs] = useState<MediaItem[]>([]);
  const [favoriteArtists, setFavoriteArtists] = useState<Artist[]>([]);
  const [premiumContent, setPremiumContent] = useState<MediaItem[]>([]);
  const [freeContent, setFreeContent] = useState<MediaItem[]>([]);
  const [beatsForProducers, setBeatsForProducers] = useState<BeatItem[]>([]);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [featuredPlaylists, setFeaturedPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch homepage media sections
        const homepageSectionsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/media/homepage-sections`);
        const homepageSections = await homepageSectionsRes.json();

        // Fetch other data
        const [
          artistsRes,
          newsRes,
          playlistsRes
        ] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/artists`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/news`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/playlist?type=SYSTEM`)
        ]);

        const [artistsData, newsData, playlistsData] = await Promise.all([
          artistsRes.json(),
          newsRes.json(),
          playlistsRes.json()
        ]);

        const featuredSongs = homepageSections.featuredSongs || [];
const trendingSongs = homepageSections.trendingSongs || [];
const topCharts = homepageSections.topCharts || [];

setFeaturedAlbums(featuredSongs);
setTrendingSongs(trendingSongs);
setFeaturedPlaylists(playlistsData || []);
setFavoriteArtists(artistsData || []);
setNewsItems(newsData || []);
setBeatsForProducers(homepageSections.beats || []);

        // Process and set data
        setFeaturedAlbums(homepageSections.featuredSongs || []);
        setTrendingSongs(homepageSections.trendingSongs || []);
        setFeaturedPlaylists(playlistsData || []);
        setFavoriteArtists(artistsData || []);
        setNewsItems(newsData || []);
        
        
        // Filter premium content
// Alternative approach with type assertions
const allContent = [
  ...featuredSongs,
  ...trendingSongs,
  ...topCharts
] as MediaItem[];

setPremiumContent(allContent.filter(item => item.accessType === 'PREMIUM'));
setFreeContent((featuredSongs as MediaItem[]).filter(item => item.accessType === 'FREE'));

      } catch (err) {
        console.error("Failed to fetch data:", err);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const handlePlay = (item: MediaItem | BeatItem) => {
    if (audioPlayerState.currentTrack?.id === item.id) {
      // Toggle play/pause if same track
      setAudioPlayerState(prev => ({
        ...prev,
        isPlaying: !prev.isPlaying
      }));
    } else {
      // New track
      setAudioPlayerState({
        currentTrack: item,
        isPlaying: true,
        progress: 0,
        duration: (item as MediaItem).duration || 0
      });
      setIsPlayerVisible(true);
    }
  };

  const handlePlayPause = () => {
    setAudioPlayerState(prev => ({
      ...prev,
      isPlaying: !prev.isPlaying
    }));
  };

  const handleLike = (id: string) => {
    console.log('Liked item:', id);
    // Implement like functionality
  };

  const handlePurchase = (item: MediaItem | BeatItem) => {
    console.log('Purchase item:', item);
    // Implement purchase functionality
  };

  const handleDownload = (item: MediaItem) => {
    console.log('Download item:', item);
    // Implement download functionality
  };

  const handleShare = (item: MediaItem | Artist | BeatItem) => {
    console.log('Share item:', item);
    // Implement share functionality
  };

  const handleFollowArtist = (artistId: string) => {
    console.log('Follow artist:', artistId);
    // Implement follow functionality
  };

  const handleNewsClick = (newsItem: NewsItem) => {
    console.log('News item clicked:', newsItem);
    // Navigate to news detail page or open modal
    window.location.href = `/news/${newsItem.id}`;
  };

  const handlePlaylistClick = (playlist: Playlist & { entries?: { media: MediaItem }[] }) => {
    const mediaItems = playlist.entries?.map(entry => entry.media) || [];
    console.log(mediaItems);
    window.location.href = `/playlist/${playlist.id}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a1f29] to-[#0a3747] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#e51f48] mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading Fwaya Music...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1f29] to-[#0a3747]">
      {/* Welcome Notification */}
      <WelcomeNotification />

      {/* Enhanced Header for mobile */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#0a3747]/90 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto flex items-center justify-between p-3 sm:p-4">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2">
              <IoMdMusicalNote className="text-[#e51f48] text-xl sm:text-2xl" />
              <span className="text-white font-bold text-lg sm:text-xl">Fwaya Music</span>
            </div>
          </div>

          <div className="relative flex-1 max-w-md mx-2 sm:mx-4">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search songs, artists..."
              className="w-full bg-[#0a1f29] bg-opacity-70 rounded-full py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#e51f48] text-white placeholder-gray-400"
            />
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={() => window.location.href = '/auth'}
              className="bg-[#e51f48] hover:bg-[#ff4d6d] text-white px-4 py-2 sm:px-6 sm:py-2 rounded-full font-semibold transition-colors text-sm"
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 sm:pt-24 pb-32 px-3 sm:px-4 max-w-7xl mx-auto">
        {/* Hero Section */}
        <section className="relative py-8 sm:py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center text-white mb-12 sm:mb-16">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <div className="flex justify-center mb-4 sm:mb-6">
                  <div className="relative">
                    <Image
                      src="/Fwaya Music Icon-01.png"
                      alt="Fwaya Music"
                      width={80}
                      height={80}
                      className="rounded-lg"
                    />
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 rounded-lg border-2 border-[#e51f48] border-dashed"
                    ></motion.div>
                  </div>
                </div>
                
                <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 sm:mb-6">
                  Fwaya<span className="text-[#e51f48]">Music</span>
                </h1>
                
                <p className="text-lg sm:text-xl md:text-2xl mb-6 sm:mb-8 text-gray-300 max-w-2xl mx-auto px-4">
                  Discover the heartbeat of Zambian music. Stream, share, and connect with artists worldwide.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-8 sm:mb-12 px-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-[#e51f48] hover:bg-[#ff4d6d] text-white px-6 py-3 sm:px-8 sm:py-4 rounded-full font-bold text-base sm:text-lg flex items-center gap-2 transition-all w-full sm:w-auto justify-center"
                    onClick={() => window.location.href = '/auth'}
                  >
                    <FaPlay />
                    Start Listening Free
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="border-2 border-[#e51f48] text-[#e51f48] hover:bg-[#e51f48] hover:text-white px-6 py-3 sm:px-8 sm:py-4 rounded-full font-bold text-base sm:text-lg transition-all w-full sm:w-auto justify-center"
                    onClick={() => window.location.href = '/browse'}
                  >
                    Explore Music
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Featured Playlists Carousel */}
        {featuredPlaylists.length > 0 && (
          <FeaturedPlaylistsCarousel 
            playlists={featuredPlaylists} 
            onPlaylistClick={handlePlaylistClick}
          />
        )}

        {/* Featured Media */}
        <HorizontalScrollSection
          title="Featured Songs"
          subtitle="Handpicked content just for you"
          items={featuredAlbums.slice(0, 8)}
          onPlay={handlePlay}
          onLike={handleLike}
          onDownload={handleDownload}
          onShare={handleShare}
          currentTrack={audioPlayerState.currentTrack}
          isPlaying={audioPlayerState.isPlaying}
        />

        {/* Trending Now */}
        <HorizontalScrollSection
          title="Trending Now"
          subtitle="The hottest tracks everyone's listening to"
          items={trendingSongs.slice(0, 8)}
          onPlay={handlePlay}
          onLike={handleLike}
          onDownload={handleDownload}
          onShare={handleShare}
          currentTrack={audioPlayerState.currentTrack}
          isPlaying={audioPlayerState.isPlaying}
        />

        {/* Premium Content */}
{premiumContent.length > 0 && (
  <HorizontalScrollSection
    title="Premium Exclusives"
    subtitle="Unlock premium content for the best experience"
    items={premiumContent}
    type="premium"
    onPlay={handlePlay}
    onPurchase={handlePurchase}
    onShare={handleShare}
    currentTrack={audioPlayerState.currentTrack}
    isPlaying={audioPlayerState.isPlaying}
  />
)}

        {/* Favorite Artists */}
<HorizontalScrollSection
  title="Favourite Artists"
  subtitle="Follow your favorite artists"
  items={favoriteArtists}
  type="artist"
  onPlay={handlePlay}
  onLike={handleFollowArtist}
  onShare={handleShare}
  currentTrack={audioPlayerState.currentTrack}
  isPlaying={audioPlayerState.isPlaying}
/>
        {/* Free Content */}
        <HorizontalScrollSection
          title="Free Favourite Mix"
          subtitle="Enjoy these tracks without any cost"
          items={freeContent}
          onPlay={handlePlay}
          onLike={handleLike}
          onDownload={handleDownload}
          onShare={handleShare}
          currentTrack={audioPlayerState.currentTrack}
          isPlaying={audioPlayerState.isPlaying}
        />

        {/* Beats Marketplace */}
<HorizontalScrollSection
  title="Beats & Instruments"
  subtitle="Premium and free beats from beatmakers & producers"
  items={beatsForProducers}
  type="beat"
  onPlay={handlePlay}
  onPurchase={handlePurchase}
  onShare={handleShare}
  currentTrack={audioPlayerState.currentTrack}
  isPlaying={audioPlayerState.isPlaying}
/>

        {/* Top Charts Section */}
        <TopChartsSection 
          songs={trendingSongs}
          onPlay={handlePlay}
          currentTrack={audioPlayerState.currentTrack}
          isPlaying={audioPlayerState.isPlaying}
        />

        {/* Latest News */}
<section className="mb-16">
  <div className="flex justify-between items-center mb-6 px-2">
    <div>
      <h2 className="text-xl sm:text-2xl font-bold text-white">Latest News & Updates</h2>
      <p className="text-gray-400 mt-1 text-sm">Stay updated with the latest from Fwaya Music</p>
    </div>
    <button className="text-sm text-[#e51f48] hover:underline flex items-center gap-1">
      View All <FaArrowRight size={12} />
    </button>
  </div>
  <div
    className="flex overflow-x-auto scrollbar-hide gap-4 px-2 pb-4"
    style={{ scrollbarWidth: 'none' }}
  >
    {newsItems.map((newsItem) => (
      <div key={newsItem.id} className="min-w-[320px] max-w-[320px]">
        <NewsCard item={newsItem} onNewsClick={handleNewsClick} />
      </div>
    ))}
  </div>
</section>
      </main>

      {/* Player */}
      <AnimatePresence>
        {isPlayerVisible && audioPlayerState.currentTrack && (
          <Player 
            track={{
              id: audioPlayerState.currentTrack.id.toString(),
              title: audioPlayerState.currentTrack.title,
              artist: 'artist' in audioPlayerState.currentTrack ? 
                audioPlayerState.currentTrack.artist : 
                'producer' in audioPlayerState.currentTrack ? 
                (audioPlayerState.currentTrack as BeatItem).producer : 
                "Unknown Artist",
              imageUrl: audioPlayerState.currentTrack.imageUrl || "/default-cover.png",
              audioUrl: audioPlayerState.currentTrack.audioUrl || (audioPlayerState.currentTrack as MediaItem).url
            }}
            isPlaying={audioPlayerState.isPlaying}
            onPlayPause={handlePlayPause}
            onClose={() => {
              setIsPlayerVisible(false);
              setAudioPlayerState(prev => ({ ...prev, isPlaying: false }));
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default GuestWelcome;