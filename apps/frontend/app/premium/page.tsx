'use client';
import { useEffect, useState } from 'react';
import { useAuth } from "../context/AuthContext";
import { Crown, Play, Heart, Download } from 'lucide-react';
import Image from "next/image";
import { motion } from 'framer-motion';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';

interface MediaFile {
  id: number;
  title: string;
  artist: string;
  url: string;
  duration: number;
  coverArt: string;
  views: number;
  genre?: string;
  accessType: 'FREE' | 'PREMIUM' | 'PAY_PER_VIEW';
}

export default function PremiumPage() {
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const { playTrack } = useAudioPlayer();

  useEffect(() => {
    const fetchPremiumMedia = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/media`);
        if (res.ok) {
          const data = await res.json();
          // Filter premium tracks
          const premium = data.filter((m: MediaFile) => m.accessType === 'PREMIUM' || m.accessType === 'PAY_PER_VIEW');
          setMedia(premium.slice(0, 50));
        }
      } catch (error) {
        console.error('Failed to fetch premium media:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPremiumMedia();
  }, []);

  if (loading) return <div className="p-4 text-center">Loading premium tracks...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1f29] to-[#050d12] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Crown className="w-8 h-8 text-yellow-500" />
          <h1 className="text-4xl font-bold text-white">Premium Collection</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {media.map((track, index) => (
            <motion.div
              key={track.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group bg-[#0f2935]/50 backdrop-blur-lg rounded-lg overflow-hidden border border-yellow-500/20 hover:border-yellow-500/50 transition-all"
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
                <div className="absolute top-2 right-2 bg-yellow-500/80 text-black px-2 py-1 rounded text-xs font-bold">
                  PREMIUM
                </div>
                <button
                  onClick={() => playTrack(track)}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Play className="w-12 h-12 text-yellow-500 fill-yellow-500" />
                </button>
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-white truncate mb-1">{track.title}</h3>
                <p className="text-sm text-gray-400 truncate mb-3">{track.artist}</p>
                
                <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                  <span>{(track.views || 0).toLocaleString()} plays</span>
                  <span className="px-2 py-1 bg-[#0a3747] rounded text-yellow-500 font-semibold">{track.genre || 'Unknown'}</span>
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 p-2 bg-yellow-500/20 text-yellow-500 rounded hover:bg-yellow-500/30 transition-colors text-xs font-semibold">
                    <Heart className="w-4 h-4 inline mr-1" /> Like
                  </button>
                  <button className="flex-1 p-2 bg-[#0a3747] text-gray-300 rounded hover:bg-[#0f4a5f] transition-colors text-xs font-semibold">
                    <Download className="w-4 h-4 inline mr-1" /> Get
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {media.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No premium tracks available</p>
          </div>
        )}
      </div>
    </div>
  );
}
