"use client";
import { useEffect, useMemo, useState } from 'react';
import { Play, Pause, Heart, Share2, Clock, Shuffle, Music } from 'lucide-react';
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
  const { currentTrack, isPlaying, togglePlay, playTrack } = useAudioPlayer();
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

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/me/liked`, {
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
      playTrack({
        id: file.id,
        title: file.title,
        artist: file.artist,
        audioUrl: file.url,
        url: file.url,
        coverArt: file.coverArt,
        duration: file.duration
      });
    }
  };

  const handlePlayAll = () => {
    if (likedSongs.length > 0) {
      const firstSong = likedSongs[0];
      playTrack({
        id: firstSong.id,
        title: firstSong.title,
        artist: firstSong.artist,
        audioUrl: firstSong.url,
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
      <div className="p-6 max-w-7xl mx-auto bg-black min-h-screen">
        <div className="animate-pulse space-y-6">
          <div className="h-48 bg-[#111827] rounded-[2rem] mb-8"></div>
          <div className="space-y-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-16 bg-[#111827] rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Protected>
      <div className="min-h-screen bg-black text-white pb-32">
        <div className="px-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="rounded-[2rem] bg-[#111827] p-8 mb-8 mt-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-end gap-6">
              <div className="w-48 h-48 bg-[#0f1720] rounded-[2rem] flex items-center justify-center">
                <Heart className="w-16 h-16 text-purple-400" fill="currentColor" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium mb-2 text-purple-300">PLAYLIST</p>
                <h1 className="text-4xl font-bold mb-4">Liked Songs</h1>
                <div className="flex flex-wrap items-center gap-2 text-white/80 text-sm">
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
          <div className="flex flex-wrap items-center gap-4 mb-8">
            <button 
              onClick={handlePlayAll}
              className="w-14 h-14 rounded-full bg-purple-600 hover:bg-purple-500 flex items-center justify-center transition-colors"
            >
              <Play className="w-6 h-6 text-white" fill="currentColor" />
            </button>
            
            <button className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
              <Shuffle className="w-5 h-5 text-gray-400" />
            </button>

            <button className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
              <Share2 className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Songs List */}
          {likedSongs.length > 0 ? (
            <div className="rounded-[2rem] bg-[#111827] overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 items-center p-6 border-b border-white/5 text-gray-400 text-sm font-medium">
                <div className="col-span-1">#</div>
                <div className="col-span-5">TITLE</div>
                <div className="col-span-3">ARTIST</div>
                <div className="col-span-2">GENRE</div>
                <div className="col-span-1 flex justify-end">
                  <Clock className="w-4 h-4" />
                </div>
              </div>

              {/* Songs */}
              <div className="divide-y divide-white/5">
                {likedSongs.map((song, index) => (
                  <div 
                    key={song.id} 
                    className={`grid grid-cols-12 gap-4 items-center p-6 transition-colors ${
                      currentTrack?.id === song.id 
                        ? 'bg-white/5' 
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="col-span-1 text-gray-400">
                      {currentTrack?.id === song.id && isPlaying ? (
                        <Pause 
                          className="w-5 h-5 text-purple-500 cursor-pointer" 
                          onClick={() => handlePlay(song)}
                        />
                      ) : (
                        <span 
                          className="cursor-pointer hover:text-purple-500 transition-colors"
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
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-lg object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/default-cover.jpg';
                        }}
                      />
                      <div>
                        <p className={`font-medium ${
                          currentTrack?.id === song.id ? 'text-purple-400' : 'text-white'
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
                      <span className="px-3 py-1 bg-white/5 text-gray-300 rounded-full text-xs">
                        {song.genre}
                      </span>
                    </div>
                    
                    <div className="col-span-1 flex justify-end gap-3">
                      <button 
                        onClick={() => handleUnlike(song.id)}
                        className="text-purple-500 hover:text-purple-400 transition-colors"
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
              <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-400 mb-2">No liked songs yet</h3>
              <p className="text-gray-500">Like some songs to see them here</p>
            </div>
              )}
        </div>
      </div>
    </Protected>
  );
}




