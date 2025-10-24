"use client";
import { useEffect, useState } from 'react';
import { Pause, Heart, Search, Disc } from 'lucide-react';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { formatDuration } from '@/lib/utils';
import Image from "next/image";

interface MediaFile {
  id: number;
  title: string;
  artist: string;
  url: string;
  duration: number;
  format: string;
  createdAt: string;
  coverArt: string;
  views: number;
  likes: number;
  genre?: string;
}

interface Artist {
  id: number;
  name: string;
  avatar: string;
  followers: number;
  tracks: number;
}

export default function SearchPage() {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MediaFile[]>([]);
  const [artistResults, setArtistResults] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'songs' | 'artists'>('all');
  
  const { currentTrack, isPlaying, togglePlay, setCurrentTrack } = useAudioPlayer();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:3001/media', {
          credentials: 'include',
        });
        const { data } = await response.json();
        const formattedData = (data as MediaFile[]).map((item) => ({
          id: item.id,
          title: item.title || 'Untitled',
          artist: item.artist || 'Unknown Artist',
          url: item.url,
          duration: item.duration || 0,
          format: item.format || 'mp3',
          createdAt: item.createdAt,
          coverArt: item.coverArt || '/default-cover.jpg',
          views: item.views || 0,
          likes: item.likes || 0,
          genre: item.genre || 'Other'
        }));
        setMediaFiles(formattedData);
        // Mock artists data
        const mockArtists: Artist[] = [
          { id: 1, name: 'Fwaya Music', avatar: '/artists/fwaya.jpg', followers: 15000, tracks: 45 },
          { id: 2, name: 'The Weeknd', avatar: '/artists/weeknd.jpg', followers: 35000000, tracks: 89 },
          { id: 3, name: 'Drake', avatar: '/artists/drake.jpg', followers: 42000000, tracks: 156 },
          { id: 4, name: 'Beyoncé', avatar: '/artists/beyonce.jpg', followers: 28000000, tracks: 112 },
        ];
        setArtists(mockArtists);
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setArtistResults([]);
      return;
    }
    const query = searchQuery.toLowerCase();
    // Search songs
    const songResults = mediaFiles.filter(file => 
      file.title.toLowerCase().includes(query) ||
      file.artist.toLowerCase().includes(query) ||
      file.genre?.toLowerCase().includes(query)
    );
    setSearchResults(songResults);
    // Search artists
    const artistResults = artists.filter(artist =>
      artist.name.toLowerCase().includes(query)
    );
    setArtistResults(artistResults);
  }, [searchQuery, mediaFiles, artists]);

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

  const getFilteredResults = () => {
    switch (activeTab) {
      case 'songs':
        return searchResults;
      case 'artists':
        return [];
      default:
        return searchResults;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gradient-to-br from-[#0a3747]/95 to-[#0a1f29]/95 min-h-screen pb-32">
      {/* Search Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-6">Search</h1>
        {/* Search Input */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
          <input
            type="text"
            placeholder="Search for songs, artists, or genres..."
            className="w-full pl-12 pr-4 py-4 bg-[#0a3747]/70 border border-[#0a3747] text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#e51f48] focus:border-transparent placeholder-gray-400 text-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {/* Search Tabs */}
        <div className="flex gap-4 border-b border-[#0a3747] pb-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'all' 
                ? 'text-[#e51f48] border-b-2 border-[#e51f48]' 
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab('songs')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'songs' 
                ? 'text-[#e51f48] border-b-2 border-[#e51f48]' 
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Songs
          </button>
          <button
            onClick={() => setActiveTab('artists')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'artists' 
                ? 'text-[#e51f48] border-b-2 border-[#e51f48]' 
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Artists
          </button>
        </div>
      </div>

      {/* Loading Spinner */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <svg className="animate-spin h-10 w-10 text-[#e51f48]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
          </svg>
          <span className="ml-4 text-[#e51f48] font-semibold text-lg">Loading...</span>
        </div>
      ) : (
        <>
          {/* Search Results */}
          {searchQuery.trim() ? (
            <div>
              {/* Songs Results */}
              {(activeTab === 'all' || activeTab === 'songs') && searchResults.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-white mb-4">Songs</h2>
                  <div className="bg-[#0a3747]/70 rounded-xl overflow-hidden">
                    {searchResults.map((file, index) => (
                      <div 
                        key={file.id} 
                        className={`flex items-center gap-4 p-4 transition-colors ${
                          currentTrack?.id === file.id 
                            ? 'bg-[#0a3747]' 
                            : 'hover:bg-[#0a3747]/50'
                        }`}
                      >
                        <div className="text-gray-400 w-8 text-center">
                          {currentTrack?.id === file.id && isPlaying ? (
                            <Pause 
                              className="w-5 h-5 text-[#e51f48] cursor-pointer" 
                              onClick={() => handlePlay(file)}
                            />
                          ) : (
                            <span 
                              className="cursor-pointer hover:text-[#e51f48] transition-colors"
                              onClick={() => handlePlay(file)}
                            >
                              {index + 1}
                            </span>
                          )}
                        </div>
                        <Image 
                          src={file.coverArt} 
                          alt={file.title} 
                          className="w-12 h-12 rounded-lg object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/default-cover.jpg';
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium truncate ${
                            currentTrack?.id === file.id ? 'text-[#e51f48]' : 'text-white'
                          }`}>
                            {file.title}
                          </p>
                          <p className="text-sm text-gray-400 truncate">{file.artist}</p>
                        </div>
                        <div className="text-gray-400 text-sm">
                          {formatDuration(file.duration)}
                        </div>
                        <button className="text-gray-400 hover:text-[#e51f48] transition-colors">
                          <Heart className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Artists Results */}
              {(activeTab === 'all' || activeTab === 'artists') && artistResults.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-white mb-4">Artists</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {artistResults.map(artist => (
                      <div key={artist.id} className="bg-[#0a3747]/70 rounded-xl p-4 text-center hover:bg-[#0a3747] transition-colors">
                        <Image
                          src={artist.avatar}
                          alt={artist.name}
                          className="w-24 h-24 rounded-full mx-auto mb-3 object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/default-avatar.jpg';
                          }}
                        />
                        <h3 className="font-medium text-white mb-1">{artist.name}</h3>
                        <p className="text-sm text-gray-400">{artist.followers.toLocaleString()} followers</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Results */}
              {getFilteredResults().length === 0 && artistResults.length === 0 && (
                <div className="text-center py-12">
                  <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-400 mb-2">No results found</h3>
                  <p className="text-gray-500">Try different keywords or check the spelling</p>
                </div>
              )}
            </div>
          ) : (
            /* Recent Searches / Popular Searches */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Popular Genres */}
              <div>
                <h2 className="text-xl font-bold text-white mb-4">Browse Genres</h2>
                <div className="grid grid-cols-2 gap-3">
                  {['Hip Hop', 'Pop', 'R&B', 'Rock', 'Electronic', 'Jazz', 'Classical', 'Reggae'].map(genre => (
                    <button
                      key={genre}
                      onClick={() => setSearchQuery(genre)}
                      className="p-4 bg-[#0a3747]/70 rounded-xl text-white hover:bg-[#0a3747] transition-colors text-left"
                    >
                      <Disc className="w-6 h-6 mb-2 text-[#e51f48]" />
                      <div className="font-medium">{genre}</div>
                    </button>
                  ))}
                </div>
              </div>
              {/* Popular Artists */}
              <div>
                <h2 className="text-xl font-bold text-white mb-4">Popular Artists</h2>
                <div className="space-y-3">
                  {artists.slice(0, 4).map(artist => (
                    <button
                      key={artist.id}
                      onClick={() => setSearchQuery(artist.name)}
                      className="w-full flex items-center gap-3 p-3 bg-[#0a3747]/70 rounded-xl hover:bg-[#0a3747] transition-colors"
                    >
                      <Image
                        src={artist.avatar}
                        alt={artist.name}
                        className="w-12 h-12 rounded-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/default-avatar.jpg';
                        }}
                      />
                      <div className="text-left">
                        <div className="font-medium text-white">{artist.name}</div>
                        <div className="text-sm text-gray-400">{artist.followers.toLocaleString()} followers</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}