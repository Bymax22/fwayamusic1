"use client";
import { useEffect, useState } from 'react';
import { Play, Pause, Heart, Calendar, Clock } from 'lucide-react';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { formatDuration, formatDate } from '@/lib/utils';
import Image from "next/image";

interface NewRelease {
  id: number;
  title: string;
  artist: string;
  url: string;
  duration: number;
  coverArt: string;
  genre?: string;
  releaseDate: string;
  isExplicit: boolean;
}

export default function NewReleasesPage() {
  const [newReleases, setNewReleases] = useState<NewRelease[]>([]);
  const [filter, setFilter] = useState<'all' | 'this-week' | 'this-month'>('all');
  const { currentTrack, isPlaying, setCurrentTrack, togglePlay } = useAudioPlayer();

  useEffect(() => {
    const fetchNewReleases = async () => {
      // Mock new releases data
      const mockReleases: NewRelease[] = [
        {
          id: 1,
          title: "Summer Vibes",
          artist: "Various Artists",
          url: "/music/summer-vibes.mp3",
          duration: 180,
          coverArt: "/covers/summer-vibes.jpg",
          genre: "Compilation",
          releaseDate: new Date().toISOString(),
          isExplicit: false
        },
        {
          id: 2,
          title: "Dark Paradise",
          artist: "Lana Del Rey",
          url: "/music/dark-paradise.mp3",
          duration: 245,
          coverArt: "/covers/dark-paradise.jpg",
          genre: "Alternative",
          releaseDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
          isExplicit: true
        },
        {
          id: 3,
          title: "Electric Dreams",
          artist: "Kavinsky",
          url: "/music/electric-dreams.mp3",
          duration: 265,
          coverArt: "/covers/electric-dreams.jpg",
          genre: "Electronic",
          releaseDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
          isExplicit: false
        },
        {
          id: 4,
          title: "Midnight Sonata",
          artist: "Beethoven",
          url: "/music/midnight-sonata.mp3",
          duration: 320,
          coverArt: "/covers/midnight-sonata.jpg",
          genre: "Classical",
          releaseDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
          isExplicit: false
        },
        {
          id: 5,
          title: "Urban Legends",
          artist: "Drake",
          url: "/music/urban-legends.mp3",
          duration: 195,
          coverArt: "/covers/urban-legends.jpg",
          genre: "Hip Hop",
          releaseDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), // 1 week ago
          isExplicit: true
        }
      ];

      setNewReleases(mockReleases);
    };

    fetchNewReleases();
  }, [filter]);

  const handlePlay = (track: NewRelease) => {
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

  const getFilteredReleases = () => {
    const now = new Date();
    return newReleases.filter(release => {
      const releaseDate = new Date(release.releaseDate);
      const diffTime = Math.abs(now.getTime() - releaseDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      switch (filter) {
        case 'this-week': return diffDays <= 7;
        case 'this-month': return diffDays <= 30;
        default: return true;
      }
    });
  };

  const getReleaseBadge = (releaseDate: string) => {
    const now = new Date();
    const release = new Date(releaseDate);
    const diffTime = Math.abs(now.getTime() - release.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return { text: 'Just Released', color: 'bg-green-500' };
    if (diffDays === 1) return { text: 'Yesterday', color: 'bg-blue-500' };
    if (diffDays <= 7) return { text: 'This Week', color: 'bg-purple-500' };
    if (diffDays <= 30) return { text: 'This Month', color: 'bg-orange-500' };
    return { text: 'New', color: 'bg-gray-500' };
  };

  const filteredReleases = getFilteredReleases();

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gradient-to-br from-[#0a3747]/95 to-[#0a1f29]/95 min-h-screen pb-32">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
              <Calendar className="w-8 h-8 text-[#e51f48]" />
              New Releases
            </h1>
            <p className="text-gray-400">Fresh music just dropped</p>
          </div>
          
          <div className="flex gap-2 bg-[#0a3747] rounded-xl p-1">
            {(['all', 'this-week', 'this-month'] as const).map(timeFilter => (
              <button
                key={timeFilter}
                onClick={() => setFilter(timeFilter)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === timeFilter
                    ? 'bg-[#e51f48] text-white'
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
      {filteredReleases.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredReleases.map(release => {
            const badge = getReleaseBadge(release.releaseDate);
            
            return (
              <div 
                key={release.id} 
                className="bg-[#0a3747]/70 rounded-xl overflow-hidden hover:bg-[#0a3747] transition-colors group"
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
                      {formatDate(release.releaseDate)}
                    </span>
                    <button className="text-gray-400 hover:text-[#e51f48] transition-colors">
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