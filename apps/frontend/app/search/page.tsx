"use client";
import { useEffect, useState } from 'react';
import { Pause, Play, Search, Disc } from 'lucide-react';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { formatDuration } from '@/lib/utils';
import Image from 'next/image';

interface MediaFile {
  id: number;
  title: string;
  artist: string;
  url: string;
  duration: number;
  format?: string;
  createdAt?: string;
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
  tracks?: number;
}

function normalizeMedia(item: any): MediaFile {
  return {
    id: item.id,
    title: item.title || 'Untitled',
    artist: item.artist || 'Unknown Artist',
    url: item.url,
    duration: item.duration || 0,
    format: item.format || 'mp3',
    createdAt: item.createdAt || '',
    coverArt: item.coverArt || '/default-cover.jpg',
    views: item.views || 0,
    likes: item.likes || 0,
    genre: item.genre || 'Other',
  };
}

export default function SearchPage() {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MediaFile[]>([]);
  const [artistResults, setArtistResults] = useState<Artist[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'songs' | 'artists'>('all');

  const { currentTrack, isPlaying, togglePlay, playTrack } = useAudioPlayer();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mediaResponse, artistsResponse] = await Promise.all([
          fetch('/api/media', { credentials: 'include' }),
          fetch('/api/artists'),
        ]);

        const mediaJson = await mediaResponse.json();
        const mediaArray = Array.isArray(mediaJson)
          ? mediaJson
          : Array.isArray(mediaJson.data)
          ? mediaJson.data
          : [];

        setMediaFiles(mediaArray.map(normalizeMedia));

        const artistsJson = await artistsResponse.json();
        setArtists(Array.isArray(artistsJson.artists) ? artistsJson.artists : []);
      } catch (err) {
        console.error('Fetch error:', err);
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
    const songResults = mediaFiles.filter(
      (file) =>
        file.title.toLowerCase().includes(query) ||
        file.artist.toLowerCase().includes(query) ||
        file.genre?.toLowerCase().includes(query)
    );
    const matchingArtists = artists.filter((artist) => artist.name.toLowerCase().includes(query));

    setSearchResults(songResults);
    setArtistResults(matchingArtists);
  }, [searchQuery, mediaFiles, artists]);

  const handlePlay = (file: MediaFile) => {
    if (currentTrack?.id === file.id) {
      togglePlay();
    } else {
      playTrack({
        id: file.id,
        title: file.title,
        artist: file.artist,
        url: file.url,
        coverArt: file.coverArt,
        duration: file.duration,
      });
    }
  };

  const getFilteredResults = () => {
    if (activeTab === 'songs') {
      return searchResults;
    }
    if (activeTab === 'artists') {
      return artistResults;
    }
    return searchResults;
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="relative overflow-hidden">
        <div className="relative p-6 max-w-7xl mx-auto pb-32">
          <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr] items-end mb-10">
            <div className="rounded-[2rem] bg-black p-6">
              <div className="flex flex-col gap-4">
                <div className="space-y-3">
                  <p className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-1 text-xs uppercase tracking-[0.24em] text-purple-300">Search</p>
                  <h1 className="text-4xl font-semibold tracking-tight">Find the track, artist, or mood you want.</h1>
                  <p className="max-w-2xl text-gray-400">Your favouritn tracks, artists and news awaits you.</p>
                </div>
                <div className="relative mt-4">
                  <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-5 h-5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for songs, artists, playlists..."
                    className="w-full rounded-full bg-white/5 py-4 pl-12 pr-4 text-white placeholder:text-white/40 outline-none transition focus:ring-2 focus:ring-purple-400/20"
                  />
                </div>
                <div className="flex flex-wrap gap-3">
                  {['All', 'Songs', 'Artists'].map((tab) => {
                    const tabKey = tab.toLowerCase() as 'all' | 'songs' | 'artists';
                    return (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tabKey)}
                        className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                          activeTab === tabKey ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'bg-white/10 text-gray-300 hover:bg-white/15'
                        }`}
                      >
                        {tab}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[2rem] bg-black p-6">
                <h2 className="text-lg font-semibold text-white">Popular Genres</h2>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {['Hip Hop', 'Pop', 'R&B', 'Rock', 'Electronic', 'Jazz', 'Classical', 'Reggae'].map((genre) => (
                    <button
                      key={genre}
                      onClick={() => setSearchQuery(genre)}
                      className="flex items-center gap-3 rounded-3xl bg-white/10 px-4 py-3 text-left text-white transition hover:bg-white/15"
                    >
                      <Disc className="w-5 h-5 text-purple-300" />
                      <span className="font-medium text-sm">{genre}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-[2rem] bg-black p-6">
                <h2 className="text-lg font-semibold text-white">Popular Artists</h2>
                <div className="mt-4 space-y-3">
                  {artists.slice(0, 4).map((artist) => (
                    <button
                      key={artist.id}
                      onClick={() => setSearchQuery(artist.name)}
                      className="flex w-full items-center gap-3 rounded-3xl bg-white/10 px-4 py-3 text-left transition hover:bg-white/15"
                    >
                      <Image
                        src={artist.avatar}
                        alt={artist.name}
                        width={48}
                        height={48}
                        className="h-12 w-12 rounded-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/default-avatar.jpg';
                        }}
                      />
                      <div>
                        <div className="font-medium text-white">{artist.name}</div>
                        <div className="text-sm text-gray-400">{artist.followers.toLocaleString()} followers</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {searchQuery.trim() ? (
            <div className="space-y-8">
              {(activeTab === 'all' || activeTab === 'songs') && searchResults.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-semibold">Songs</h2>
                    <span className="text-sm text-gray-400">{searchResults.length} results</span>
                  </div>
                  <div className="grid gap-4 xl:grid-cols-2">
                    {searchResults.map((file) => (
                      <div
                        key={file.id}
                        className={`group rounded-[2rem] bg-black p-5 transition hover:bg-white/5 ${
                          currentTrack?.id === file.id ? 'ring-1 ring-purple-400/30' : ''
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="relative h-20 w-20 overflow-hidden rounded-3xl bg-[#121016]">
                            <Image
                              src={file.coverArt}
                              alt={file.title}
                              fill
                              className="object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/default-cover.jpg';
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <h3 className="truncate text-lg font-semibold text-white">{file.title}</h3>
                                <p className="text-sm text-gray-400 truncate">{file.artist}</p>
                              </div>
                              <button
                                onClick={() => handlePlay(file)}
                                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-purple-600 text-white transition hover:bg-purple-500"
                              >
                                {currentTrack?.id === file.id && isPlaying ? (
                                  <Pause className="w-5 h-5" />
                                ) : (
                                  <Play className="w-5 h-5" />
                                )}
                              </button>
                            </div>
                            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-gray-400">
                              <span>{formatDuration(file.duration)}</span>
                                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
                                <Disc className="w-4 h-4 text-purple-300" />
                                {file.genre || 'Genre'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(activeTab === 'all' || activeTab === 'artists') && artistResults.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-semibold">Artists</h2>
                    <span className="text-sm text-gray-400">{artistResults.length} results</span>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {artistResults.map((artist) => (
                      <div key={artist.id} className="rounded-[2rem] bg-black p-5 text-center transition hover:bg-white/5">
                        <div className="mx-auto mb-4 h-24 w-24 overflow-hidden rounded-full bg-[#121016]">
                          <Image
                            src={artist.avatar}
                            alt={artist.name}
                            fill
                            className="object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/default-avatar.jpg';
                            }}
                          />
                        </div>
                        <h3 className="text-lg font-semibold text-white">{artist.name}</h3>
                        <p className="mt-2 text-sm text-gray-400">{artist.followers.toLocaleString()} followers</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {searchQuery.trim() && getFilteredResults().length === 0 && artistResults.length === 0 && (
                <div className="rounded-[2rem] bg-[#09080f]/90 p-12 text-center text-gray-400">
                  <Search className="mx-auto mb-4 h-16 w-16 text-gray-400" />
                  <h3 className="text-2xl font-semibold text-white mb-2">No results found</h3>
                  <p className="text-sm text-gray-400">Try different keywords or refine your search.</p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}




