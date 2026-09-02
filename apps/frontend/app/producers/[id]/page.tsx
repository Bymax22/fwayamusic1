"use client";
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { FaPlay, FaPause, FaShare, FaEnvelope, FaGlobe, FaArrowLeft, FaCrown, FaStar } from 'react-icons/fa';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { useAuth } from '@/context/AuthContext';
import AvatarImage from '@/components/AvatarImage';

export default function ProducerPage() {
  const params = useParams();
  const router = useRouter();
  const { currentTrack, isPlaying, playTrack } = useAudioPlayer();
  const { getToken } = useAuth();

  const [producer, setProducer] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducer = async () => {
      try {
        const base = process.env.NEXT_PUBLIC_API_URL || '';
        const res = await fetch(`${base}/api/v1/users/${params.id}`);
        if (!res.ok) throw new Error('Producer not found');
        const u = await res.json();

        const media = Array.isArray(u.media) ? u.media.map((m: any) => ({ ...m, artist: u.displayName || u.username })) : [];

        setProducer({
          id: u.id?.toString(),
          name: u.displayName || u.username || u.producerName || 'Unknown Producer',
          avatarUrl: u.avatarUrl || '/default-artist.png',
          bio: u.bio || u.producerBio || '',
          website: u.website || '',
          followers: (u._count && u._count.followers) || (Array.isArray(u.followers) ? u.followers.length : (u.followersCount || 0)) || 0,
          isVerified: u.status === 'VERIFIED' || u.isVerified || u.verified || false,
          mediaCount: (u._count && u._count.media) || media.length,
          media,
          totalPlays: media.reduce((s: number, m: any) => s + (m.playCount || 0), 0),
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load producer');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) fetchProducer();
  }, [params.id]);

  if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div></div>;
  if (error || !producer) return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Producer Not Found</h1>
        <button onClick={() => router.back()} className="bg-purple-500 text-white px-6 py-2 rounded-lg">Go Back</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-6 mb-6">
          <div className="relative w-28 h-28 rounded-xl overflow-hidden">
            <AvatarImage src={producer.avatarUrl} alt={producer.name} fill className="object-cover rounded-xl" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold flex items-center gap-3">
              {producer.name}
              {producer.isVerified && (
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-purple-600 text-white shadow-sm"><FaStar className="w-3.5 h-3.5"/></span>
              )}
            </h1>
            <p className="text-gray-400">{producer.followers.toLocaleString()} followers • {producer.mediaCount} items • {producer.totalPlays.toLocaleString()} plays</p>
            {producer.website && <a href={producer.website} className="text-purple-300 block mt-2">Visit website</a>}
          </div>
        </div>

        {producer.bio && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold">About</h3>
            <p className="text-gray-300 mt-2">{producer.bio}</p>
          </div>
        )}

        <div>
          <h3 className="text-lg font-semibold mb-3">Productions</h3>
          <div className="grid grid-cols-3 gap-4">
            {producer.media.map((m: any, idx: number) => (
              <div key={m.id || idx} className="bg-white/5 rounded-lg p-3">
                <div className="aspect-[4/3] bg-black rounded-md" style={{backgroundImage: m.coverArt ? `url(${m.coverArt})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center'}} />
                <p className="mt-2 text-sm font-medium truncate">{m.title}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
