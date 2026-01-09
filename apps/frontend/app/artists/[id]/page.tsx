'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  FaPlay,
  FaPause,
  FaHeart,
  FaRegHeart,
  FaShare,
  FaUserFriends,
  FaMusic,
  FaHeadphones,
  FaEnvelope,
  FaGlobe,
  FaArrowLeft,
  FaDownload,
  FaCrown
} from 'react-icons/fa';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { formatDuration, formatFileSize } from '@/lib/utils';

interface Artist {
  id: string;
  name: string;
  imageUrl: string;
  avatarUrl: string;
  bio?: string;
  website?: string;
  followers: number;
  isVerified: boolean;
  isFollowing: boolean;
  mediaCount: number;
  media: MediaItem[];
  totalPlays: number;
}

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
  accessType: 'FREE' | 'PREMIUM' | 'PAY_PER_VIEW';
  price?: number;
  currency?: string;
  isExplicit: boolean;
  downloadCount: number;
  shareCount: number;
  tags: string[];
  playCount?: number;
  user?: {
    id: number;
    username?: string;
    displayName?: string;
    avatarUrl?: string;
    isVerified?: boolean;
  };
}

export default function ArtistPage() {
  const params = useParams();
  const router = useRouter();
  const { currentTrack, isPlaying, playTrack } = useAudioPlayer();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArtist = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/artists/${params.id}`);
        if (!response.ok) {
          throw new Error('Artist not found');
        }
        const data = await response.json();
        setArtist(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load artist');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchArtist();
    }
  }, [params.id]);

  const handlePlaySong = (song: MediaItem) => {
    playTrack({
      id: song.id.toString(),
      title: song.title,
      artist: song.artist,
      imageUrl: song.coverArt,
      audioUrl: song.url
    });
  };

  const handleFollow = () => {
    // TODO: Implement follow functionality
    setArtist(prev => prev ? { ...prev, isFollowing: !prev.isFollowing } : null);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: artist?.name,
        text: `Check out ${artist?.name} on Fwaya Music`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      // TODO: Show toast notification
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a1f29] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e51f48]"></div>
      </div>
    );
  }

  if (error || !artist) {
    return (
      <div className="min-h-screen bg-[#0a1f29] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Artist Not Found</h1>
          <button
            onClick={() => router.back()}
            className="bg-[#e51f48] text-white px-6 py-2 rounded-lg hover:bg-[#c41e3d] transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a1f29]">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a3747]/50 to-[#0a1f29]/90"></div>
        <div className="relative z-10 p-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-white hover:text-[#e51f48] transition-colors mb-6"
          >
            <FaArrowLeft size={16} />
            Back
          </button>

          <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
            <div className="relative">
              <Image
                src={artist.avatarUrl}
                alt={artist.name}
                width={200}
                height={200}
                className="rounded-full object-cover shadow-2xl"
              />
              {artist.isVerified && (
                <div className="absolute -bottom-2 -right-2 bg-[#e51f48] rounded-full p-2">
                  <FaCrown size={12} className="text-white" />
                </div>
              )}
            </div>

            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-2">{artist.name}</h1>
              <div className="flex flex-wrap justify-center md:justify-start gap-4 text-gray-300 mb-4">
                <span className="flex items-center gap-1">
                  <FaUserFriends size={14} />
                  {artist.followers.toLocaleString()} followers
                </span>
                <span className="flex items-center gap-1">
                  <FaMusic size={14} />
                  {artist.mediaCount} songs
                </span>
                <span className="flex items-center gap-1">
                  <FaHeadphones size={14} />
                  {artist.totalPlays.toLocaleString()} plays
                </span>
              </div>

              {artist.bio && (
                <p className="text-gray-300 max-w-2xl mb-4">{artist.bio}</p>
              )}

              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <button
                  onClick={handleFollow}
                  className={`px-6 py-2 rounded-full font-medium transition-colors ${
                    artist.isFollowing
                      ? 'bg-[#e51f48] text-white hover:bg-[#c41e3d]'
                      : 'bg-white text-black hover:bg-gray-200'
                  }`}
                >
                  {artist.isFollowing ? 'Following' : 'Follow'}
                </button>

                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#0b2936] text-white hover:bg-[#0c2f3d] transition-colors"
                >
                  <FaShare size={14} />
                  Share
                </button>

                {artist.website && (
                  <a
                    href={artist.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#0b2936] text-white hover:bg-[#0c2f3d] transition-colors"
                  >
                    <FaGlobe size={14} />
                    Website
                  </a>
                )}

                <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#0b2936] text-white hover:bg-[#0c2f3d] transition-colors">
                  <FaEnvelope size={14} />
                  Contact
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Songs List */}
      <div className="p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Songs</h2>

        <div className="space-y-2">
          {artist.media.map((song, index) => (
            <motion.div
              key={song.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-4 p-4 rounded-lg bg-[#0a3747]/30 hover:bg-[#0a3747]/50 transition-colors group"
            >
              <div className="relative flex-shrink-0">
                <Image
                  src={song.coverArt || '/default-cover.png'}
                  alt={song.title}
                  width={50}
                  height={50}
                  className="rounded object-cover"
                />
                <button
                  onClick={() => handlePlaySong(song)}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded"
                >
                  {currentTrack?.id === song.id.toString() && isPlaying ? (
                    <FaPause size={16} className="text-white" />
                  ) : (
                    <FaPlay size={16} className="text-white" />
                  )}
                </button>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-white truncate">{song.title}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span>{formatDuration(song.duration)}</span>
                  <span className="flex items-center gap-1">
                    <FaHeadphones size={10} />
                    {(song.playCount || 0).toLocaleString()}
                  </span>
                  {song.accessType === 'PREMIUM' && (
                    <span className="flex items-center gap-1 text-[#e51f48]">
                      <FaCrown size={10} />
                      Premium
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button className="text-gray-400 hover:text-[#e51f48] transition-colors">
                  <FaRegHeart size={16} />
                </button>

                {song.accessType === 'FREE' && (
                  <button className="text-gray-400 hover:text-[#e51f48] transition-colors">
                    <FaDownload size={16} />
                  </button>
                )}

                <button className="text-gray-400 hover:text-[#e51f48] transition-colors">
                  <FaShare size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {artist.media.length === 0 && (
          <div className="text-center py-12">
            <FaMusic size={48} className="text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No songs available yet</p>
          </div>
        )}
      </div>
    </div>
  );
}