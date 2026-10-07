"use client";
import { useEffect, useState } from 'react';
import { Play, Heart,  List, Shuffle, X } from 'lucide-react';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { formatDuration } from '@/lib/utils';
import Image from "next/image";
import Waveform from '@/components/Waveform';
import ScrollingTrackTitle from '@/components/ScrollingTrackTitle';
import { subscribe } from '@/lib/realtime';

interface QueueItem {
  id: number;
  title: string;
  artist: string;
  url: string;
  duration: number;
  coverArt: string;
  genre?: string;
  addedAt: string;
}

export default function QueuePage() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [upNext, setUpNext] = useState<QueueItem[]>([]);
  const { currentTrack, isPlaying, playTrack, togglePlay } = useAudioPlayer();

  useEffect(() => {
    // Mock queue data
    const mockQueue: QueueItem[] = [
      {
        id: 1,
        title: "CEO Wandi",
        artist: "Fwaya",
        url: "/music/ceo-wandi.mp3",
        duration: 180,
        coverArt: "/covers/wt3.jpg",
        genre: "Afrobeats",
        addedAt: new Date().toISOString()
      }
    ];

    const mockUpNext: QueueItem[] = [
      {
        id: 2,
        title: "Blinding Lights",
        artist: "The Weeknd",
        url: "/music/blinding-lights.mp3",
        duration: 201,
        coverArt: "/covers/blinding-lights.jpg",
        genre: "Pop",
        addedAt: new Date().toISOString()
      },
      {
        id: 3,
        title: "Midnight City",
        artist: "M83",
        url: "/music/midnight-city.mp3",
        duration: 243,
        coverArt: "/covers/midnight-city.jpg",
        genre: "Electronic",
        addedAt: new Date().toISOString()
      },
      {
        id: 4,
        title: "Save Your Tears",
        artist: "The Weeknd",
        url: "/music/save-your-tears.mp3",
        duration: 215,
        coverArt: "/covers/save-your-tears.jpg",
        genre: "Pop",
        addedAt: new Date().toISOString()
      }
    ];

    setQueue(mockQueue);
    setUpNext(mockUpNext);
  }, []);

  // Subscribe to playlist updates and apply to upNext where plausible
  useEffect(() => {
    let unsub: (() => void) | undefined;
    const setup = async () => {
      try {
        unsub = await subscribe('playlist:updated', (payload: any) => {
          try {
            if (!payload) return;
            if (payload.action === 'add' && payload.entry) {
              setUpNext((prev) => [...prev, payload.entry.media]);
            }
            if (payload.action === 'remove' && payload.entry?.mediaId) {
              setUpNext((prev) => prev.filter(t => t.id !== payload.entry.mediaId));
            }
          } catch (err) {
            console.error('Queue handler error', err);
          }
        });
      } catch (err) {
        // ignore
      }
    };
    void setup();
    return () => { if (unsub) unsub(); };
  }, []);

  const handlePlay = (track: QueueItem) => {
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      playTrack({
        id: track.id,
        title: track.title,
        artist: track.artist,
        url: track.url,
        coverArt: track.coverArt,
        duration: track.duration
      });
    }
  };

  const removeFromQueue = (id: number) => {
    setUpNext(prev => prev.filter(track => track.id !== id));
  };

  const clearQueue = () => {
    setUpNext([]);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gradient-to-br from-[#36454F]/95 to-[#000000]/95 min-h-screen pb-32">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Queue</h1>
          <p className="text-white/60">Currently playing and up next</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-[#36454F] hover:bg-[#36454F]/80 text-white/90 rounded-xl transition-colors">
            <Shuffle className="w-4 h-4" />
            Shuffle
          </button>
          {upNext.length > 0 && (
            <button 
              onClick={clearQueue}
              className="flex items-center gap-2 px-4 py-2 bg-[#36454F] hover:bg-[#9B5DE5] text-white/90 hover:text-white rounded-xl transition-colors"
            >
              <X className="w-4 h-4" />
              Clear Queue
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Now Playing */}
        <div className="lg:col-span-1">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Play className="w-5 h-5 text-[#36454F]" />
            Now Playing
          </h2>
          
          {queue.length > 0 ? (
            <div className="bg-[#36454F]/70 rounded-xl p-4">
              {queue.map(track => (
                <div key={track.id} className="text-center">
                  <Image 
                    src={track.coverArt} 
                    alt={track.title} 
                    className="w-48 h-48 rounded-xl object-cover mx-auto mb-4"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/default-cover.jpg';
                    }}
                  />
                  <h3 className="font-bold text-white text-lg mb-1">{track.title}</h3>
                  <p className="text-white/60 mb-2">{track.artist}</p>
                  <p className="text-white/60 text-sm">{track.genre}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#36454F]/70 rounded-xl p-8 text-center text-white/60">
              <List className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nothing playing right now</p>
            </div>
          )}
        </div>

        {/* Up Next */}
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <List className="w-5 h-5 text-[#36454F]" />
              Up Next ({upNext.length})
            </h2>
          </div>

          <div className="bg-[#36454F]/70 rounded-xl overflow-hidden">
            {upNext.length > 0 ? (
              <div className="divide-y divide-[#36454F]">
                {upNext.map((track, index) => (
                  <div 
                    key={track.id} 
                    className="flex items-center gap-4 p-4 hover:bg-[#36454F]/50 transition-colors group"
                  >
                    <div className="text-white/60 w-6 text-center">
                      {index + 1}
                    </div>
                    
                    <Image 
                      src={track.coverArt} 
                      alt={track.title} 
                      className="w-12 h-12 rounded-lg object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/default-cover.jpg';
                      }}
                    />
                    
                    <div className="flex-1 min-w-0">
                      <ScrollingTrackTitle isPlaying={String(currentTrack?.id) === String(track.id) && isPlaying} className="font-medium text-white">
                        <span className="inline-flex items-center gap-2">
                          {currentTrack?.id === track.id ? (
                            <Waveform playing={isPlaying} />
                          ) : null}
                          <span>{track.title}</span>
                        </span>
                      </ScrollingTrackTitle>
                      <p className="text-sm text-white/60 truncate">{track.artist}</p>
                    </div>
                    
                    <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handlePlay(track)}
                        className="text-white/60 hover:text-[#36454F] transition-colors"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                      <button className="text-white/60 hover:text-[#36454F] transition-colors">
                        <Heart className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className="text-white/60 text-sm">
                        {formatDuration(track.duration)}
                      </span>
                      <button 
                        onClick={() => removeFromQueue(track.id)}
                        className="text-white/60 hover:text-[#9B5DE5] transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-white/60">
                <List className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">Queue is empty</p>
                <p>Add songs to see them here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}




