"use client";
import { useEffect, useState } from 'react';
import { Play, Pause, Heart, Flame, TrendingUp, Users } from 'lucide-react';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';

import Image from "next/image";

interface PopularItem {
  id: number;
  title: string;
  artist: string;
  url: string;
  duration: number;
  coverArt: string;
  genre?: string;
  plays: number;
  likes: number;
  trend: 'up' | 'down' | 'stable';
}

export default function PopularPage() {
  const [popularItems, setPopularItems] = useState<PopularItem[]>([]);
  const [category, setCategory] = useState<'tracks' | 'artists' | 'playlists'>('tracks');
  const { currentTrack, isPlaying, setCurrentTrack, togglePlay } = useAudioPlayer();

  useEffect(() => {
    const fetchPopular = async () => {
      // Mock popular data
      const mockPopular: PopularItem[] = [
        {
          id: 1,
          title: "CEO Wandi",
          artist: "Fwaya Music",
          url: "/music/ceo-wandi.mp3",
          duration: 180,
          coverArt: "/covers/wt3.jpg",
          genre: "Afrobeats",
          plays: 154320,
          likes: 8920,
          trend: 'up'
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
          likes: 12450,
          trend: 'up'
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
          likes: 9560,
          trend: 'stable'
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
          likes: 8340,
          trend: 'down'
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
          likes: 7820,
          trend: 'up'
        }
      ];

      setPopularItems(mockPopular);
    };

    fetchPopular();
  }, [category]);

  const handlePlay = (track: PopularItem) => {
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

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'down': return <TrendingUp className="w-4 h-4 text-red-400 transform rotate-180" />;
      default: return <TrendingUp className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gradient-to-br from-[#0a3747]/95 to-[#0a1f29]/95 min-h-screen pb-32">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
              <Flame className="w-8 h-8 text-[#e51f48]" />
              Popular Now
            </h1>
            <p className="text-gray-400">What everyone is listening to</p>
          </div>
          
          <div className="flex gap-2 bg-[#0a3747] rounded-xl p-1">
            {(['tracks', 'artists', 'playlists'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  category === cat
                    ? 'bg-[#e51f48] text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Popular Items */}
      <div className="bg-[#0a3747]/70 rounded-xl overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 items-center p-4 border-b border-[#0a3747] text-gray-400 text-sm font-medium">
          <div className="col-span-1">#</div>
          <div className="col-span-5">TITLE</div>
          <div className="col-span-2">PLAYS</div>
          <div className="col-span-2">LIKES</div>
          <div className="col-span-2 flex justify-end">
            <Flame className="w-4 h-4" />
          </div>
        </div>

        {popularItems.length > 0 ? (
          <div className="divide-y divide-[#0a3747]">
            {popularItems.map((item, index) => (
              <div 
                key={item.id} 
                className={`grid grid-cols-12 gap-4 items-center p-4 transition-colors ${
                  currentTrack?.id === item.id 
                    ? 'bg-[#0a3747]' 
                    : 'hover:bg-[#0a3747]/50'
                }`}
              >
                <div className="col-span-1 text-gray-400">
                  {index + 1}
                </div>
                
                <div className="col-span-5 flex items-center gap-3">
                  <Image 
                    src={item.coverArt} 
                    alt={item.title} 
                    className="w-12 h-12 rounded-lg object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/default-cover.jpg';
                    }}
                  />
                  <div>
                    <p className={`font-medium ${
                      currentTrack?.id === item.id ? 'text-[#e51f48]' : 'text-white'
                    }`}>
                      {item.title}
                    </p>
                    <p className="text-sm text-gray-400">{item.artist}</p>
                  </div>
                </div>
                
                <div className="col-span-2 text-gray-300">
                  {item.plays.toLocaleString()}
                </div>
                
                <div className="col-span-2 text-gray-300">
                  {item.likes.toLocaleString()}
                </div>
                
                <div className="col-span-2 flex justify-end gap-3 items-center">
                  <div className="flex items-center gap-1">
                    {getTrendIcon(item.trend)}
                  </div>
                  <button className="text-gray-400 hover:text-[#e51f48] transition-colors">
                    <Heart className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => handlePlay(item)}
                    className="text-gray-400 hover:text-[#e51f48] transition-colors"
                  >
                    {currentTrack?.id === item.id && isPlaying ? (
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
            <Flame className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>No popular items found</p>
          </div>
        )}
      </div>

      {/* Popular Artists Section */}
      {category === 'artists' && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Users className="w-6 h-6 text-[#e51f48]" />
            Trending Artists
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-[#e51f48] to-[#ff4d6d] rounded-full mx-auto mb-3 flex items-center justify-center">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <p className="font-medium text-white">Artist {i}</p>
                <p className="text-sm text-gray-400">{(i * 12500).toLocaleString()} followers</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}