'use client';
import { useEffect, useState } from 'react';
import { Radio, Play, Heart, Download } from 'lucide-react';
import Image from "next/image";
import { motion } from 'framer-motion';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import ScrollingTrackTitle from '@/components/ScrollingTrackTitle';

interface MediaFile {
  id: number;
  title: string;
  artist: string;
  url: string;
  duration: number;
  coverArt: string;
  views: number;
  genre?: string;
  type?: 'AUDIO' | 'VIDEO' | 'PODCAST' | 'LIVE_STREAM';
}

export default function RadioPage() {
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentTrack, isPlaying, playTrack } = useAudioPlayer();

  useEffect(() => {
    const fetchRadioMedia = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/media`);
        if (res.ok) {
          const data = await res.json();
          // Filter for podcasts and live streams
          const radio = data.filter((m: MediaFile) => m.type === 'PODCAST' || m.type === 'LIVE_STREAM' || m.genre === 'Podcast');
          setMedia(radio.length > 0 ? radio : data.slice(0, 50));
        }
      } catch (error) {
        console.error('Failed to fetch radio media:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRadioMedia();
  }, []);

  if (loading) return <div className="p-4 text-center">Loading radio stations...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Radio className="w-8 h-8 text-purple/75 animate-pulse" />
          <h1 className="text-4xl font-bold text-white">Radio & Podcasts</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {media.map((track, index) => (
            <motion.div
              key={track.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group bg-card/50 backdrop-blur-lg rounded-lg overflow-hidden border border-purple/20 hover:border-purple/50 transition-all"
            >
              <div className="relative">
                <Image
                  src={track.coverArt || '/default-cover.jpg'}
                  alt={track.title}
                  width={300}
                  height={300}
                  className="w-full aspect-square object-cover group-hover:scale-110 transition-transform"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/default-cover.jpg';
                  }}
                />
                <button
                  onClick={() => playTrack(track)}
                  className="absolute inset-0 flex items-center justify-center bg-background/50 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Play className="w-12 h-12 text-purple/75 fill-purple/75" />
                </button>
              </div>

              <div className="p-4">
                <ScrollingTrackTitle isPlaying={String(currentTrack?.id) === String(track.id) && isPlaying} className="mb-1 font-semibold text-white">{track.title}</ScrollingTrackTitle>
                <p className="text-sm text-white/60 truncate mb-3">{track.artist}</p>
                
                <div className="flex items-center justify-between text-xs text-white/60 mb-3">
                  <span>{(track.views || 0).toLocaleString()} listens</span>
                  <span className="px-2 py-1 bg-card rounded text-purple/60 font-semibold">{track.type || 'Podcast'}</span>
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 p-2 bg-purple/20 text-purple/60 rounded hover:bg-purple/30 transition-colors text-xs font-semibold">
                    <Heart className="w-4 h-4 inline mr-1" /> Like
                  </button>
                  <button className="flex-1 p-2 bg-card text-white/90 rounded hover:bg-card transition-colors text-xs font-semibold">
                    <Download className="w-4 h-4 inline mr-1" /> Subscribe
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {media.length === 0 && (
          <div className="text-center py-12">
            <p className="text-white/60">No radio stations available</p>
          </div>
        )}
      </div>
    </div>
  );
}
