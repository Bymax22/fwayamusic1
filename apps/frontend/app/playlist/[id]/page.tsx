'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  FaPlay,
  FaPause,
  FaShare,
  FaUserFriends,
  FaMusic,
  FaHeadphones,
  FaArrowLeft,
  FaDownload,
  FaHeart,
  FaRegHeart
} from 'react-icons/fa';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { formatDuration } from '@/lib/utils';
import Waveform from '@/components/Waveform';

// Track interface
interface Track {
  id: string | number;
  title: string;
  artist: string;
  imageUrl?: string;
  audioUrl?: string;
  url?: string;
  coverArt?: string;
  duration?: number;
  isDRMProtected?: boolean;
}

interface Playlist {
  id: number;
  name: string;
  description?: string;
  coverUrl?: string;
  isPublic: boolean;
  type: 'SYSTEM' | 'USER' | 'SMART' | 'RADIO';
  createdAt: string;
  updatedAt: string;
  entries: {
    id: number;
    position: number;
    media: {
      id: number;
      title: string;
      url: string;
      duration: number;
      format: string;
      createdAt: string;
      coverArt: string;
      views: number;
      likes: number;
      genre?: string;
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
    };
  }[];
}

const PlaylistDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const { currentTrack, isPlaying, playTrack } = useAudioPlayer();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    const fetchPlaylist = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/playlist/${params.id}`);
        if (!response.ok) {
          throw new Error('Playlist not found');
        }
        const data = await response.json();
        setPlaylist(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load playlist');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchPlaylist();
    }
  }, [params.id]);

  const handlePlay = (track: Track) => {
    playTrack(track);
  };

  const handlePlayAll = () => {
    if (playlist?.entries && playlist.entries.length > 0) {
      const firstTrack = {
        id: playlist.entries[0].media.id.toString(),
        title: playlist.entries[0].media.title,
        artist: playlist.entries[0].media.user?.displayName || playlist.entries[0].media.user?.username || "Unknown Artist",
        imageUrl: playlist.entries[0].media.coverArt || playlist.entries[0].media.artCoverUrl || playlist.entries[0].media.imageUrl || "/default-cover.png",
        audioUrl: playlist.entries[0].media.audioUrl || playlist.entries[0].media.url,
        duration: playlist.entries[0].media.duration,
        isDRMProtected: playlist.entries[0].media.isDRMProtected
      };
      handlePlay(firstTrack);
    }
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    // TODO: Implement like functionality
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: playlist?.name,
        text: `Check out this playlist: ${playlist?.name}`,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a1f29] to-[#0a3747] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e51f48] mx-auto mb-3"></div>
          <p className="text-white">Loading playlist...</p>
        </div>
      </div>
    );
  }

  if (error || !playlist) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a1f29] to-[#0a3747] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Playlist Not Found</h1>
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

  const totalDuration = playlist.entries.reduce((total, entry) => total + (entry.media.duration || 0), 0);
  const totalPlays = playlist.entries.reduce((total, entry) => total + (entry.media.plays || 0), 0);

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
            Back
          </button>

          <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
            {/* Playlist Cover */}
            <div className="relative w-48 h-48 md:w-64 md:h-64 rounded-lg overflow-hidden shadow-2xl">
              <Image
                src={playlist.coverUrl || "/default-playlist.png"}
                alt={playlist.name}
                fill
                className="object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/default-playlist.png";
                }}
              />
            </div>

            {/* Playlist Info */}
            <div className="flex-1 text-white">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium px-2 py-1 bg-[#e51f48] rounded-full">
                  {playlist.type}
                </span>
                {!playlist.isPublic && (
                  <span className="text-sm font-medium px-2 py-1 bg-gray-600 rounded-full">
                    Private
                  </span>
                )}
              </div>

              <h1 className="text-3xl md:text-5xl font-bold mb-2">{playlist.name}</h1>

              {playlist.description && (
                <p className="text-gray-300 text-lg mb-4 max-w-2xl">{playlist.description}</p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-6">
                <span className="flex items-center gap-1">
                  <FaMusic size={14} />
                  {playlist.entries.length} songs
                </span>
                <span className="flex items-center gap-1">
                  <FaHeadphones size={14} />
                  {formatDuration(totalDuration)}
                </span>
                <span className="flex items-center gap-1">
                  <FaUserFriends size={14} />
                  {totalPlays.toLocaleString()} plays
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handlePlayAll}
                  className="bg-[#e51f48] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#d1183a] transition-colors flex items-center gap-2"
                >
                  <FaPlay size={16} />
                  Play All
                </button>

                <button
                  onClick={handleLike}
                  className="bg-[#0a3747] text-white p-3 rounded-full hover:bg-[#0b2936] transition-colors"
                >
                  {isLiked ? <FaHeart size={16} /> : <FaRegHeart size={16} />}
                </button>

                <button
                  onClick={handleShare}
                  className="bg-[#0a3747] text-white p-3 rounded-full hover:bg-[#0b2936] transition-colors"
                >
                  <FaShare size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tracks List */}
      <div className="px-6 pb-8">
        <div className="bg-[#0a3747]/50 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-700">
            <h2 className="text-xl font-bold text-white">Tracks</h2>
          </div>

          <div className="divide-y divide-gray-700">
            {playlist.entries
              .sort((a, b) => a.position - b.position)
              .map((entry, index) => {
                const track = entry.media;
                const isCurrent = currentTrack?.id === track.id.toString();

                return (
                  <motion.div
                    key={entry.id}
                    className="flex items-center gap-4 p-4 hover:bg-[#0b2936] transition-colors group"
                    whileHover={{ backgroundColor: 'rgba(11, 41, 54, 0.5)' }}
                  >
                    {/* Track Number / Play Button */}
                    <div className="w-8 flex justify-center">
                      {isCurrent && isPlaying ? (
                        <FaPause
                          size={16}
                          className="text-[#e51f48] cursor-pointer"
                          onClick={() => handlePlay({
                            id: track.id.toString(),
                            title: track.title,
                            artist: track.user?.displayName || track.user?.username || "Unknown Artist",
                            imageUrl: track.coverArt || track.artCoverUrl || track.imageUrl || "/default-cover.png",
                            audioUrl: track.audioUrl || track.url,
                            duration: track.duration,
                            isDRMProtected: track.isDRMProtected
                          })}
                        />
                      ) : (
                        <div className="flex items-center justify-center w-6 h-6">
                          <span className="text-gray-400 group-hover:hidden">{index + 1}</span>
                          <FaPlay
                            size={12}
                            className="text-white hidden group-hover:block cursor-pointer hover:text-[#e51f48]"
                            onClick={() => handlePlay({
                              id: track.id.toString(),
                              title: track.title,
                              artist: track.user?.displayName || track.user?.username || "Unknown Artist",
                              imageUrl: track.coverArt || track.artCoverUrl || track.imageUrl || "/default-cover.png",
                              audioUrl: track.audioUrl || track.url,
                              duration: track.duration,
                              isDRMProtected: track.isDRMProtected
                            })}
                          />
                        </div>
                      )}
                    </div>

                    {/* Track Cover */}
                    <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0">
                      <Image
                        src={track.coverArt || track.artCoverUrl || track.imageUrl || "/default-cover.png"}
                        alt={track.title}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/default-cover.png";
                        }}
                      />
                    </div>

                    {/* Track Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-medium truncate ${isCurrent ? 'text-[#e51f48]' : 'text-white'}`}>
                        <span className="inline-flex items-center gap-2">
                          {isCurrent ? (
                            // show waveform when this is the playing track
                            //@ts-ignore
                            <Waveform playing={isCurrent && isPlaying} />
                          ) : null}
                          <span>{track.title}</span>
                        </span>
                      </h3>
                      <p className="text-sm text-gray-400 truncate">
                        {track.user?.displayName || track.user?.username || "Unknown Artist"}
                      </p>
                    </div>

                    {/* Track Stats */}
                    <div className="hidden md:flex items-center gap-4 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <FaHeadphones size={12} />
                        {track.plays?.toLocaleString() || 0}
                      </span>
                      <span>{formatDuration(track.duration || 0)}</span>
                    </div>

                    {/* Access Type */}
                    {track.accessType === 'PREMIUM' && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs">
                        <FaDownload size={10} />
                        Premium
                      </div>
                    )}
                  </motion.div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaylistDetailPage;