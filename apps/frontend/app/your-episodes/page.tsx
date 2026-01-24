'use client';
import { useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { useAuth } from "../context/AuthContext";
import { History, Play, Heart, Download, Clock } from 'lucide-react';
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
}

export default function YourEpisodesPage() {
  const { user } = useAuth();
  const [episodes, setEpisodes] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const { playTrack } = useAudioPlayer();

  useEffect(() => {
    const fetchEpisodes = async () => {
      try {
        setLoading(true);
        
        if (user?.id) {
          // Try to fetch user's saved/recent episodes
          const auth = getAuth();
          let token = '';
          if (auth.currentUser) {
            token = await auth.currentUser.getIdToken();
          }
          
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/media`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
          });
          
          if (res.ok) {
            const data = await res.json();
            // Filter for podcast/episode type content
            const podcasts = data.filter((m: MediaFile) => m.genre === 'Podcast' || m.genre?.toLowerCase().includes('episode'));
            setEpisodes(podcasts.slice(0, 50));
          }
        }
      } catch (error) {
        console.error('Failed to fetch episodes:', error);
        setEpisodes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEpisodes();
  }, [user]);

  if (loading) return <div className="p-4 text-center">Loading episodes...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1f29] to-[#050d12] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <History className="w-8 h-8 text-cyan-500" />
          <h1 className="text-4xl font-bold text-white">Your Episodes</h1>
        </div>

        {episodes.length > 0 ? (
          <div className="space-y-2">
            {episodes.map((episode, index) => (
              <motion.div
                key={episode.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group bg-[#0f2935]/50 backdrop-blur-lg rounded-lg overflow-hidden border border-cyan-500/20 hover:border-cyan-500/50 transition-all p-4 flex items-center gap-4"
              >
                <div className="relative flex-shrink-0">
                  <Image
                    src={episode.coverArt || '/default-cover.jpg'}
                    alt={episode.title}
                    width={80}
                    height={80}
                    className="w-20 h-20 object-cover rounded group-hover:scale-110 transition-transform"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/default-cover.jpg';
                    }}
                  />
                  <button
                    onClick={() => playTrack(episode)}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded"
                  >
                    <Play className="w-6 h-6 text-cyan-500 fill-cyan-500" />
                  </button>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate mb-1">{episode.title}</h3>
                  <p className="text-sm text-gray-400 truncate mb-2">{episode.artist}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{episode.genre || 'Episode'}</span>
                    <span>•</span>
                    <span>{(episode.views || 0).toLocaleString()} listens</span>
                  </div>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  <button className="p-2 bg-cyan-500/20 text-cyan-400 rounded hover:bg-cyan-500/30 transition-colors">
                    <Heart className="w-4 h-4" />
                  </button>
                  <button className="p-2 bg-[#0a3747] text-gray-300 rounded hover:bg-[#0f4a5f] transition-colors">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <History className="w-16 h-16 text-gray-600 mx-auto mb-4 opacity-50" />
            <p className="text-gray-400 mb-2">No episodes yet</p>
            <p className="text-gray-500 text-sm">Subscribe to podcasts to see episodes here</p>
          </div>
        )}
      </div>
    </div>
  );
}
