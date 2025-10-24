"use client";
import { useEffect, useState } from 'react';
import { Play, TrendingUp, Music, Mic2 } from 'lucide-react';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { formatDuration } from '@/lib/utils';
import Image from "next/image";

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
}

interface Category {
  id: number;
  name: string;
  description: string;
  color: string;
  count: number;
}

export default function ExplorePage() {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [trendingTracks, setTrendingTracks] = useState<MediaFile[]>([]);
  const [newReleases, setNewReleases] = useState<MediaFile[]>([]);
  const { currentTrack, isPlaying, setCurrentTrack, togglePlay } = useAudioPlayer();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:3001/media', {
          credentials: 'include',
        });
        const { data } = await response.json();
        
        const formattedData = data.map((item: MediaFile) => ({
          id: item.id,
          title: item.title || 'Untitled',
          artist: item.artist || 'Unknown Artist',
          url: item.url,
          duration: item.duration || 0,
          coverArt: item.coverArt || '/default-cover.jpg',
          views: item.views || 0,
          likes: item.likes || 0,
          genre: item.genre || 'Other'
        }));

        setMediaFiles(formattedData);
        
        // Get trending tracks (most views)
        const trending = [...formattedData]
          .sort((a, b) => b.views - a.views)
          .slice(0, 8);
        setTrendingTracks(trending);

        // Get new releases (most recent)
        const newReleases = [...formattedData]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 8);
        setNewReleases(newReleases);

        // Mock categories
        const mockCategories: Category[] = [
          { id: 1, name: 'Top Charts', description: 'Most popular tracks', color: 'from-purple-500 to-pink-500', count: trending.length },
          { id: 2, name: 'New Releases', description: 'Fresh music just dropped', color: 'from-blue-500 to-cyan-500', count: newReleases.length },
          { id: 3, name: 'Popular Artists', description: 'Trending creators', color: 'from-green-500 to-emerald-500', count: 24 },
          { id: 4, name: 'Radio Stations', description: 'Live streaming', color: 'from-orange-500 to-red-500', count: 12 },
          { id: 5, name: 'Genres', description: 'Explore by style', color: 'from-indigo-500 to-purple-500', count: 18 },
          { id: 6, name: 'Mood & Activity', description: 'Music for every moment', color: 'from-yellow-500 to-orange-500', count: 15 },
        ];
        setCategories(mockCategories);
      } catch (err) {
        console.error('Fetch error:', err);
      }
    };

    fetchData();
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

  const getGenreCount = (genre: string) => {
    return mediaFiles.filter(file => file.genre === genre).length;
  };

  const popularGenres = Array.from(new Set(mediaFiles.map(file => file.genre))).slice(0, 6);

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gradient-to-br from-[#0a3747]/95 to-[#0a1f29]/95 min-h-screen pb-32">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Explore</h1>
        <p className="text-gray-400">Discover new music and trending content</p>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        {categories.map(category => (
          <div 
            key={category.id}
            className={`bg-gradient-to-br ${category.color} rounded-2xl p-6 text-white cursor-pointer hover:scale-105 transition-transform`}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-lg mb-1">{category.name}</h3>
                <p className="text-white/80 text-sm">{category.description}</p>
              </div>
              <div className="text-2xl font-bold">{category.count}+</div>
            </div>
            <div className="flex items-center text-white/90 text-sm">
              <TrendingUp className="w-4 h-4 mr-1" />
              Explore now
            </div>
          </div>
        ))}
      </div>

      {/* Trending Tracks */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-[#e51f48]" />
            Trending Now
          </h2>
          <button className="text-[#e51f48] hover:text-[#ff4d6d] transition-colors">
            View all
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {trendingTracks.map(file => (
            <div 
              key={file.id} 
              className="bg-[#0a3747]/70 rounded-xl overflow-hidden hover:bg-[#0a3747] transition-colors group"
            >
              <div className="relative">
                <Image 
                  src={file.coverArt} 
                  alt={file.title} 
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/default-cover.jpg';
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all">
                  <button 
                    onClick={() => handlePlay(file)}
                    className="opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#e51f48] flex items-center justify-center shadow-lg">
                      {currentTrack?.id === file.id && isPlaying ? (
                        <div className="w-5 h-5 bg-white rounded-sm"></div>
                      ) : (
                        <Play className="w-5 h-5 text-white" />
                      )}
                    </div>
                  </button>
                </div>
                <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1 text-xs text-white">
                  {file.views} plays
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-medium text-white truncate mb-1">{file.title}</h3>
                <p className="text-sm text-gray-400 truncate mb-2">{file.artist}</p>
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>{file.genre}</span>
                  <span>{formatDuration(file.duration)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* New Releases */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Music className="w-6 h-6 text-[#e51f48]" />
            New Releases
          </h2>
          <button className="text-[#e51f48] hover:text-[#ff4d6d] transition-colors">
            View all
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {newReleases.map(file => (
            <div 
              key={file.id} 
              className="bg-[#0a3747]/70 rounded-xl overflow-hidden hover:bg-[#0a3747] transition-colors group"
            >
              <div className="relative">
                <Image 
                  src={file.coverArt} 
                  alt={file.title} 
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/default-cover.jpg';
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all">
                  <button 
                    onClick={() => handlePlay(file)}
                    className="opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#e51f48] flex items-center justify-center shadow-lg">
                      <Play className="w-5 h-5 text-white" />
                    </div>
                  </button>
                </div>
                <div className="absolute top-3 left-3 bg-[#e51f48] rounded-full px-2 py-1 text-xs text-white">
                  NEW
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-medium text-white truncate mb-1">{file.title}</h3>
                <p className="text-sm text-gray-400 truncate">{file.artist}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Popular Genres */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <Mic2 className="w-6 h-6 text-[#e51f48]" />
          Popular Genres
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
{popularGenres.map((genre, index) => (
  <div 
    key={genre ?? `unknown-${index}`}
    className="bg-[#0a3747]/70 rounded-xl p-4 text-center hover:bg-[#0a3747] transition-colors cursor-pointer group"
  >
    <div className="w-12 h-12 bg-gradient-to-br from-[#e51f48] to-[#ff4d6d] rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
      <Music className="w-6 h-6 text-white" />
    </div>
    <h3 className="font-medium text-white mb-1">{genre}</h3>
    <p className="text-xs text-gray-400">{getGenreCount(genre!)} tracks</p>
  </div>
))}
        </div>
      </section>
    </div>
  );
}