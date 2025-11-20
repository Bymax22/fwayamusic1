"use client";
import { useEffect, useState } from 'react';
import { Pause, Heart, Clock, MoreHorizontal } from 'lucide-react';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { formatDuration} from '@/lib/utils';
import Image from "next/image";
import Protected from '@/components/Protected';
import { useAuth } from '@/context/AuthContext';

interface MediaFile {
  id: number;
  title: string;
  artist: string;
  url: string;
  duration: number;
  coverArt: string;
  genre?: string;
  lastPlayedAt: string;
  playCount: number;
}

export default function RecentlyPlayedPage() {
  const [recentTracks, setRecentTracks] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentTrack, isPlaying, setCurrentTrack, togglePlay } = useAudioPlayer();
  const { getToken } = useAuth();

  useEffect(() => {
    const fetchRecentlyPlayed = async () => {
      try {
        const token = await getToken();
        if (!token) {
          setRecentTracks([]);
          return;
        }

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/users/me/recent`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) {
          console.error('Failed to fetch recently played:', res.statusText);
          setRecentTracks([]);
          return;
        }

        const json = await res.json();
        const data = Array.isArray(json) ? json : (json.data ?? json.recent ?? []);
        setRecentTracks(data as MediaFile[]);
      } catch (error) {
        console.error('Error fetching recently played:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentlyPlayed();
  }, []);

  const handlePlay = (track: MediaFile) => {
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

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInHours / 24);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto bg-gradient-to-br from-[#0a3747]/95 to-[#0a1f29]/95 min-h-screen">
        <div className="animate-pulse">
          <div className="h-8 bg-[#0a3747] rounded w-1/4 mb-8"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-[#0a3747] rounded-lg mb-4"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Protected>
      <div className="p-6 max-w-7xl mx-auto bg-gradient-to-br from-[#0a3747]/95 to-[#0a1f29]/95 min-h-screen pb-32">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Recently Played</h1>
        <p className="text-gray-400">Your listening history</p>
      </div>

      {/* Tracks List */}
      <div className="bg-[#0a3747]/70 rounded-xl overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 items-center p-4 border-b border-[#0a3747] text-gray-400 text-sm font-medium">
          <div className="col-span-1">#</div>
          <div className="col-span-5">TITLE</div>
          <div className="col-span-2">PLAYS</div>
          <div className="col-span-2">LAST PLAYED</div>
          <div className="col-span-2 flex justify-end">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        {recentTracks.length > 0 ? (
          <div className="divide-y divide-[#0a3747]">
            {recentTracks.map((track, index) => (
              <div 
                key={track.id} 
                className={`grid grid-cols-12 gap-4 items-center p-4 transition-colors ${
                  currentTrack?.id === track.id 
                    ? 'bg-[#0a3747]' 
                    : 'hover:bg-[#0a3747]/50'
                }`}
              >
                <div className="col-span-1 text-gray-400">
                  {currentTrack?.id === track.id && isPlaying ? (
                    <Pause 
                      className="w-5 h-5 text-[#e51f48] cursor-pointer" 
                      onClick={() => handlePlay(track)}
                    />
                  ) : (
                    <span 
                      className="cursor-pointer hover:text-[#e51f48] transition-colors"
                      onClick={() => handlePlay(track)}
                    >
                      {index + 1}
                    </span>
                  )}
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
                  {track.playCount} plays
                </div>
                
                <div className="col-span-2 text-gray-300 text-sm">
                  {getTimeAgo(track.lastPlayedAt)}
                </div>
                
                <div className="col-span-2 flex justify-end gap-3 items-center">
                  <button className="text-gray-400 hover:text-[#e51f48] transition-colors">
                    <Heart className="w-5 h-5" />
                  </button>
                  <span className="text-gray-400 text-sm w-12 text-right">
                    {formatDuration(track.duration)}
                  </span>
                  <button className="text-gray-400 hover:text-white transition-colors">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-400">
            <Clock className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">No recently played tracks</p>
            <p>Start listening to build your history</p>
          </div>
        )}
      </div>

      {/* Clear History Button */}
      {recentTracks.length > 0 && (
        <div className="mt-6 flex justify-end">
          <button className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm">
            Clear listening history
          </button>
        </div>
      )}
      </div>
    </Protected>
  );
}