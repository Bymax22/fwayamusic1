'use client';
import { useEffect, useState } from 'react';
import { useAuth } from "../context/AuthContext";
import { Users, Play, MapPin } from 'lucide-react';
import Image from "next/image";
import { motion } from 'framer-motion';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';

interface Artist {
  id: number;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  artistName?: string;
  stageName?: string;
  bio?: string;
  country?: string;
  followerCount?: number;
}

interface MediaFile {
  id: number;
  title: string;
  artist: string;
  url: string;
  duration: number;
  coverArt: string;
  views: number;
  genre?: string;
  user?: {
    id: number;
    username?: string;
    displayName?: string;
    avatarUrl?: string;
  };
}

export default function ArtistsPage() {
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const { playTrack } = useAudioPlayer();

  useEffect(() => {
    const fetchArtistMedia = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/media`);
        if (res.ok) {
          const data = await res.json();
          setMedia(data.slice(0, 50));
        }
      } catch (error) {
        console.error('Failed to fetch artist media:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchArtistMedia();
  }, []);

  if (loading) return <div className="p-4 text-center">Loading artists...</div>;

  // Get unique artists from media
  const uniqueArtists = Array.from(new Map(media.map(m => [m.user?.id || m.artist, m])).values());

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1f29] to-[#050d12] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Users className="w-8 h-8 text-green-500" />
          <h1 className="text-4xl font-bold text-white">Featured Artists</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {uniqueArtists.map((track, index) => (
            <motion.div
              key={`${track.user?.id || index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group bg-[#0f2935]/50 backdrop-blur-lg rounded-lg overflow-hidden border border-green-500/20 hover:border-green-500/50 transition-all p-6 text-center"
            >
              <div className="relative mb-4">
                <Image
                  src={track.user?.avatarUrl || track.coverArt || '/default-avatar.jpg'}
                  alt={track.user?.displayName || track.artist}
                  width={150}
                  height={150}
                  className="w-full max-w-[150px] aspect-square object-cover rounded-full mx-auto group-hover:scale-110 transition-transform"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/default-avatar.jpg';
                  }}
                />
              </div>

              <div className="mb-4">
                <h3 className="font-semibold text-white text-lg mb-1">{track.user?.displayName || track.artist}</h3>
                <p className="text-sm text-gray-400 mb-2">{track.genre || 'Multiple Genres'}</p>
                
                <div className="flex items-center justify-center gap-1 text-xs text-gray-400 mb-3">
                  <MapPin className="w-3 h-3" />
                  <span>Global</span>
                </div>

                <div className="text-xs text-gray-400 mb-3">
                  <span className="text-green-400 font-semibold">{(track.views || 0).toLocaleString()}</span> streams
                </div>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 p-2 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors text-xs font-semibold">
                  Follow
                </button>
                <button 
                  onClick={() => playTrack(track)}
                  className="flex-1 p-2 bg-[#0a3747] text-gray-300 rounded hover:bg-[#0f4a5f] transition-colors text-xs font-semibold"
                >
                  <Play className="w-4 h-4 inline mr-1" /> Listen
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {uniqueArtists.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No artists found</p>
          </div>
        )}
      </div>
    </div>
  );
}
