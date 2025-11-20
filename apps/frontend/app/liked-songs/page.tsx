"use client";
import { useEffect, useState } from 'react';
import { Play, Pause, Heart, Share2, Clock, Shuffle } from 'lucide-react';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { formatDuration } from '@/lib/utils';
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
  views: number;
  likes: number;
  genre?: string;
  liked: boolean;
}

export default function LikedSongsPage() {
  const [likedSongs, setLikedSongs] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentTrack, isPlaying, setCurrentTrack, togglePlay } = useAudioPlayer();
  const { getToken } = useAuth();

  useEffect(() => {
    const fetchLikedSongs = async () => {
      setLoading(true);
      try {
        const token = await getToken();
        if (!token) {
          setLikedSongs([]);
          return;
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/users/me/liked`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          console.error('Failed to fetch liked songs:', response.statusText);
          setLikedSongs([]);
          return;
        }

        const json = await response.json();
        const data = Array.isArray(json) ? json : (json.data ?? json.liked ?? []);

        const formattedData = (data as MediaFile[]).map((item: MediaFile) => ({
          id: item.id,
          title: item.title || 'Untitled',
          artist: item.artist || 'Unknown Artist',
          url: item.url,
          duration: item.duration || 0,
          coverArt: item.coverArt || '/default-cover.jpg',
          views: item.views || 0,
          likes: item.likes || 0,
          genre: item.genre || 'Other',
          liked: true
        }));

        setLikedSongs(formattedData);
      } catch (err) {
        console.error('Fetch error:', err);
        setLikedSongs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLikedSongs();
  }, []);

  const handlePlay = (file: MediaFile) => {
    if (currentTrack?.id === file.id) {
      togglePlay();
    } else {
      setCurrentTrack({
        id: file.id,
        title: file.title,
        artist: file.artist,
        url: file.url,
        coverArt: file.coverArt,
        duration: file.duration
      });
    }
  };

  const handlePlayAll = () => {
    if (likedSongs.length > 0) {
      const firstSong = likedSongs[0];
      setCurrentTrack({
        id: firstSong.id,
        title: firstSong.title,
        artist: firstSong.artist,
        url: firstSong.url,
        coverArt: firstSong.coverArt,
        duration: firstSong.duration
      });
    }
  };

  const handleUnlike = async (id: number) => {
    try {
      // In a real app, you would call an API to unlike
      setLikedSongs(prev => prev.filter(song => song.id !== id));
    } catch (err) {
      console.error('Unlike error:', err);
    }
  };

  const totalDuration = likedSongs.reduce((total, song) => total + song.duration, 0);

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto bg-gradient-to-br from-[#0a3747]/95 to-[#0a1f29]/95 min-h-screen">
        <div className="animate-pulse">
          <div className="h-48 bg-[#0a3747] rounded-xl mb-8"></div>
          <div className="space-y-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-16 bg-[#0a3747] rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Protected>
      <div className="p-6 max-w-7xl mx-auto bg-gradient-to-br from-[#0a3747]/95 to-[#0a1f29]/95 min-h-screen pb-32">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#e51f48] to-[#ff4d6d] rounded-xl p-8 mb-8">
        <div className="flex items-end gap-6">
          <div className="w-48 h-48 bg-white/20 rounded-xl flex items-center justify-center shadow-2xl">
            <Heart className="w-16 h-16 text-white" fill="currentColor" />
          </div>
          <div className="flex-1 text-white">
            <p className="text-sm font-medium mb-2">PLAYLIST</p>
            <h1 className="text-4xl font-bold mb-4">Liked Songs</h1>
            <div className="flex items-center gap-2 text-white/90">
              <span className="font-medium">Your favorites</span>
              <span>•</span>
              <span>{likedSongs.length} songs</span>
              <span>•</span>
              <span>{formatDuration(totalDuration)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={handlePlayAll}
          className="w-14 h-14 rounded-full bg-[#e51f48] hover:bg-[#ff4d6d] flex items-center justify-center shadow-lg transition-colors"
        >
          <Play className="w-6 h-6 text-white" fill="currentColor" />
        </button>
        
        <button className="w-10 h-10 rounded-full bg-[#0a3747] hover:bg-[#0a3747]/80 flex items-center justify-center transition-colors">
          <Shuffle className="w-5 h-5 text-gray-400" />
        </button>

        <button className="w-10 h-10 rounded-full bg-[#0a3747] hover:bg-[#0a3747]/80 flex items-center justify-center transition-colors">
          <Share2 className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Songs List */}
      {likedSongs.length > 0 ? (
        <div className="bg-[#0a3747]/70 rounded-xl overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 items-center p-4 border-b border-[#0a3747] text-gray-400 text-sm font-medium">
            <div className="col-span-1">#</div>
            <div className="col-span-5">TITLE</div>
            <div className="col-span-3">ARTIST</div>
            <div className="col-span-2">GENRE</div>
            <div className="col-span-1 flex justify-end">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          {/* Songs */}
          <div className="divide-y divide-[#0a3747]">
            {likedSongs.map((song, index) => (
              <div 
                key={song.id} 
                className={`grid grid-cols-12 gap-4 items-center p-4 transition-colors ${
                  currentTrack?.id === song.id 
                    ? 'bg-[#0a3747]' 
                    : 'hover:bg-[#0a3747]/50'
                }`}
              >
                <div className="col-span-1 text-gray-400">
                  {currentTrack?.id === song.id && isPlaying ? (
                    <Pause 
                      className="w-5 h-5 text-[#e51f48] cursor-pointer" 
                      onClick={() => handlePlay(song)}
                    />
                  ) : (
                    <span 
                      className="cursor-pointer hover:text-[#e51f48] transition-colors"
                      onClick={() => handlePlay(song)}
                    >
                      {index + 1}
                    </span>
                  )}
                </div>
                
                <div className="col-span-5 flex items-center gap-3">
                  <Image 
                    src={song.coverArt} 
                    alt={song.title} 
                    className="w-12 h-12 rounded-lg object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/default-cover.jpg';
                    }}
                  />
                  <div>
                    <p className={`font-medium ${
                      currentTrack?.id === song.id ? 'text-[#e51f48]' : 'text-white'
                    }`}>
                      {song.title}
                    </p>
                    <p className="text-sm text-gray-400">{song.genre}</p>
                  </div>
                </div>
                
                <div className="col-span-3 text-gray-300">
                  {song.artist}
                </div>
                
                <div className="col-span-2">
                  <span className="px-3 py-1 bg-[#0a3747] text-gray-300 rounded-full text-xs">
                    {song.genre}
                  </span>
                </div>
                
                <div className="col-span-1 flex justify-end gap-3">
                  <button 
                    onClick={() => handleUnlike(song.id)}
                    className="text-[#e51f48] hover:text-[#ff4d6d] transition-colors"
                    aria-label="Unlike"
                  >
                    <Heart className="w-5 h-5" fill="currentColor" />
                  </button>
                  <span className="text-gray-400 text-sm w-12 text-right">
                    {formatDuration(song.duration)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-400 mb-2">No liked songs yet</h3>
          <p className="text-gray-500">Like some songs to see them here</p>
        </div>
      )}
      </div>
    </Protected>
  );
}