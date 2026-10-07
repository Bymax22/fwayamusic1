"use client";
import { useEffect, useMemo, useState } from 'react';
import { Play, Pause, Heart, TrendingUp, Crown, Music } from 'lucide-react';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { formatDuration } from '@/lib/utils';

import Image from "next/image";
import Waveform from '@/components/Waveform';
import ScrollingTrackTitle from '@/components/ScrollingTrackTitle';

interface ChartItem {
  id: number;
  title: string;
  artist: string;
  url: string;
  duration: number;
  coverArt: string;
  genre?: string;
  views: number;
  createdAt?: string;
  releaseDate?: string;
  position: number;
  change: 'up' | 'down' | 'same';
  changeAmount: number;
}

function normalizeChartItem(item: any): ChartItem {
  return {
    id: item.id,
    title: item.title || 'Untitled',
    artist: item.artist || item.user?.displayName || 'Unknown Artist',
    url: item.url || item.audioUrl || item.mediaUrl || '',
    duration: item.duration || item.length || 0,
    coverArt: item.coverArt || item.artCoverUrl || item.coverUrl || '/default-cover.jpg',
    genre: item.genre || item.type || 'Unknown',
    views: item.views || item.playCount || item.plays || 0,
    createdAt: item.createdAt || item.created_at || item.uploadedAt || item.uploaded_at || item.addedAt || item.added_at || '',
    releaseDate: item.releaseDate || item.publishedAt || item.published_at || '',
    position: item.position || 0,
    change: item.change || 'same',
    changeAmount: item.changeAmount || 0,
  };
}

export default function TopChartsPage() {
  const [charts, setCharts] = useState<ChartItem[]>([]);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('week');
  const [loading, setLoading] = useState(true);
  const { currentTrack, isPlaying, playTrack, togglePlay } = useAudioPlayer();

  useEffect(() => {
    const fetchCharts = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/media', { credentials: 'include' });
        const data = await response.json();
        const mediaArray = Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : [];
        const normalized = mediaArray.map(normalizeChartItem);

        setCharts(normalized);
      } catch (error) {
        console.error('Failed to fetch chart data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCharts();
  }, [timeRange]);

  const handlePlay = (track: ChartItem) => {
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

  const getPositionColor = (position: number) => {
    switch (position) {
      case 1: return 'text-purple/60';
      case 2: return 'text-white/60';
      case 3: return 'text-purple/45';
      default: return 'text-white/60';
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="relative overflow-hidden">
        <div className="relative p-6 max-w-7xl mx-auto pb-32">
          <div className="rounded-[2rem] bg-[#000000]/90 p-6 ring-1 ring-white/10 shadow-xl shadow-charcoal/20">
            <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr] items-end mb-10">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-1 text-xs uppercase tracking-[0.24em] text-purple/45">
                  <TrendingUp className="w-4 h-4 text-purple/60" />
                  Top Charts
                </p>
                <h1 className="mt-4 text-4xl font-semibold tracking-tight">Most-played tracks right now.</h1>
                <p className="mt-3 max-w-2xl text-white/60">
                  Explore the trending hits and discover what fans are playing across the platform.
                </p>
              </div>
              <div className="rounded-[2rem] bg-black/60 p-6 ring-1 ring-white/10">
                <h2 className="text-lg font-semibold text-white">Time Range</h2>
                <div className="mt-4 flex flex-wrap gap-3">
                  {(['day', 'week', 'month'] as const).map((range) => (
                    <button
                      key={range}
                      onClick={() => setTimeRange(range)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                        timeRange === range
                          ? 'bg-purple/75 text-white'
                          : 'bg-white/10 text-white/90 hover:bg-white/15'
                      }`}
                    >
                      {range.charAt(0).toUpperCase() + range.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {loading ? (
              <div className="py-20 text-center text-white/60">Loading chart data...</div>
            ) : charts.length > 0 ? (
              <div className="space-y-4">
                {charts.slice(0, 12).map((track, index) => {
                  return (
                    <div
                      key={track.id}
                      className={`group rounded-[2rem] bg-[#000000]/90 overflow-hidden ring-1 ring-white/10 transition hover:ring-purple/20 shadow-lg shadow-black/20`}
                    >
                      <div className="grid grid-cols-[auto_1fr_auto_auto] gap-4 items-center p-5">
                        <div className="text-center">
                          <span className="text-2xl font-bold text-purple/60">#{index + 1}</span>
                        </div>

                        <div className="flex items-center gap-4 min-w-0">
                          <div className="relative h-16 w-16 overflow-hidden rounded-2xl bg-charcoal flex-shrink-0">
                            <Image
                              src={track.coverArt}
                              alt={track.title}
                              fill
                              className="object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/default-cover.jpg';
                              }}
                            />
                          </div>
                          <div className="min-w-0">
                            <ScrollingTrackTitle isPlaying={String(currentTrack?.id) === String(track.id) && isPlaying} className="text-lg font-semibold text-white">{track.title}</ScrollingTrackTitle>
                            <p className="truncate text-sm text-white/60">{track.artist}</p>
                            <p className="text-xs text-white/60 mt-1">{track.views.toLocaleString()} plays</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-sm text-white/60">
                          <span>{track.genre || 'Genre'}</span>
                          <span>{formatDuration(track.duration)}</span>
                        </div>

                        <button
                          onClick={() => handlePlay(track)}
                          className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-purple/85 text-white transition hover:bg-purple/75 flex-shrink-0"
                        >
                          {currentTrack?.id === track.id && isPlaying ? (
                            <Waveform playing className="h-5 w-5" />
                          ) : (
                            <Play className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 text-white/60">
                <TrendingUp className="mx-auto mb-4 h-16 w-16 opacity-50" />
                <p className="text-lg font-semibold">No chart data available</p>
                <p>Charts will be populated as tracks are played.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}




