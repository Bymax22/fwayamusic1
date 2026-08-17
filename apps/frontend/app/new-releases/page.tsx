"use client";
import { useEffect, useMemo, useState } from 'react';
import { Play, Pause, Heart, Calendar, Clock } from 'lucide-react';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { formatDuration, formatDate } from '@/lib/utils';
import Image from 'next/image';

interface MediaFile {
  id: number;
  title: string;
  artist: string;
  url: string;
  duration: number;
  coverArt: string;
  genre?: string;
  releaseDate?: string;
  createdAt?: string;
  isExplicit?: boolean;
}

function normalizeMedia(item: any): MediaFile {
  return {
    id: item.id,
    title: item.title || 'Untitled',
    artist: item.artist || item.user?.displayName || 'Unknown Artist',
    url: item.url || item.audioUrl || item.mediaUrl || '',
    duration: item.duration || item.length || 0,
    coverArt: item.coverArt || item.artCoverUrl || item.coverUrl || '/default-cover.jpg',
    genre: item.genre || item.type || 'Unknown',
    releaseDate: item.releaseDate || item.publishedAt || item.createdAt || item.created_at || '',
    createdAt: item.createdAt || item.created_at || item.publishedAt || '',
    isExplicit: item.isExplicit || item.explicit || false,
  };
}

function getReleaseTimestamp(media: MediaFile) {
  const date = media.releaseDate || media.createdAt || '';
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

function getReleaseBadge(releaseDate: string) {
  const now = new Date();
  const release = new Date(releaseDate);
  if (Number.isNaN(release.getTime())) {
    return { text: 'Recently Added', color: 'bg-purple-600' };
  }
  const diffTime = Math.abs(now.getTime() - release.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return { text: 'Just Released', color: 'bg-purple-600' };
  if (diffDays === 1) return { text: 'Yesterday', color: 'bg-purple-500' };
  if (diffDays <= 7) return { text: 'This Week', color: 'bg-purple-500' };
  if (diffDays <= 30) return { text: 'This Month', color: 'bg-purple-400' };
  return { text: 'New', color: 'bg-gray-500' };
}

export default function NewReleasesPage() {
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [filter, setFilter] = useState<'all' | 'this-week' | 'this-month'>('all');
  const [loading, setLoading] = useState(true);
  const { currentTrack, isPlaying, playTrack, togglePlay } = useAudioPlayer();

  useEffect(() => {
    const fetchNewReleases = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/media', { credentials: 'include' });
        const data = await response.json();
        const mediaArray = Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : [];
        setMedia(mediaArray.map(normalizeMedia));
      } catch (error) {
        console.error('Failed to fetch new releases:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNewReleases();
  }, []);

  const handlePlay = (track: MediaFile) => {
    if (currentTrack?.id === track.id) {
      togglePlay();
      return;
    }

    playTrack({
      id: track.id,
      title: track.title,
      artist: track.artist,
      url: track.url,
      coverArt: track.coverArt,
      duration: track.duration,
    });
  };

  const filteredReleases = useMemo(() => {
    const now = new Date();

    return [...media]
      .sort((a, b) => getReleaseTimestamp(b) - getReleaseTimestamp(a))
      .filter((release) => {
        if (!release.releaseDate && !release.createdAt) return true;

        const timestamp = getReleaseTimestamp(release);
        const diffDays = Math.ceil((now.getTime() - timestamp) / (1000 * 60 * 60 * 24));

        if (filter === 'this-week') return diffDays <= 7;
        if (filter === 'this-month') return diffDays <= 30;
        return true;
      });
  }, [filter, media]);

  return (
    <div className="p-6 max-w-7xl mx-auto bg-black min-h-screen pb-32">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
              <Calendar className="w-8 h-8 text-purple-400" />
              New Releases
            </h1>
            <p className="text-gray-400">Fresh music just dropped</p>
          </div>
          
          <div className="flex flex-wrap gap-2 bg-white/5 rounded-full p-1">
            {(['all', 'this-week', 'this-month'] as const).map(timeFilter => (
              <button
                key={timeFilter}
                onClick={() => setFilter(timeFilter)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filter === timeFilter
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {timeFilter.split('-').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* New Releases Grid */}
      {loading ? (
        <div className="py-20 text-center text-gray-400">Loading new releases...</div>
      ) : filteredReleases.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredReleases.map(release => {
            const badge = getReleaseBadge(release.releaseDate || release.createdAt || '');
            
            return (
              <div 
                key={release.id} 
                className="bg-[#111827] rounded-3xl overflow-hidden transition-colors group"
              >
                <div className="relative">
                  <Image 
                    src={release.coverArt} 
                    alt={release.title} 
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/default-cover.jpg';
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all">
                    <button 
                      onClick={() => handlePlay(release)}
                      className="opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all"
                    >
                      <div className="w-12 h-12 rounded-full bg-[#e51f48] flex items-center justify-center shadow-lg">
                        {currentTrack?.id === release.id && isPlaying ? (
                          <Pause className="w-5 h-5 text-white" />
                        ) : (
                          <Play className="w-5 h-5 text-white" />
                        )}
                      </div>
                    </button>
                  </div>
                  
                  {/* Release Badge */}
                  <div className={`absolute top-3 left-3 ${badge.color} text-white text-xs px-2 py-1 rounded-full font-medium`}>
                    {badge.text}
                  </div>
                  
                  {/* Explicit Badge */}
                  {release.isExplicit && (
                    <div className="absolute top-3 right-3 bg-gray-600 text-white text-xs px-2 py-1 rounded font-medium">
                      E
                    </div>
                  )}
                </div>
                
                <div className="p-4">
                  <h3 className="font-medium text-white truncate mb-1">{release.title}</h3>
                  <p className="text-sm text-gray-400 truncate mb-2">{release.artist}</p>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>{release.genre}</span>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDuration(release.duration)}
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-xs text-gray-400">
                      {formatDate(release.releaseDate || release.createdAt || '')}
                    </span>
                    <button className="text-gray-400 hover:text-purple-400 transition-colors">
                      <Heart className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg mb-2">No new releases found</p>
          <p>Check back later for fresh music</p>
        </div>
      )}

      {/* Load More Button */}
      {filteredReleases.length > 0 && (
        <div className="mt-8 flex justify-center">
          <button className="px-6 py-3 bg-[#0a3747] hover:bg-[#0a3747]/80 text-white rounded-xl transition-colors">
            Load More Releases
          </button>
        </div>
      )}
    </div>
  );
}




