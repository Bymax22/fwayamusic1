"use client";
import { useEffect, useState } from 'react';
import { Play, Heart, Plus,  Download, ListMusic, Folder, History } from 'lucide-react';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { formatDuration } from '@/lib/utils';
import Image from "next/image";
import { AuthProvider } from "../context/AuthContext";
import { ThemeProvider } from "../context/ThemeContext";
import { PaymentProvider } from "../context/PaymentContext";


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
  liked?: boolean;
}

interface Playlist {
  id: number;
  name: string;
  description: string;
  coverArt: string;
  trackCount: number;
  duration: number;
}

export default function LibraryPage() {
 
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [likedSongs, setLikedSongs] = useState<MediaFile[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<MediaFile[]>([]);
  const [activeTab, setActiveTab] = useState<'playlists' | 'liked' | 'recent' | 'downloaded'>('playlists');
  const { currentTrack,  setCurrentTrack, togglePlay } = useAudioPlayer();

  useEffect(() => {
    const fetchData = async () => {
      try {
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
          coverArt: item.coverArt || '/default-cover.jpg',
          views: item.views || 0,
          likes: item.likes || 0,
          genre: item.genre || 'Other',
          liked: Math.random() > 0.5 // Mock liked status
        }));

      
        
        // Mock liked songs
       const liked = formattedData.filter((file: MediaFile) => file.liked).slice(0, 8);
        setLikedSongs(liked);

        // Mock recently played (most viewed)
        const recent = [...formattedData]
          .sort((a, b) => b.views - a.views)
          .slice(0, 8);
        setRecentlyPlayed(recent);

        // Mock playlists
        const mockPlaylists: Playlist[] = [
          { id: 1, name: 'Chill Vibes', description: 'Relaxing tunes for your day', coverArt: '/playlists/chill.jpg', trackCount: 24, duration: 4860 },
          { id: 2, name: 'Workout Mix', description: 'Energy boost for your workout', coverArt: '/playlists/workout.jpg', trackCount: 18, duration: 3240 },
          { id: 3, name: 'Focus Flow', description: 'Concentration and productivity', coverArt: '/playlists/focus.jpg', trackCount: 16, duration: 2880 },
          { id: 4, name: 'Road Trip', description: 'Perfect for long drives', coverArt: '/playlists/roadtrip.jpg', trackCount: 32, duration: 5760 },
        ];
        setPlaylists(mockPlaylists);
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

  const handleCreatePlaylist = () => {
    const name = prompt('Enter playlist name:');
    if (name) {
      const newPlaylist: Playlist = {
        id: Date.now(),
        name,
        description: 'Your new playlist',
        coverArt: '/playlists/default.jpg',
        trackCount: 0,
        duration: 0
      };
      setPlaylists(prev => [newPlaylist, ...prev]);
    }
  };

  const getContent = () => {
    switch (activeTab) {
      case 'playlists':
        return playlists;
      case 'liked':
        return likedSongs;
      case 'recent':
        return recentlyPlayed;
      case 'downloaded':
        return []; // You can implement downloaded files logic
      default:
        return [];
    }
  };

  const getTitle = () => {
    switch (activeTab) {
      case 'playlists': return 'Playlists';
      case 'liked': return 'Liked Songs';
      case 'recent': return 'Recently Played';
      case 'downloaded': return 'Downloads';
      default: return 'Library';
    }
  };

  const getIcon = () => {
    switch (activeTab) {
      case 'playlists': return <ListMusic className="w-6 h-6" />;
      case 'liked': return <Heart className="w-6 h-6" />;
      case 'recent': return <History className="w-6 h-6" />;
      case 'downloaded': return <Download className="w-6 h-6" />;
      default: return <Folder className="w-6 h-6" />;
    }
  };

  return (
    <ThemeProvider>
      <AuthProvider>
        <PaymentProvider>
    <div className="p-6 max-w-7xl mx-auto bg-gradient-to-br from-[#0a3747]/95 to-[#0a1f29]/95 min-h-screen pb-32">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Your Library</h1>
          <p className="text-gray-400">Manage your music collection</p>
        </div>
        <button 
          onClick={handleCreatePlaylist}
          className="flex items-center gap-2 px-4 py-2 bg-[#e51f48] hover:bg-[#ff4d6d] text-white rounded-xl transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Playlist
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-4 border-b border-[#0a3747] pb-2 mb-6 overflow-x-auto">
        {[
          { id: 'playlists', label: 'Playlists', icon: <ListMusic className="w-4 h-4" /> },
          { id: 'liked', label: 'Liked Songs', icon: <Heart className="w-4 h-4" /> },
          { id: 'recent', label: 'Recently Played', icon: <History className="w-4 h-4" /> },
          { id: 'downloaded', label: 'Downloads', icon: <Download className="w-4 h-4" /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'playlists' | 'liked' | 'recent' | 'downloaded')}
            className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id 
                ? 'text-[#e51f48] border-b-2 border-[#e51f48]' 
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div>
        <div className="flex items-center gap-2 mb-6">
          {getIcon()}
          <h2 className="text-2xl font-bold text-white">{getTitle()}</h2>
          <span className="text-gray-400">({getContent().length})</span>
        </div>

{activeTab === 'playlists'
  ? (getContent() as Playlist[]).map((playlist) => (
      <div 
        key={playlist.id} 
        className="bg-[#0a3747]/70 rounded-xl overflow-hidden hover:bg-[#0a3747] transition-colors group"
      >
        <div className="relative">
          <Image 
            src={playlist.coverArt} 
            alt={playlist.name} 
            className="w-full h-48 object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/default-cover.jpg';
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all">
            <button className="opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all">
              <div className="w-12 h-12 rounded-full bg-[#e51f48] flex items-center justify-center shadow-lg">
                <Play className="w-5 h-5 text-white" />
              </div>
            </button>
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-medium text-white truncate mb-1">{playlist.name}</h3>
          <p className="text-sm text-gray-400 truncate mb-2">{playlist.description}</p>
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>{playlist.trackCount} tracks</span>
            <span>{formatDuration(playlist.duration)}</span>
          </div>
        </div>
      </div>
    ))
: (getContent() as MediaFile[]).map((file: MediaFile) => (
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
        </div>
        <div className="p-4">
          <h3 className="font-medium text-white truncate mb-1">{file.title}</h3>
          <p className="text-sm text-gray-400 truncate">{file.artist}</p>
        </div>
      </div>
    ))
}

        {getContent().length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-[#0a3747] rounded-full flex items-center justify-center mx-auto mb-4">
              {getIcon()}
            </div>
            <h3 className="text-xl font-medium text-gray-400 mb-2">No {getTitle().toLowerCase()} yet</h3>
            <p className="text-gray-500">
              {activeTab === 'liked' && 'Like some songs to see them here'}
              {activeTab === 'recent' && 'Play some music to build your history'}
              {activeTab === 'downloaded' && 'Download songs for offline listening'}
              {activeTab === 'playlists' && 'Create your first playlist to get started'}
            </p>
          </div>
        )}
      </div>
    </div>
        </PaymentProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}