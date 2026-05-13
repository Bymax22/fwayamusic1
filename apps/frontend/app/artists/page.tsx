'use client';
import { useEffect, useState, useMemo } from 'react';
import { Users, Play, MapPin, Search, SortAsc, SortDesc } from 'lucide-react';
import Image from "next/image";
import { motion } from 'framer-motion';
import Link from 'next/link';

interface Artist {
  id: string;
  name: string;
  imageUrl: string;
  avatarUrl: string;
  followers: number;
  mediaCount: number;
  genre?: string;
  isVerified?: boolean;
  isFollowing?: boolean;
}

type SortOption = 'name' | 'tracks' | 'genre';

export default function ArtistsPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/artists`);
        if (res.ok) {
          const data = await res.json();
          setArtists(data);
        }
      } catch (error) {
        console.error('Failed to fetch artists:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchArtists();
  }, []);

  // Get available genres
  const availableGenres = useMemo(() => {
    const genres = new Set(artists.map((artist) => artist.genre).filter(Boolean));
    return Array.from(genres);
  }, [artists]);

  // Filtered and sorted artists
  const filteredArtists = useMemo(() => {
    let filtered = artists.filter((artist) => {
      const name = artist.name || 'Unknown Artist';
      const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGenre = selectedGenre === 'all' || artist.genre === selectedGenre;
      return matchesSearch && matchesGenre;
    });

    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy) {
        case 'name':
          aValue = (a.name || '').toLowerCase();
          bValue = (b.name || '').toLowerCase();
          break;
        case 'tracks':
          aValue = a.mediaCount || 0;
          bValue = b.mediaCount || 0;
          break;
        case 'genre':
          aValue = a.genre || '';
          bValue = b.genre || '';
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }

      return sortOrder === 'asc' ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number);
    });

    return filtered;
  }, [artists, searchQuery, selectedGenre, sortBy, sortOrder]);

  const toggleSort = (option: SortOption) => {
    if (sortBy === option) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(option);
      setSortOrder('asc');
    }
  };

  return (
    <div className="min-h-screen bg-black p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Users className="w-8 h-8 text-purple-400" />
          <h1 className="text-4xl font-bold text-white">All Artists</h1>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search artists..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/5 rounded-full text-white placeholder-gray-400 focus:outline-none focus:bg-white/10 transition-colors"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="px-4 py-3 bg-white/5 rounded-full text-white focus:outline-none focus:bg-white/10 transition-colors"
              >
                <option value="all">All Genres</option>
                {availableGenres.map(genre => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Sort Options */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => toggleSort('name')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                sortBy === 'name' ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              Name {sortBy === 'name' && (sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />)}
            </button>
            <button
              onClick={() => toggleSort('tracks')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                sortBy === 'tracks' ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              Tracks {sortBy === 'tracks' && (sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />)}
            </button>
            <button
              onClick={() => toggleSort('genre')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                sortBy === 'genre' ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              Genre {sortBy === 'genre' && (sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />)}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredArtists.map((artist, index) => (
            <motion.div
              key={artist.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group"
            >
              <div className="rounded-[32px] bg-white/5 overflow-hidden transition hover:bg-white/10">
                <Link href={`/artists/${artist.id}`} className="block">
                  <div className="relative p-6 text-center">
                    <div className="relative mb-4">
                      <Image
                        src={artist.avatarUrl || artist.imageUrl || '/default-avatar.jpg'}
                        alt={artist.name}
                        width={150}
                        height={150}
                        className="w-full max-w-[150px] aspect-square object-cover rounded-full mx-auto group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/default-avatar.jpg';
                        }}
                      />
                      <div className="absolute inset-0 rounded-full bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>

                    <div className="mb-4">
                      <h3 className="font-semibold text-white text-lg mb-1 group-hover:text-purple-400 transition-colors">
                        {artist.name}
                      </h3>
                      <p className="text-sm text-gray-400 mb-2">{artist.genre || 'Multiple Genres'}</p>
                      <div className="flex items-center justify-center gap-1 text-xs text-gray-400 mb-3">
                        <MapPin className="w-3 h-3" />
                        <span>Global</span>
                      </div>
                      <div className="text-xs text-gray-400 mb-3">
                        <span className="text-purple-400 font-semibold">{artist.mediaCount.toLocaleString()}</span> tracks
                      </div>
                    </div>
                  </div>
                </Link>

                <div className="px-6 pb-6">
                  <div className="flex gap-2">
                    <button className="flex-1 p-2 bg-white/10 text-white rounded-full hover:bg-white/15 transition-colors text-xs font-semibold">
                      Follow
                    </button>
                    <Link
                      href={`/artists/${artist.id}`}
                      className="flex-1 p-2 bg-purple-600 text-white rounded-full hover:bg-purple-500 transition-colors text-xs font-semibold flex items-center justify-center gap-1"
                    >
                      <Play className="w-4 h-4" /> View
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredArtists.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No artists found matching your criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}
