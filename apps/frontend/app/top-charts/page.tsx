"use client";
import { useEffect, useState } from 'react';
import { Play, Pause, Heart, TrendingUp, Crown, Music } from 'lucide-react';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';

import Image from "next/image";

interface ChartItem {
  id: number;
  title: string;
  artist: string;
  url: string;
  duration: number;
  coverArt: string;
  genre?: string;
  plays: number;
  position: number;
  change: 'up' | 'down' | 'same';
  changeAmount: number;
}

export default function TopChartsPage() {
  const [charts, setCharts] = useState<ChartItem[]>([]);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('week');
  const { currentTrack, isPlaying, setCurrentTrack, togglePlay } = useAudioPlayer();

  useEffect(() => {
    const fetchCharts = async () => {
      // Mock chart data
      const mockCharts: ChartItem[] = [
        {
          id: 1,
          title: "CEO Wandi",
          artist: "Fwaya Music",
          url: "/music/ceo-wandi.mp3",
          duration: 180,
          coverArt: "/covers/wt3.jpg",
          genre: "Afrobeats",
          plays: 154320,
          position: 1,
          change: 'up',
          changeAmount: 2
        },
        {
          id: 2,
          title: "Blinding Lights",
          artist: "The Weeknd",
          url: "/music/blinding-lights.mp3",
          duration: 201,
          coverArt: "/covers/blinding-lights.jpg",
          genre: "Pop",
          plays: 142150,
          position: 2,
          change: 'down',
          changeAmount: 1
        },
        {
          id: 3,
          title: "Midnight City",
          artist: "M83",
          url: "/music/midnight-city.mp3",
          duration: 243,
          coverArt: "/covers/midnight-city.jpg",
          genre: "Electronic",
          plays: 128430,
          position: 3,
          change: 'up',
          changeAmount: 3
        },
        {
          id: 4,
          title: "Save Your Tears",
          artist: "The Weeknd",
          url: "/music/save-your-tears.mp3",
          duration: 215,
          coverArt: "/covers/save-your-tears.jpg",
          genre: "Pop",
          plays: 115670,
          position: 4,
          change: 'same',
          changeAmount: 0
        },
        {
          id: 5,
          title: "Levitating",
          artist: "Dua Lipa",
          url: "/music/levitating.mp3",
          duration: 203,
          coverArt: "/covers/levitating.jpg",
          genre: "Pop",
          plays: 108920,
          position: 5,
          change: 'up',
          changeAmount: 2
        }
      ];

      setCharts(mockCharts);
    };

    fetchCharts();
  }, [timeRange]);

  const handlePlay = (track: ChartItem) => {
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      setCurrentTrack({
        id: track.id,
        title: track.title,
        artist: track.artist,
        url: track.url,
        coverArt: track.coverArt,
        duration: track.duration
      });
    }
  };

  const getPositionColor = (position: number) => {
    switch (position) {
      case 1: return 'text-yellow-400';
      case 2: return 'text-gray-400';
      case 3: return 'text-orange-400';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gradient-to-br from-[#0a3747]/95 to-[#0a1f29]/95 min-h-screen pb-32">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
              <TrendingUp className="w-8 h-8 text-[#e51f48]" />
              Top Charts
            </h1>
            <p className="text-gray-400">Most played tracks this week</p>
          </div>
          
          <div className="flex gap-2 bg-[#0a3747] rounded-xl p-1">
            {(['day', 'week', 'month'] as const).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-[#e51f48] text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Top 3 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {charts.slice(0, 3).map(track => (
            <div 
              key={track.id} 
              className={`bg-gradient-to-br rounded-xl p-6 relative overflow-hidden ${
                track.position === 1 
                  ? 'from-yellow-500/20 to-orange-500/20 border border-yellow-500/30' 
                  : track.position === 2
                  ? 'from-gray-500/20 to-blue-500/20 border border-gray-500/30'
                  : 'from-orange-500/20 to-red-500/20 border border-orange-500/30'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Image 
                    src={track.coverArt} 
                    alt={track.title} 
                    className="w-20 h-20 rounded-lg object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/default-cover.jpg';
                    }}
                  />
                  {track.position === 1 && (
                    <Crown className="w-6 h-6 text-yellow-400 absolute -top-2 -right-2" fill="currentColor" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-2xl font-bold ${getPositionColor(track.position)}`}>
                      #{track.position}
                    </span>
                    {track.change !== 'same' && (
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        track.change === 'up' 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {track.change === 'up' ? '↑' : '↓'} {track.changeAmount}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-white text-lg truncate">{track.title}</h3>
                  <p className="text-gray-300 text-sm">{track.artist}</p>
                  <p className="text-gray-400 text-xs mt-1">{track.plays.toLocaleString()} plays</p>
                </div>
              </div>
              
              <button 
                onClick={() => handlePlay(track)}
                className="absolute bottom-4 right-4 w-10 h-10 bg-[#e51f48] hover:bg-[#ff4d6d] rounded-full flex items-center justify-center transition-colors"
              >
                {currentTrack?.id === track.id && isPlaying ? (
                  <Pause className="w-5 h-5 text-white" />
                ) : (
                  <Play className="w-5 h-5 text-white" fill="currentColor" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Charts List */}
      <div className="bg-[#0a3747]/70 rounded-xl overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 items-center p-4 border-b border-[#0a3747] text-gray-400 text-sm font-medium">
          <div className="col-span-1">#</div>
          <div className="col-span-5">TITLE</div>
          <div className="col-span-2">PLAYS</div>
          <div className="col-span-2">CHANGE</div>
          <div className="col-span-2 flex justify-end">
            <Music className="w-4 h-4" />
          </div>
        </div>

        {charts.length > 0 ? (
          <div className="divide-y divide-[#0a3747]">
            {charts.map(track => (
              <div 
                key={track.id} 
                className={`grid grid-cols-12 gap-4 items-center p-4 transition-colors ${
                  currentTrack?.id === track.id 
                    ? 'bg-[#0a3747]' 
                    : 'hover:bg-[#0a3747]/50'
                }`}
              >
                <div className="col-span-1">
                  <span className={`font-bold ${getPositionColor(track.position)}`}>
                    #{track.position}
                  </span>
                </div>
                
                <div className="col-span-5 flex items-center gap-3">
                  <Image 
                    src={track.coverArt} 
                    alt={track.title} 
                    className="w-12 h-12 rounded-lg object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/default-cover.jpg';
                    }}
                  />
                  <div>
                    <p className={`font-medium ${
                      currentTrack?.id === track.id ? 'text-[#e51f48]' : 'text-white'
                    }`}>
                      {track.title}
                    </p>
                    <p className="text-sm text-gray-400">{track.artist}</p>
                  </div>
                </div>
                
                <div className="col-span-2 text-gray-300">
                  {track.plays.toLocaleString()}
                </div>
                
                <div className="col-span-2">
                  {track.change !== 'same' ? (
                    <span className={`flex items-center gap-1 text-sm ${
                      track.change === 'up' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {track.change === 'up' ? '↑' : '↓'} {track.changeAmount}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm">-</span>
                  )}
                </div>
                
                <div className="col-span-2 flex justify-end gap-3">
                  <button className="text-gray-400 hover:text-[#e51f48] transition-colors">
                    <Heart className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => handlePlay(track)}
                    className="text-gray-400 hover:text-[#e51f48] transition-colors"
                  >
                    {currentTrack?.id === track.id && isPlaying ? (
                      <Pause className="w-5 h-5" />
                    ) : (
                      <Play className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-400">
            <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>No chart data available</p>
          </div>
        )}
      </div>
    </div>
  );
}