"use client";
import { useEffect, useMemo, useState } from 'react';
import { Crown, Play, Pause, Heart, Download, Music } from 'lucide-react';
import Image from "next/image";
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { formatDuration } from '@/lib/utils';

interface MediaFile {
  id: number;
  title: string;
  artist: string;
  url: string;
  duration: number;
  coverArt: string;
  views: number;
  genre?: string;
  accessType?: 'FREE' | 'PREMIUM' | 'PAY_PER_VIEW';
  isExplicit?: boolean;
}

function normalizeMedia(item: any): MediaFile {
  return {
    id: item.id,
    title: item.title || 'Untitled',
    artist: item.artist || item.user?.displayName || 'Unknown Artist',
    url: item.url || item.audioUrl || item.mediaUrl || '',
    duration: item.duration || item.length || 0,
    coverArt: item.coverArt || item.artCoverUrl || item.coverUrl || '/default-cover.jpg',
    genre: item.genre || item.type || 'Unknown',
    views: item.views || item.playCount || 0,
    accessType: item.accessType || item.access_type || 'FREE',
    isExplicit: item.isExplicit || item.explicit || false,
  };
}

export default function PremiumPage() {
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentTrack, isPlaying, playTrack, togglePlay } = useAudioPlayer();

  useEffect(() => {
    const fetchPremiumMedia = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/media', { credentials: 'include' });
        const data = await response.json();
        const mediaArray = Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : [];
        
        const normalized = mediaArray
          .map(normalizeMedia)
          .filter((m: MediaFile) => m.accessType === 'PREMIUM' || m.accessType === 'PAY_PER_VIEW')
          .slice(0, 50);
        
        setMedia(normalized);
      } catch (error) {
        console.error('Failed to fetch premium media:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPremiumMedia();
  }, []);

  const handlePlay = (track: MediaFile) => {
    if (currentTrack?.id === track.id) {
      togglePlay();
      return;
    }

    playTrack({
      id: track.id,
      title: track.title,
      artist: track.artist,
      url: track.url,
      coverArt: track.coverArt,
      duration: track.duration,
    });
  };

  if (loading) return <div className="p-6 max-w-7xl mx-auto bg-black text-white min-h-screen text-center py-20">Loading premium tracks...</div>;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="relative overflow-hidden">
        <div className="relative p-6 max-w-7xl mx-auto pb-32">
          <div className="rounded-[2rem] bg-[#111827]/90 p-6 shadow-xl shadow-slate-900/20">
            <div className="mb-10">
              <p className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-1 text-xs uppercase tracking-[0.24em] text-purple-300">
                <Crown className="w-4 h-4 text-purple-400" />
                Premium Collection
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight">Exclusive Premium Tracks</h1>
              <p className="mt-3 max-w-2xl text-gray-400">
                Unlock premium and exclusive content available only to premium members.
              </p>
            </div>

            {media.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {media.map((track) => (
                  <div
                    key={track.id}
                    className="group rounded-[2rem] bg-[#111827]/90 overflow-hidden transition hover:ring-purple-500/20 shadow-lg shadow-black/20"
                  >
                    <div className="relative overflow-hidden">
                      <Image
                        src={track.coverArt}
                        alt={track.title}
                        width={520}
                        height={520}
                        className="h-56 w-full object-cover transition duration-500 group-hover:scale-105"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/default-cover.jpg';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      <div className="absolute top-4 left-4 rounded-full bg-purple-600 px-3 py-1 text-xs font-semibold text-white">
                        PREMIUM
                      </div>
                      {track.isExplicit && (
                        <div className="absolute top-4 right-4 rounded-full bg-gray-600 px-2 py-1 text-xs font-semibold text-white">E</div>
                      )}
                    </div>

                    <div className="p-5">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-lg font-semibold text-white truncate">{track.title}</p>
                          <p className="text-sm text-gray-400 truncate">{track.artist}</p>
                        </div>
                        <button
                          onClick={() => handlePlay(track)}
                          className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-purple-600 text-white transition hover:bg-purple-500 flex-shrink-0"
                        >
                          {currentTrack?.id === track.id && isPlaying ? (
                            <Pause className="w-5 h-5" />
                          ) : (
                            <Play className="w-5 h-5" />
                          )}
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-gray-400 mb-3">
                        <span>{track.views.toLocaleString()} plays</span>
                        <span>{track.genre || 'Genre'}</span>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-400">
                        <span>{formatDuration(track.duration)}</span>
                        <button className="text-gray-300 hover:text-white transition">
                          <Heart className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-gray-400">
                <Music className="mx-auto mb-4 h-16 w-16 opacity-50" />
                <p className="text-lg font-semibold">No premium tracks available</p>
                <p>Premium content will be added soon.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
