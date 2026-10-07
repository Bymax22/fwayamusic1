'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import AvatarImage from '@/components/AvatarImage';
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
import PlaylistPickerModal from '@/components/PlaylistPickerModal';
import Waveform from '@/components/Waveform';
import ScrollingTrackTitle from '@/components/ScrollingTrackTitle';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { useAuth } from '@/context/AuthContext';
import { createMediaSlug, formatAddedTime, formatDuration } from '@/lib/utils';
import VerifiedBadge from '@/components/VerifiedBadge';

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
  addedAt?: string;
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
  const { getToken, user } = useAuth();
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [selectedSong, setSelectedSong] = useState<MediaItem | null>(null);

  useEffect(() => {
    const fetchArtist = async () => {
      try {
        const base = process.env.NEXT_PUBLIC_API_URL || '';
        const response = await fetch(`${base}/api/v1/artists/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setArtist(normalizeArtist(data));
        } else {
          // Try falling back to users endpoint (covers producers or generic users)
          const userRes = await fetch(`${base}/api/v1/users/${params.id}`);
          if (userRes.ok) {
            const u = await userRes.json();
            const media = Array.isArray(u.media)
              ? u.media.map((m: any) => normalizeArtistMedia(m, u))
              : [];

            const mapped = {
              id: u.id?.toString(),
              name: u.displayName || u.username || u.artistName || 'Unknown',
              imageUrl: u.avatarUrl || '/default-artist.png',
              avatarUrl: u.avatarUrl || '/default-artist.png',
              bio: u.bio || u.description || '',
              website: u.website || '',
              followers: (u._count && u._count.followers) || (Array.isArray(u.followers) ? u.followers.length : (u.followersCount || 0)) || 0,
              isVerified: u.status === 'VERIFIED' || u.isVerified || u.verified || false,
              isFollowing: false,
              mediaCount: (u._count && u._count.media) || media.length,
              media,
              totalPlays: media.reduce((sum: number, m: any) => sum + (m.playCount || 0), 0)
            } as any;

            setArtist(normalizeArtist(mapped));
          } else {
            throw new Error('Artist not found');
          }
        }
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

  const normalizeArtistMedia = (media: any, artistUser?: any): MediaItem => ({
    ...media,
    id: Number(media.id),
    title: media.title || 'Untitled track',
    artist: media.artist || artistUser?.displayName || artistUser?.username || artistUser?.artistName || 'Unknown Artist',
    url: media.url || media.audioUrl || media.fileUrl || '',
    duration: Number(media.duration) || 0,
    createdAt: media.createdAt || media.created_at || media.addedAt || media.added_at || '',
    addedAt: media.addedAt || media.added_at || media.createdAt || media.created_at || '',
    coverArt: media.coverArt || media.artCoverUrl || media.art_cover_url || media.thumbnailUrl || media.thumbnail || '/default-cover.jpg',
    views: Number(media.playCount ?? media.views ?? media.viewCount) || 0,
    playCount: Number(media.playCount ?? media.views ?? media.viewCount) || 0,
    likes: Array.isArray(media.interactions)
      ? media.interactions.filter((interaction: any) => interaction?.liked).length
      : Number(media.likes ?? media.likeCount) || 0,
    accessType: media.accessType || 'FREE',
    isExplicit: Boolean(media.isExplicit),
    downloadCount: Number(media.downloadCount) || 0,
    shareCount: Number(media.shareCount) || 0,
    tags: Array.isArray(media.tags) ? media.tags : [],
  });

  const normalizeArtist = (raw: any): Artist => {
    const rawMedia = Array.isArray(raw?.media) ? raw.media : Array.isArray(raw?.tracks) ? raw.tracks : [];
    const media = rawMedia.map((item: any) => normalizeArtistMedia(item, raw));
    return {
      ...raw,
      id: String(raw?.id ?? params.id),
      name: raw?.name || raw?.displayName || raw?.artistName || raw?.username || 'Unknown Artist',
      imageUrl: raw?.imageUrl || raw?.avatarUrl || raw?.profileImage || '/default-artist.png',
      avatarUrl: raw?.avatarUrl || raw?.imageUrl || raw?.profileImage || '/default-artist.png',
      followers: Number(raw?.followersCount ?? (Array.isArray(raw?.followers) ? raw.followers.length : raw?.followers)) || 0,
      isVerified: Boolean(raw?.isVerified || raw?.verified || raw?.status === 'VERIFIED'),
      isFollowing: Boolean(raw?.isFollowing),
      mediaCount: Number(raw?.mediaCount ?? raw?._count?.media) || media.length,
      media,
      totalPlays: Number(raw?.totalPlays) || media.reduce((sum: number, item: MediaItem) => sum + (item.playCount || 0), 0),
    } as Artist;
  };

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

  const handleLikeSong = async (songId: number) => {
    const token = await getToken();
    if (!token) {
      alert('Please sign in to like tracks.');
      return;
    }
    const wasLiked = likedSongs.has(songId);
    setLikedSongs(prev => {
      const newLiked = new Set(prev);
      if (wasLiked) {
        newLiked.delete(songId);
      } else {
        newLiked.add(songId);
      }
      return newLiked;
    });
    setArtist((prev) => prev ? {
      ...prev,
      media: prev.media.map((song) => song.id === songId
        ? { ...song, likes: Math.max(0, song.likes + (wasLiked ? -1 : 1)) }
        : song),
    } : prev);
    try {
      const response = await fetch(`/api/media/${songId}/interact/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`Like request failed (${response.status}).`);
      const result = await response.json();
      if (typeof result.likes === 'number') {
        setArtist((prev) => prev ? {
          ...prev,
          media: prev.media.map((song) => song.id === songId ? { ...song, likes: result.likes } : song),
        } : prev);
      }
    } catch (error) {
      setLikedSongs((prev) => {
        const reverted = new Set(prev);
        if (wasLiked) reverted.add(songId);
        else reverted.delete(songId);
        return reverted;
      });
      setArtist((prev) => prev ? {
        ...prev,
        media: prev.media.map((song) => song.id === songId
          ? { ...song, likes: Math.max(0, song.likes + (wasLiked ? 1 : -1)) }
          : song),
      } : prev);
      console.error('Failed to update track like:', error);
      alert(error instanceof Error ? error.message : 'Could not update track like.');
    }
  };

  const handleShareSong = (song: MediaItem) => {
    if (navigator.share) {
      navigator.share({
        title: song.title,
        text: `Check out "${song.title}" by ${song.artist} on Fwaya`,
        url: `${window.location.origin}/track/${createMediaSlug(song.title, song.id)}`
      });
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/track/${createMediaSlug(song.title, song.id)}`);
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple/75"></div>
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
            className="bg-purple/75 text-white px-6 py-2 rounded-lg hover:bg-purple/60 transition-colors"
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
        <div className="relative mx-auto max-w-7xl px-4 py-5 pb-32 sm:p-6">
          <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <p className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-1 text-xs uppercase tracking-[0.24em] text-purple/45">Artist</p>
              <h1 className="flex flex-wrap items-center gap-2 text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
                <span>{artist.name}</span>
                {artist.isVerified && (
                  <VerifiedBadge size="lg" title="Verified artist" />
                )}
              </h1>
              <p className="max-w-2xl text-white/60">
                {artist.followers.toLocaleString()} followers • {artist.mediaCount} songs • {artist.totalPlays.toLocaleString()} plays
                {artist.isVerified && ' • Verified Artist'}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleFollow}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold shadow-lg transition ${
                  artist.isFollowing
                    ? 'bg-purple/75 text-white shadow-purple/20 hover:bg-purple/60'
                    : 'bg-white text-black hover:bg-white/20'
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
          <div className="mb-10 flex min-w-0 flex-col gap-5 sm:gap-8 lg:flex-row">
            <div className="relative flex-shrink-0">
              <AvatarImage
                src={artist.avatarUrl}
                alt={artist.name}
                width={300}
                height={300}
                className="h-40 w-40 rounded-[24px] object-cover shadow-2xl sm:h-56 sm:w-56 sm:rounded-[32px] lg:h-[300px] lg:w-[300px]"
              />
              {artist.isVerified && (
                <div className="absolute -bottom-4 -right-4 bg-purple/75 rounded-full p-3 shadow-lg">
                  <FaCrown size={16} className="text-white" />
                </div>
              )}
            </div>

            <div className="flex-1 space-y-6">
              {artist.bio && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-white">About</h3>
                  <p className="text-white/90 leading-relaxed max-w-2xl">{artist.bio}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="bg-white/5 rounded-2xl p-4">
                  <div className="text-2xl font-bold text-white">{artist.followers.toLocaleString()}</div>
                  <div className="text-sm text-white/60">Followers</div>
                </div>
                <div className="bg-white/5 rounded-2xl p-4">
                  <div className="text-2xl font-bold text-white">{artist.mediaCount}</div>
                  <div className="text-sm text-white/60">Songs</div>
                </div>
                <div className="bg-white/5 rounded-2xl p-4">
                  <div className="text-2xl font-bold text-white">{artist.totalPlays.toLocaleString()}</div>
                  <div className="text-sm text-white/60">Total Plays</div>
                </div>
                <div className="bg-white/5 rounded-2xl p-4">
                  <div className="text-2xl font-bold text-white">
                    {artist.media.reduce((sum, song) => sum + (song.likes || 0), 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-white/60">Total Likes</div>
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
            <div className="flex items-center gap-3 text-sm text-white/60 mb-4">
              <span className="inline-flex h-2 w-2 rounded-full bg-purple/60" />
              <span>Songs</span>
              <span className="text-white/70">({artist.media.length})</span>
            </div>

            <div className="grid min-w-0 gap-3 sm:gap-4">
              {artist.media.map((song, index) => (
                <div
                  key={song.id}
                  className="group flex min-w-0 items-center gap-2 rounded-2xl bg-white/5 p-2 transition-all duration-300 hover:bg-white/10 sm:gap-4 sm:p-4"
                >
                  <div className="relative flex-shrink-0">
                    <Image
                      src={song.coverArt || '/default-cover.png'}
                      alt={song.title}
                      width={56}
                      height={56}
                      className="h-12 w-12 rounded-xl object-cover sm:h-14 sm:w-14"
                    />
                    <button
                      onClick={() => handlePlaySong(song)}
                      className={`absolute inset-0 flex items-center justify-center bg-black/60 transition-opacity rounded-xl ${currentTrack?.id === song.id.toString() && isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                    >
                      {currentTrack?.id === song.id.toString() && isPlaying ? (
                        <Waveform playing className="h-5 w-5" />
                      ) : (
                        <FaPlay size={20} className="text-white" />
                      )}
                    </button>
                  </div>

                  <div className="min-w-0 flex-1">
                    <ScrollingTrackTitle isPlaying={currentTrack?.id === song.id.toString() && isPlaying} className="mb-1 font-medium text-white">{song.title}</ScrollingTrackTitle>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/60 sm:gap-x-4 sm:text-sm">
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
                        <span className="flex items-center gap-1 text-purple/60">
                          <FaCrown size={12} />
                          Premium
                        </span>
                      )}
                      {song.isExplicit && (
                        <span className="text-xs bg-charcoal px-2 py-0.5 rounded">E</span>
                      )}
                    </div>
                    <p className="mt-1 truncate text-[10px] text-white/60 sm:text-xs">
                      Added {song.addedAt ? formatAddedTime(song.addedAt) : 'date unavailable'}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1 sm:gap-2 lg:opacity-0 lg:transition-opacity lg:group-hover:opacity-100">
                    <button
                      onClick={() => handleLikeSong(song.id)}
                      className={`transition-colors ${likedSongs.has(song.id) ? 'text-purple/75' : 'text-white/60 hover:text-purple/75'}`}
                      aria-label={likedSongs.has(song.id) ? `Unlike ${song.title}` : `Like ${song.title}`}
                    >
                      {likedSongs.has(song.id) ? <FaHeart size={14} /> : <FaRegHeart size={14} />}
                    </button>
                    <button
                      onClick={() => handleShareSong(song)}
                      className="text-white/60 hover:text-white transition-colors"
                    >
                      <FaShare size={14} />
                    </button>
                    <button
                      onClick={() => handleDownloadSong(song)}
                      className="text-white/60 hover:text-white transition-colors"
                    >
                      <FaDownload size={14} />
                    </button>
                    <button
                      onClick={() => handleAddToPlaylist(song)}
                      className="text-white/60 hover:text-white transition-colors"
                    >
                      <FaPlus size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <PlaylistPickerModal
        open={showPlaylistModal}
        mediaId={selectedSong?.id ?? 0}
        onClose={() => {
          setShowPlaylistModal(false);
          setSelectedSong(null);
        }}
        onSuccess={() => {
          setShowPlaylistModal(false);
          setSelectedSong(null);
          alert('Added to playlist successfully!');
        }}
      />
    </div>
  );
}
