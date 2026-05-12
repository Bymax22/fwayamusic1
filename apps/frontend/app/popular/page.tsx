"use client";
import { useEffect, useMemo, useState } from 'react';
import { Play, Pause, Heart, Flame, TrendingUp, Users, Music2 } from 'lucide-react';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { formatDuration } from '@/lib/utils';
import Image from 'next/image';

interface MediaFile {
  id: number;
  title: string;
  artist: string;
  url: string;
  duration: number;
  coverArt: string;
  genre?: string;
  views: number;
  likes: number;
  createdAt?: string;
  releaseDate?: string;
}

interface Artist {
  id: number;
  name: string;
  avatar?: string;
  followers?: number;
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
    likes: item.likes || item.likeCount || 0,
    createdAt: item.createdAt || item.created_at || '',
    releaseDate: item.releaseDate || item.publishedAt || item.published_at || item.createdAt || '',
  };
}

function normalizeArtist(item: any): Artist {
  return {
    id: item.id,
    name: item.name || item.displayName || item.username || 'Unknown Artist',
    avatar: item.avatar || item.avatarUrl || '/default-avatar.jpg',
    followers: item.followers || item.followerCount || 0,
  };
}

function getTrendIcon(trend: 'up' | 'down' | 'stable') {
  if (trend === 'up') return <TrendingUp className="w-4 h-4 text-purple-400" />;
  if (trend === 'down') return <TrendingUp className="w-4 h-4 text-gray-400 transform rotate-180" />;
  return <TrendingUp className="w-4 h-4 text-gray-400" />;
}

export default function PopularPage() {
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [category, setCategory] = useState<'tracks' | 'artists' | 'genres'>('tracks');
  const [loading, setLoading] = useState(true);
  const { currentTrack, isPlaying, playTrack, togglePlay } = useAudioPlayer();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [mediaRes, artistRes] = await Promise.all([
          fetch('/api/media', { credentials: 'include' }),
          fetch('/api/artists'),
        ]);

        const mediaJson = await mediaRes.json();
        const mediaArray = Array.isArray(mediaJson)
          ? mediaJson
          : Array.isArray(mediaJson.data)
          ? mediaJson.data
          : [];

        const artistJson = await artistRes.json();
        const artistArray = Array.isArray(artistJson.artists) ? artistJson.artists : [];

        setMedia(mediaArray.map(normalizeMedia));
        setArtists(artistArray.map(normalizeArtist));
      } catch (error) {
        console.error('Failed to fetch popular content:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const popularTracks = useMemo(() => {
    return [...media]
      .sort((a, b) => b.views - a.views)
      .slice(0, 12)
      .map((item, index) => ({ ...item, trend: item.views > (media[index + 1]?.views ?? 0) ? 'up' : 'stable' }));
  }, [media]);

  const topArtists = useMemo(() => {
    if (artists.length > 0) {
      return artists.slice(0, 8);
    }

    const artistBuckets: Record<string, { count: number; plays: number; name: string }> = {};
    media.forEach((item) => {
      const key = item.artist;
      artistBuckets[key] = artistBuckets[key] || { count: 0, plays: 0, name: key };
      artistBuckets[key].count += 1;
      artistBuckets[key].plays += item.views;
    });

    return Object.values(artistBuckets)
      .sort((a, b) => b.plays - a.plays)
      .slice(0, 8)
      .map((entry, index) => ({ id: index, name: entry.name, followers: entry.plays, avatar: '/default-avatar.jpg' }));
  }, [artists, media]);

  const topGenres = useMemo(() => {
    const genreBuckets: Record<string, { count: number }> = {};
    media.forEach((item) => {
      const genre = item.genre || 'Unknown';
      genreBuckets[genre] = genreBuckets[genre] || { count: 0 };
      genreBuckets[genre].count += 1;
    });

    return Object.entries(genreBuckets)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 8)
      .map(([genre]) => genre);
  }, [media]);

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

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="relative overflow-hidden">
        <div className="relative p-6 max-w-7xl mx-auto pb-32">
          <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr] items-end mb-10">
            <div className="rounded-[2rem] bg-[#111827]/80 p-6 shadow-xl shadow-slate-900/20">
              <div className="space-y-3">
                <p className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-1 text-xs uppercase tracking-[0.24em] text-purple-300">
                  <Flame className="w-4 h-4 text-purple-400" /> Popular
                </p>
                <h1 className="text-4xl font-semibold tracking-tight">Popular tracks & artists</h1>
                <p className="max-w-2xl text-gray-400">
                  Browse the most-played music right now. Discover what fans are loving across the platform.
                </p>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                {(['tracks', 'artists', 'genres'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setCategory(tab)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      category === tab
                        ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                        : 'bg-white/10 text-gray-300 hover:bg-white/15'
                    }`}
                  >
                    {tab === 'tracks' ? 'Tracks' : tab === 'artists' ? 'Artists' : 'Genres'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[2rem] bg-[#111827]/80 p-6">
                <h2 className="text-lg font-semibold text-white">Top Metrics</h2>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-3xl bg-white/5 p-4">
                    <p className="text-sm text-gray-400">Top plays</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{media.reduce((sum, item) => sum + item.views, 0).toLocaleString()}</p>
                  </div>
                  <div className="rounded-3xl bg-white/5 p-4">
                    <p className="text-sm text-gray-400">Available tracks</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{media.length}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-[2rem] bg-[#111827]/80 p-6">
                <h2 className="text-lg font-semibold text-white">Rising genres</h2>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {topGenres.map((genre) => (
                    <button
                      key={genre}
                      className="rounded-3xl bg-white/10 px-4 py-3 text-left text-white transition hover:bg-white/15"
                    >
                      <p className="font-medium">{genre}</p>
                      <p className="text-sm text-gray-400">{media.filter((item) => item.genre === genre).length} tracks</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] bg-[#111827]/80 p-6 shadow-lg shadow-slate-900/10">
            <div className="flex flex-col gap-4 mb-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-purple-300">Popular</p>
                <h2 className="text-2xl font-semibold">Top picks for today</h2>
              </div>
              <div className="flex flex-wrap gap-3">
                <button className="rounded-full bg-white/10 px-4 py-2 text-sm text-gray-300 hover:bg-white/15 transition">Refresh</button>
                <button className="rounded-full bg-purple-500 px-4 py-2 text-sm font-medium text-white hover:bg-purple-400 transition">Upload</button>
              </div>
            </div>

            {loading ? (
              <div className="py-20 text-center text-gray-400">Loading popular content...</div>
            ) : category === 'tracks' ? (
              <div className="grid gap-4">
                {popularTracks.map((item, index) => (
                  <div
                    key={item.id}
                    className={`group rounded-[1.8rem] bg-[#111827]/90 p-4 transition ${
                      currentTrack?.id === item.id ? 'bg-[#1a1f2a]' : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="grid grid-cols-[auto_1fr_auto] gap-4 items-center">
                      <div className="relative h-20 w-20 overflow-hidden rounded-3xl bg-slate-900">
                        <Image
                          src={item.coverArt}
                          alt={item.title}
                          fill
                          className="object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/default-cover.jpg';
                          }}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-lg font-semibold text-white">{item.title}</p>
                        <p className="truncate text-sm text-gray-400">{item.artist}</p>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                          <span>{item.genre}</span>
                          <span>{formatDuration(item.duration)}</span>
                          <span>{item.views.toLocaleString()} plays</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePlay(item)}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-purple-600 text-white transition hover:bg-purple-500"
                        >
                          {currentTrack?.id === item.id && isPlaying ? (
                            <Pause className="w-5 h-5" />
                          ) : (
                            <Play className="w-5 h-5" />
                          )}
                        </button>
                        <button className="text-gray-400 hover:text-white transition">
                          <Heart className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : category === 'artists' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {topArtists.map((artist) => (
                  <div key={artist.id} className="rounded-[1.8rem] bg-[#111827]/90 p-5 transition hover:bg-white/5">
                    <div className="relative mx-auto mb-4 h-24 w-24 overflow-hidden rounded-full bg-slate-900">
                      <Image
                        src={artist.avatar || '/default-avatar.jpg'}
                        alt={artist.name}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/default-avatar.jpg';
                        }}
                      />
                    </div>
                    <p className="text-lg font-semibold text-white text-center">{artist.name}</p>
                    <p className="mt-2 text-center text-sm text-gray-400">{artist.followers?.toLocaleString() ?? 0} followers</p>
                    <div className="mt-4 flex justify-center">
                      <button className="rounded-full bg-purple-500 px-4 py-2 text-sm text-white transition hover:bg-purple-400">
                        Follow
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {topGenres.map((genre) => (
                  <div key={genre} className="rounded-[1.8rem] bg-[#111827]/90 p-5 transition hover:bg-white/5">
                    <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-purple-500/10 text-purple-300 text-xl font-semibold">
                      {genre.charAt(0)}
                    </div>
                    <p className="mt-4 text-lg font-semibold text-white">{genre}</p>
                    <p className="mt-2 text-sm text-gray-400">{media.filter((item) => item.genre === genre).length} tracks</p>
                    <div className="mt-4 flex justify-between items-center text-sm text-gray-400">
                      <span>Best pick</span>
                      <Music2 className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}




