'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  FaPlay,
  FaPause,
  FaRegHeart,
  FaHeart,
  FaShare,
  FaUserFriends,
  FaMusic,
  FaHeadphones,
  FaEnvelope,
  FaGlobe,
  FaArrowLeft,
  FaDownload,
  FaCrown,
  FaPlus,
  FaListUl,
  FaComment,
  FaStar
} from 'react-icons/fa';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { useAuth } from '@/context/AuthContext';
import { formatDuration } from '@/lib/utils';

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
  const [likedSongs, setLikedSongs] = useState<Set<number>>(new Set());
  const { getToken } = useAuth();
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [selectedSong, setSelectedSong] = useState<MediaItem | null>(null);

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

  useEffect(() => {
    const fetchFollowStatus = async () => {
      if (!params.id) return;
      const token = await getToken();
      if (!token) return;

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/follow/status/${params.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setArtist((prev) => (prev ? { ...prev, isFollowing: data.isFollowing } : prev));
        }
      } catch (err) {
        console.warn('Unable to load follow status:', err);
      }
    };

    fetchFollowStatus();
  }, [params.id, getToken]);

  const handlePlaySong = (song: MediaItem) => {
    playTrack({
      id: song.id.toString(),
      title: song.title,
      artist: song.artist,
      imageUrl: song.coverArt,
      audioUrl: song.url
    });
  };

  const handleFollow = async () => {
    if (!artist) return;

    const token = await getToken();
    if (!token) {
      alert('Please sign in to follow artists.');
      return;
    }

    const method = artist.isFollowing ? 'DELETE' : 'POST';
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/follow/${artist.id}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error('Failed to update follow status', response.statusText);
      return;
    }

    setArtist((prev) =>
      prev
        ? {
            ...prev,
            isFollowing: !prev.isFollowing,
            followers: prev.followers + (prev.isFollowing ? -1 : 1),
          }
        : prev,
    );
  };

  const handleLikeSong = (songId: number) => {
    setLikedSongs(prev => {
      const newLiked = new Set(prev);
      if (newLiked.has(songId)) {
        newLiked.delete(songId);
      } else {
        newLiked.add(songId);
      }
      return newLiked;
    });
    // TODO: API call to like/unlike song
  };

  const handleShareSong = (song: MediaItem) => {
    if (navigator.share) {
      navigator.share({
        title: song.title,
        text: `Check out "${song.title}" by ${song.artist} on Fwaya`,
        url: `${window.location.origin}/songs/${song.id}`
      });
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/songs/${song.id}`);
      // TODO: Show toast notification
    }
  };

  const handleDownloadSong = (song: MediaItem) => {
    // TODO: Implement download functionality
    if (song.accessType === 'FREE') {
      // Trigger download
      console.log('Downloading:', song.title);
    } else {
      // Show premium upgrade prompt
      console.log('Premium required for download');
    }
  };

  const handleAddToPlaylist = (song: MediaItem) => {
    setSelectedSong(song);
    setShowPlaylistModal(true);
    // TODO: Implement playlist modal
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: artist?.name,
        text: `Check out ${artist?.name} on Fwaya`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      // TODO: Show toast notification
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error || !artist) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Artist Not Found</h1>
          <button
            onClick={() => router.back()}
            className="bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-400 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="relative overflow-hidden">
        <div className="relative p-6 max-w-7xl mx-auto pb-32">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between mb-10">
            <div className="space-y-3">
              <p className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-1 text-xs uppercase tracking-[0.24em] text-purple-300">Artist</p>
              <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">{artist.name}</h1>
              <p className="max-w-2xl text-gray-400">
                {artist.followers.toLocaleString()} followers • {artist.mediaCount} songs • {artist.totalPlays.toLocaleString()} plays
                {artist.isVerified && ' • Verified Artist'}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleFollow}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold shadow-lg transition ${
                  artist.isFollowing
                    ? 'bg-purple-500 text-white shadow-purple-500/20 hover:bg-purple-400'
                    : 'bg-white text-black hover:bg-gray-200'
                }`}
              >
                {artist.isFollowing ? 'Following' : 'Follow'}
              </button>
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-3 text-sm font-medium text-white hover:bg-white/15 transition"
              >
                <FaShare className="w-4 h-4" />
                Share
              </button>
            </div>
          </div>

          {/* Artist Avatar and Bio Section */}
          <div className="flex flex-col lg:flex-row gap-8 mb-12">
            <div className="relative flex-shrink-0">
              <Image
                src={artist.avatarUrl}
                alt={artist.name}
                width={300}
                height={300}
                className="rounded-[32px] object-cover shadow-2xl"
              />
              {artist.isVerified && (
                <div className="absolute -bottom-4 -right-4 bg-purple-500 rounded-full p-3 shadow-lg">
                  <FaCrown size={16} className="text-white" />
                </div>
              )}
            </div>

            <div className="flex-1 space-y-6">
              {artist.bio && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-white">About</h3>
                  <p className="text-gray-300 leading-relaxed max-w-2xl">{artist.bio}</p>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/5 rounded-2xl p-4">
                  <div className="text-2xl font-bold text-white">{artist.followers.toLocaleString()}</div>
                  <div className="text-sm text-gray-400">Followers</div>
                </div>
                <div className="bg-white/5 rounded-2xl p-4">
                  <div className="text-2xl font-bold text-white">{artist.mediaCount}</div>
                  <div className="text-sm text-gray-400">Songs</div>
                </div>
                <div className="bg-white/5 rounded-2xl p-4">
                  <div className="text-2xl font-bold text-white">{artist.totalPlays.toLocaleString()}</div>
                  <div className="text-sm text-gray-400">Total Plays</div>
                </div>
                <div className="bg-white/5 rounded-2xl p-4">
                  <div className="text-2xl font-bold text-white">
                    {artist.media.reduce((sum, song) => sum + (song.likes || 0), 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-400">Total Likes</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {artist.website && (
                  <a
                    href={artist.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/15 transition"
                  >
                    <FaGlobe size={14} />
                    Website
                  </a>
                )}
                <button className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/15 transition">
                  <FaEnvelope size={14} />
                  Contact
                </button>
              </div>
            </div>
          </div>

          {/* Songs Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-sm text-gray-400 mb-4">
              <span className="inline-flex h-2 w-2 rounded-full bg-purple-400" />
              <span>Songs</span>
              <span className="text-white/70">({artist.media.length})</span>
            </div>

            <div className="grid gap-4">
              {artist.media.map((song, index) => (
                <div
                  key={song.id}
                  className="group flex items-center gap-4 rounded-2xl bg-white/5 p-4 hover:bg-white/10 transition-all duration-300"
                >
                  <div className="relative flex-shrink-0">
                    <Image
                      src={song.coverArt || '/default-cover.png'}
                      alt={song.title}
                      width={60}
                      height={60}
                      className="rounded-xl object-cover"
                    />
                    <button
                      onClick={() => handlePlaySong(song)}
                      className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"
                    >
                      {currentTrack?.id === song.id.toString() && isPlaying ? (
                        <FaPause size={20} className="text-white" />
                      ) : (
                        <FaPlay size={20} className="text-white" />
                      )}
                    </button>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white truncate mb-1">{song.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span>{formatDuration(song.duration)}</span>
                      <span className="flex items-center gap-1">
                        <FaHeadphones size={12} />
                        {(song.playCount || song.views || 0).toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <FaHeart size={12} />
                        {song.likes || 0}
                      </span>
                      {song.accessType === 'PREMIUM' && (
                        <span className="flex items-center gap-1 text-purple-400">
                          <FaCrown size={12} />
                          Premium
                        </span>
                      )}
                      {song.isExplicit && (
                        <span className="text-xs bg-gray-600 px-2 py-0.5 rounded">E</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleLikeSong(song.id)}
                      className={`transition-colors ${likedSongs.has(song.id) ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                    >
                      {likedSongs.has(song.id) ? <FaHeart size={16} /> : <FaRegHeart size={16} />}
                    </button>
                    <button
                      onClick={() => handleShareSong(song)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <FaShare size={16} />
                    </button>
                    <button
                      onClick={() => handleDownloadSong(song)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <FaDownload size={16} />
                    </button>
                    <button
                      onClick={() => handleAddToPlaylist(song)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <FaPlus size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
