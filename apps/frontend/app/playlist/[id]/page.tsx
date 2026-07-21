'use client';
import { useEffect, useMemo, useState } from 'react';
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
  FaRegHeart,
  FaPlus,
  FaRedo,
  FaTrash,
} from 'react-icons/fa';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { formatDuration } from '@/lib/utils';
import Waveform from '@/components/Waveform';
import { useAuth } from '@/context/AuthContext';
import { subscribe } from '@/lib/realtime';
import PlaylistPickerModal from '@/components/PlaylistPickerModal';

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
  const { user, getToken } = useAuth();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerMediaId, setPickerMediaId] = useState<number | null>(null);
  const [liking, setLiking] = useState<Record<number, boolean>>({});
  const [removing, setRemoving] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const extractId = (raw: any) => {
      if (!raw) return raw;
      const s = String(raw);
      const m = s.match(/(\d+)$/);
      return m ? m[1] : s;
    };

    const fetchPlaylist = async () => {
      try {
        const id = extractId(params.id);
        if (!id) throw new Error('Invalid playlist id');

        const token = await getToken().catch(() => null);
        const res = await fetch(`/api/playlists/${id}`, {
          headers: {
            Accept: 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(text || 'Playlist not found');
        }

        const data = await res.json();
        setPlaylist(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load playlist');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      void fetchPlaylist();
    }
  }, [params.id, getToken]);

  // Realtime: refresh playlist when updates occur
  useEffect(() => {
    let unsub: (() => void) | undefined;
    const setup = async () => {
      try {
        unsub = await subscribe('playlist:updated', (payload: any) => {
          try {
            if (!params.id) return;
            const pid = Number(String(params.id).match(/(\d+)$/)?.[1] || params.id);
            if (Number(payload?.playlistId) === pid) {
              // refetch via frontend proxy
              (async () => {
                try {
                  const token = await getToken().catch(() => null);
                  const id = String(params.id).match(/(\d+)$/)?.[1] || params.id;
                  const r = await fetch(`/api/playlists/${id}`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
                  if (!r.ok) return;
                  const d = await r.json().catch(() => null);
                  if (d) setPlaylist(d);
                } catch (e) {}
              })();
            }
          } catch (err) {
            console.error('playlist:updated handler error', err);
          }
        });
      } catch (err) {
        // ignore
      }
    };
    void setup();
    return () => { if (unsub) unsub(); };
  }, [params.id]);

  const handlePlay = (track: Track) => {
    playTrack(track);
  };

  const handlePlayAll = () => {
    if (playlist?.entries && playlist.entries.length > 0) {
      const firstTrack = {
        id: playlist.entries[0].media.id.toString(),
        title: playlist.entries[0].media.title,
            artist: (playlist.entries[0].media as any).artist || playlist.entries[0].media.user?.displayName || playlist.entries[0].media.user?.username || "Unknown Artist",
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

  const openAddToPlaylist = (mediaId: number) => {
    setPickerMediaId(mediaId);
    setPickerOpen(true);
  };

  const closePicker = () => {
    setPickerOpen(false);
    setPickerMediaId(null);
  };

  const handleLikeTrack = async (mediaId: number) => {
    try {
      setLiking((s) => ({ ...s, [mediaId]: true }));
      const token = await getToken().catch(() => null);
      await fetch(`/api/media/${mediaId}/interact/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({}),
      });
    } catch (e) {
      // ignore
    } finally {
      setLiking((s) => ({ ...s, [mediaId]: false }));
    }
  };

  const handleDownloadTrack = async (media: any) => {
    try {
      const token = await getToken().catch(() => null);
      const res = await fetch(`/api/media/${media.id}/interact/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({}),
      });

      if (res.ok) {
        const data = await res.json().catch(() => null);
        const url = data?.url || media.url || media.audioUrl;
        if (url) window.open(url, '_blank');
      } else {
        // fallback to media url
        const url = media.url || media.audioUrl;
        if (url) window.open(url, '_blank');
      }
    } catch (e) {
      const url = media.url || media.audioUrl;
      if (url) window.open(url, '_blank');
    }
  };

  const handleShareTrack = (media: any) => {
    if (navigator.share) {
      navigator.share({
        title: media.title,
        text: `Check out ${media.title} by ${media.artist || media.user?.displayName || media.user?.username}`,
        url: `${window.location.origin}/songs/${media.id}`,
      });
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/songs/${media.id}`);
    }
  };

  const handleRemoveTrack = async (mediaId: number) => {
    if (!playlist) return;
    try {
      setRemoving((s) => ({ ...s, [mediaId]: true }));
      const token = await getToken().catch(() => null);
      const res = await fetch(`/api/playlists/${playlist.id}/media`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ mediaId, userId: user?.id }),
      });

      if (res.ok) {
        setPlaylist((p) => p ? { ...p, entries: p.entries.filter(e => Number(e.media.id) !== Number(mediaId)) } : p);
      }
    } catch (e) {
      // ignore
    } finally {
      setRemoving((s) => ({ ...s, [mediaId]: false }));
    }
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
                            artist: (track as any).artist || track.user?.displayName || track.user?.username || "Unknown Artist",
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
                              artist: (track as any).artist || track.user?.displayName || track.user?.username || "Unknown Artist",
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
                            <Waveform playing={isCurrent && isPlaying} />
                          ) : null}
                          <span>{track.title}</span>
                        </span>
                      </h3>
                      <p className="text-sm text-gray-400 truncate">
                        {(track as any).artist || track.user?.displayName || track.user?.username || "Unknown Artist"}
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

                    {/* Track Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openAddToPlaylist(Number(track.id))}
                        className="p-2 rounded-full bg-white/5 text-white hover:bg-white/10"
                        title="Add to playlist"
                      >
                        <FaPlus size={14} />
                      </button>

                      <button
                        onClick={() => handleLikeTrack(Number(track.id))}
                        className="p-2 rounded-full bg-white/5 text-white hover:bg-white/10"
                        title="Like"
                      >
                        <FaRegHeart size={14} />
                      </button>

                      <button
                        onClick={() => handleDownloadTrack(track)}
                        className="p-2 rounded-full bg-white/5 text-white hover:bg-white/10"
                        title="Download"
                      >
                        <FaDownload size={14} />
                      </button>

                      <button
                        onClick={() => handleShareTrack(track)}
                        className="p-2 rounded-full bg-white/5 text-white hover:bg-white/10"
                        title="Share"
                      >
                        <FaShare size={14} />
                      </button>

                      {user && (
                        <button
                          onClick={() => handleRemoveTrack(Number(track.id))}
                          className="p-2 rounded-full bg-white/5 text-white hover:bg-white/10"
                          title="Remove from playlist"
                        >
                          <FaTrash size={14} />
                        </button>
                      )}
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
        {/* Playlist picker modal for adding single tracks */}
        <PlaylistPickerModal
          open={pickerOpen}
          mediaId={pickerMediaId ?? 0}
          onClose={closePicker}
          onSuccess={async () => {
            try {
              const id = String(params.id).match(/(\d+)$/)?.[1] || params.id;
              const token = await getToken().catch(() => null);
              const r = await fetch(`/api/playlists/${id}`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
              if (r.ok) {
                const d = await r.json().catch(() => null);
                if (d) setPlaylist(d);
              }
            } catch (e) {
              // ignore
            } finally {
              closePicker();
            }
          }}
        />
    </div>
  );
};

export default PlaylistDetailPage;