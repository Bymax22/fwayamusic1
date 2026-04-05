// apps/player/src/app/page.tsx
// @ts-nocheck
'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdvancedPlayer } from './components/AdvancedPlayer';
import { 
  Music, 
  Heart, 
  Play, 
  Pause,
  ListMusic,
  RotateCw,
  Volume2,
  BarChart3,
  Smartphone,
  ShieldCheck,
  Sparkles,
  Flame,
  Clock,
  Users,
  TrendingUp,
  SkipBack,
  SkipForward,
  VolumeX
} from 'lucide-react';

interface BackendMedia {
  id: number;
  title: string;
  url: string;
  artCoverUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  genre?: string;
  accessType: 'FREE' | 'PREMIUM' | 'PAY_PER_VIEW';
  price?: number;
  currency?: string;
  isDRMProtected: boolean;
  playCount?: number;
  downloadCount?: number;
  isExplicit?: boolean;
  user?: {
    id: number;
    displayName?: string;
    username?: string;
    avatarUrl?: string;
  };
  interactions?: Array<{ liked: boolean }>;
}

interface Track {
  id: number;
  title: string;
  artist?: string;
  artistName?: string;
  artCoverUrl?: string;
  url: string;
  duration?: number;
  genre?: string;
  accessType: 'FREE' | 'PREMIUM' | 'PAY_PER_VIEW';
  price?: number;
  currency?: string;
  isDRMProtected: boolean;
  playCount?: number;
}

export default function Home() {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<{ message: string; details?: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [likedTracks, setLikedTracks] = useState<number[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<number[]>([]);
  const [allTracks, setAllTracks] = useState<Track[]>([]);
  const [hoveredTrack, setHoveredTrack] = useState<number | null>(null);
  
  // Mock tracks for demo
  const mockTracks: Track[] = [
    {
      id: 1,
      title: 'Midnight Dreams',
      artist: 'Luna Echo',
      artCoverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      duration: 180,
      genre: 'Electronic',
      accessType: 'FREE',
      isDRMProtected: false,
      playCount: 1250,
    },
    {
      id: 2,
      title: 'Neon Nights',
      artist: 'Cyber Wave',
      artCoverUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      duration: 240,
      genre: 'Synthwave',
      accessType: 'PREMIUM',
      price: 9.99,
      isDRMProtected: true,
      playCount: 2840,
    },
    {
      id: 3,
      title: 'Digital Soul',
      artist: 'Pixel Dreams',
      artCoverUrl: 'https://images.unsplash.com/photo-1514575950555-fdcb6b3a0c1e?w=300&h=300&fit=crop',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
      duration: 210,
      genre: 'Lo-Fi',
      accessType: 'FREE',
      isDRMProtected: false,
      playCount: 5420,
    },
    {
      id: 4,
      title: 'Electric Paradise',
      artist: 'Neon Sky',
      artCoverUrl: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=300&h=300&fit=crop',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
      duration: 195,
      genre: 'EDM',
      accessType: 'PAY_PER_VIEW',
      price: 2.99,
      isDRMProtected: true,
      playCount: 3210,
    },
    {
      id: 5,
      title: 'Cosmic Journey',
      artist: 'Space Waves',
      artCoverUrl: 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=300&h=300&fit=crop',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
      duration: 265,
      genre: 'Ambient',
      accessType: 'FREE',
      isDRMProtected: false,
      playCount: 1890,
    },
    {
      id: 6,
      title: 'Rhythm Revolution',
      artist: 'Beat Masters',
      artCoverUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&h=300&fit=crop',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
      duration: 220,
      genre: 'House',
      accessType: 'PREMIUM',
      price: 12.99,
      isDRMProtected: true,
      playCount: 4560,
    },
  ];

  // Fetch tracks from API
  useEffect(() => {
    const fetchTracks = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const response = await fetch(`${apiUrl}/api/v1/media`, {
          credentials: 'include',
          headers: { 'Accept': 'application/json' }
        });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const mediaData = await response.json() as BackendMedia[];
        
        // Transform backend data to match Track interface
        const transformedTracks = (Array.isArray(mediaData) ? mediaData : [mediaData]).map((item: BackendMedia) => ({
          id: item.id,
          title: item.title || 'Untitled',
          artist: item.user?.displayName || item.user?.username || 'Unknown Artist',
          artistName: item.user?.displayName || item.user?.username || 'Unknown Artist',
          artCoverUrl: item.artCoverUrl || item.thumbnailUrl || '/default-cover.jpg',
          url: item.url,
          duration: item.duration,
          genre: item.genre,
          accessType: item.accessType,
          price: item.price,
          currency: item.currency || 'ZMW',
          isDRMProtected: item.isDRMProtected,
          playCount: item.playCount || 0,
        }));
        
        setAllTracks(transformedTracks);
        setIsLoading(false);
      } catch (err) {
        console.error('API fetch failed, using mock data:', err);
        // Use mock data as fallback
        setAllTracks(mockTracks);
        setIsLoading(false);
      }
    };
    
    fetchTracks();
  }, []);
  
  // Load liked tracks and recently played from localStorage
  useEffect(() => {
    const savedLikes = localStorage.getItem('liked_tracks');
    if (savedLikes) {
      setLikedTracks(JSON.parse(savedLikes));
    }
    
    const savedRecent = localStorage.getItem('recently_played');
    if (savedRecent) {
      setRecentlyPlayed(JSON.parse(savedRecent));
    }
  }, []);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Ignore shortcuts when typing in input fields
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.code) {
        case 'Space':
          event.preventDefault();
          if (showPlayer) {
            setIsPlaying(!isPlaying);
          }
          break;
        case 'ArrowRight':
          event.preventDefault();
          if (showPlayer) {
            const currentIndex = allTracks.findIndex(t => t.id === currentTrack?.id);
            if (currentIndex !== -1) {
              const nextTrack = allTracks[(currentIndex + 1) % allTracks.length];
              setCurrentTrack(nextTrack);
            }
          }
          break;
        case 'ArrowLeft':
          event.preventDefault();
          if (showPlayer) {
            const currentIndex = allTracks.findIndex(t => t.id === currentTrack?.id);
            if (currentIndex !== -1) {
              const prevTrack = allTracks[(currentIndex - 1 + allTracks.length) % allTracks.length];
              setCurrentTrack(prevTrack);
            }
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying, showPlayer, currentTrack, allTracks]);
  
  const handlePlayTrack = useCallback((track: Track) => {
    if (currentTrack?.id === track.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentTrack(track);
      setIsPlaying(true);
      setShowPlayer(true);
      
      // Update recently played
      const updatedRecent = [track.id, ...recentlyPlayed.filter(id => id !== track.id)].slice(0, 10);
      setRecentlyPlayed(updatedRecent);
      localStorage.setItem('recently_played', JSON.stringify(updatedRecent));
      
      // Track play interaction
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      fetch(`${apiUrl}/api/v1/media/${track.id}/interact/play`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      }).catch(err => console.error('Failed to track play:', err));
    }
  }, [currentTrack, isPlaying, recentlyPlayed]);
  
  const handleLikeTrack = useCallback((trackId: number) => {
    setLikedTracks(prev => {
      const updated = prev.includes(trackId)
        ? prev.filter(id => id !== trackId)
        : [...prev, trackId];
      localStorage.setItem('liked_tracks', JSON.stringify(updated));
      
      // Track like interaction
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      fetch(`${apiUrl}/api/v1/media/${trackId}/interact/like`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      }).catch(err => console.error('Failed to track like:', err));
      
      return updated;
    });
  }, []);
  
  const filteredTracks = allTracks.filter(track => {
    const matchesSearch = track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          track.artistName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || 
                           (selectedCategory === 'free' && track.accessType === 'FREE') ||
                           (selectedCategory === 'premium' && track.accessType !== 'FREE');
    return matchesSearch && matchesCategory;
  });
  
  const stats = [
    { icon: TrendingUp, label: 'Total Plays', value: '2.5M' },
    { icon: Heart, label: 'Likes', value: '128K' },
    { icon: Users, label: 'Active Users', value: '15.3K' },
    { icon: Clock, label: 'Hours Listened', value: '892K' },
  ];
  
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>

        <div className="container mx-auto px-4 py-16 sm:py-24 relative z-10">
          {/* @ts-expect-error framer-motion className support */}
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            {/* @ts-expect-error framer-motion className support */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm mb-6 border border-white/20 hover:border-pink-400 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-pink-400" />
              <span className="text-sm font-medium">Premium Audio Experience</span>
            </motion.div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-pink-300 to-white bg-clip-text text-transparent leading-tight">
              Fwaya Music Player
            </h1>
            
            <p className="text-lg sm:text-xl text-gray-200 max-w-2xl mx-auto mb-10 leading-relaxed">
              Experience premium music streaming with advanced DRM protection, stunning real-time visualizations, and seamless playback across all devices.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {/* @ts-expect-error framer-motion event handlers support */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 bg-gradient-to-r from-pink-500 via-pink-500 to-pink-600 rounded-full font-semibold shadow-lg hover:shadow-pink-500/50 transition-all w-full sm:w-auto"
                onClick={() => {
                  if (filteredTracks[0]) {
                    handlePlayTrack(filteredTracks[0]);
                  }
                }}
              >
                <Play className="inline w-4 h-4 mr-2" />
                Start Listening
              </motion.button>
              
              {/* @ts-expect-error framer-motion className support */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 bg-white/10 backdrop-blur-sm rounded-full font-semibold hover:bg-white/20 transition-all border border-white/20 w-full sm:w-auto"
              >
                <ListMusic className="inline w-4 h-4 mr-2" />
                Explore Library
              </motion.button>
            </div>
          </motion.div>
          
          {/* Stats Section */}
          {/* @ts-expect-error framer-motion className support */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-16"
          >
            {stats.map((stat, index) => (
              // @ts-expect-error framer-motion className support
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="bg-white/5 backdrop-blur-md p-5 rounded-xl text-center border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all"
              >
                <stat.icon className="w-6 h-6 text-pink-400 mx-auto mb-3" />
                <div className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-xs sm:text-sm text-gray-300 mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
      
      {/* Features Section */}
      <div className="container mx-auto px-4 py-20">
        {/* @ts-expect-error framer-motion className support */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">Premium Features</h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Discover what makes Fwaya the ultimate music experience
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: ShieldCheck, title: 'DRM Protection', description: 'Secure playback with device binding and encryption' },
            { icon: BarChart3, title: 'Audio Visualizer', description: 'Real-time waveform with stunning effects' },
            { icon: Smartphone, title: 'Cross-Platform', description: 'Seamless experience on all devices' },
            { icon: RotateCw, title: 'High Quality', description: 'Studio-grade audio fidelity' },
          ].map((feature, index) => (
            // @ts-expect-error framer-motion className support
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              className="group relative glass-card p-8 text-center overflow-hidden hover:border-pink-400/50 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Track Library Section */}
      <div className="container mx-auto px-4 py-20 bg-gray-800/30">
        {error && (
          // @ts-expect-error framer-motion className support
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 backdrop-blur-sm"
          >
            <p className="font-semibold text-lg">{error.message}</p>
            {error.details && <p className="text-sm mt-2 text-red-400/80">{error.details}</p>}
          </motion.div>
        )}
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-2">Track Library</h2>
            <p className="text-gray-400 text-lg">Discover and play your favorite tracks</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <input
                type="text"
                placeholder="Search tracks or artists..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2.5 pr-10 bg-white/5 rounded-lg border border-white/10 focus:border-pink-400 focus:bg-white/10 focus:outline-none transition-all backdrop-blur-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2.5 bg-white/5 rounded-lg border border-white/10 focus:border-pink-400 focus:bg-white/10 focus:outline-none transition-all backdrop-blur-sm cursor-pointer"
            >
              <option value="all">All</option>
              <option value="free">Free</option>
              <option value="premium">Premium</option>
            </select>
          </div>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              // @ts-expect-error framer-motion className support
              <motion.div
                key={i}
                initial={{ opacity: 0.5 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05, repeat: Infinity, repeatType: 'reverse' }}
                className="glass-card p-4 overflow-hidden"
              >
                <div className="w-full aspect-square bg-white/5 rounded-lg mb-4 animate-pulse" />
                <div className="h-4 bg-white/5 rounded w-3/4 mb-2 animate-pulse" />
                <div className="h-3 bg-white/5 rounded w-1/2 animate-pulse" />
              </motion.div>
            ))}
          </div>
        ) : filteredTracks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {filteredTracks.map((track, index) => (
                // @ts-expect-error framer-motion event handlers and className support
                <motion.div
                  key={track.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  onMouseEnter={() => setHoveredTrack(track.id)}
                  onMouseLeave={() => setHoveredTrack(null)}
                  className="group glass-card overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 hover:border-pink-400/50"
                  onClick={() => handlePlayTrack(track)}
                >
                  {/* Image Container */}
                  <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-700 to-gray-900">
                    {track.artCoverUrl ? (
                      <img
                        src={track.artCoverUrl}
                        alt={track.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-125"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-500/20 to-purple-500/20">
                        <Music className="w-12 h-12 text-white/20" />
                      </div>
                    )}
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                      {currentTrack?.id === track.id && isPlaying ? (
                        <>
                          <div className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center text-white animate-pulse">
                            <Pause className="w-5 h-5" />
                          </div>
                        </>
                      ) : (
                        <div className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center text-white group-hover:bg-pink-600 transition-colors transform group-hover:scale-110">
                          <Play className="w-6 h-6 ml-1" />
                        </div>
                      )}
                    </div>

                    {/* Badge */}
                    {track.accessType !== 'FREE' && (
                      <div className="absolute top-3 right-3 px-3 py-1 bg-amber-500/90 backdrop-blur-sm text-white text-xs font-bold rounded-full border border-amber-400/50">
                        {track.accessType === 'PREMIUM' ? '⭐ PREMIUM' : '🎁 PPV'}
                      </div>
                    )}

                    {/* Play Count Badge */}
                    {track.playCount !== undefined && track.playCount > 0 && (
                      <div className="absolute top-3 left-3 px-2 py-1 bg-black/40 backdrop-blur-sm text-white text-xs rounded-full flex items-center gap-1">
                        <Play className="w-3 h-3" />
                        {track.playCount.toLocaleString()}
                      </div>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 pb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white truncate group-hover:text-pink-400 transition-colors">
                          {track.title}
                        </h3>
                        <p className="text-sm text-gray-400 truncate group-hover:text-gray-300 transition-colors">
                          {track.artistName || 'Unknown Artist'}
                        </p>
                      </div>
                      {/* @ts-expect-error framer-motion event handlers support */}
                      <motion.button
                        whileTap={{ scale: 0.8 }}
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          handleLikeTrack(track.id);
                        }}
                        className={`p-2 rounded-full transition-all flex-shrink-0 ${
                          likedTracks.includes(track.id)
                            ? 'bg-pink-500/20 text-pink-400'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-pink-400'
                        }`}
                      >
                        <Heart className="w-5 h-5" fill={likedTracks.includes(track.id) ? 'currentColor' : 'none'} />
                      </motion.button>
                    </div>
                    
                    {/* Metadata */}
                    <div className="flex items-center justify-between text-xs text-gray-500 mt-2 pt-2 border-t border-white/5">
                      <span>{track.duration ? `${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, '0')}` : 'N/A'}</span>
                      {track.price && (
                        <span className="text-amber-400 font-semibold">{track.price} {track.currency || 'ZMW'}</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <Music className="w-20 h-20 text-gray-700 mb-6" />
            <p className="text-gray-500 text-lg font-medium">No tracks found</p>
            <p className="text-gray-600 text-sm mt-2">Try adjusting your search or filters</p>
          </motion.div>
        )}
      </div>
      
      {/* Player Modal */}
      <AnimatePresence>
        {showPlayer && currentTrack && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
          >
            {/* @ts-expect-error framer-motion className support */}
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 bg-gradient-to-t from-gray-950 via-gray-900 to-gray-800 rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              {/* Close Button */}
              <button
                onClick={() => {
                  setShowPlayer(false);
                  setIsPlaying(false);
                }}
                className="absolute top-6 right-6 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <span className="text-white text-xl">✕</span>
              </button>

              {/* Player Content */}
              <div className="container mx-auto px-4 py-12">
                {/* Album Art */}
                {/* @ts-expect-error framer-motion className support */}
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="flex justify-center mb-8"
                >
                  <div className="relative w-48 h-48 sm:w-64 sm:h-64 rounded-2xl overflow-hidden shadow-2xl">
                    {currentTrack.artCoverUrl ? (
                      <img
                        src={currentTrack.artCoverUrl}
                        alt={currentTrack.title}
                        className={`w-full h-full object-cover transition-transform duration-300 ${
                          isPlaying ? 'animate-spin-slow' : ''
                        }`}
                        style={{
                          animation: isPlaying ? 'spin 8s linear infinite' : 'none'
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                        <Music className="w-24 h-24 text-white/50" />
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Track Info */}
                {/* @ts-expect-error framer-motion className support */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-center mb-10"
                >
                  <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                    {currentTrack.title}
                  </h2>
                  <p className="text-lg text-gray-300 mb-4">
                    {currentTrack.artist}
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    {currentTrack.genre && (
                      <span className="px-3 py-1 bg-white/10 rounded-full text-sm text-gray-300">
                        {currentTrack.genre}
                      </span>
                    )}
                    {currentTrack.isDRMProtected && (
                      <span className="px-3 py-1 bg-pink-500/20 rounded-full text-sm text-pink-300 flex items-center gap-1">
                        <ShieldCheck className="w-4 h-4" />
                        DRM Protected
                      </span>
                    )}
                  </div>
                </motion.div>

                {/* Player Controls */}
                {/* @ts-expect-error framer-motion className support */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white/5 backdrop-blur-md rounded-2xl p-8 mb-8 border border-white/10"
                >
                  {/* Progress Bar */}
                  <div className="mb-6">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value="0"
                      className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
                      style={{
                        background: `linear-gradient(to right, rgb(236, 72, 153) 0%, rgb(236, 72, 153) 30%, rgb(55, 65, 81) 30%, rgb(55, 65, 81) 100%)`
                      }}
                    />
                    <div className="flex justify-between text-xs sm:text-sm text-gray-400 mt-2">
                      <span>0:00</span>
                      <span>{currentTrack.duration ? `${Math.floor(currentTrack.duration / 60)}:${(currentTrack.duration % 60).toString().padStart(2, '0')}` : 'N/A'}</span>
                    </div>
                  </div>

                  {/* Main Controls */}
                  <div className="flex items-center justify-center gap-6 mb-6">
                    <button
                      onClick={() => {
                        const currentIndex = allTracks.findIndex(t => t.id === currentTrack.id);
                        const prevTrack = allTracks[(currentIndex - 1 + allTracks.length) % allTracks.length];
                        setCurrentTrack(prevTrack);
                      }}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <SkipBack className="w-6 h-6 sm:w-8 sm:h-8" />
                    </button>

                    {/* @ts-expect-error framer-motion event handlers support */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 flex items-center justify-center shadow-lg transition-all"
                    >
                      {isPlaying ? (
                        <Pause className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                      ) : (
                        <Play className="w-8 h-8 sm:w-10 sm:h-10 text-white ml-1" />
                      )}
                    </motion.button>

                    <button
                      onClick={() => {
                        const currentIndex = allTracks.findIndex(t => t.id === currentTrack.id);
                        const nextTrack = allTracks[(currentIndex + 1) % allTracks.length];
                        setCurrentTrack(nextTrack);
                      }}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <SkipForward className="w-6 h-6 sm:w-8 sm:h-8" />
                    </button>
                  </div>

                  {/* Volume Control */}
                  <div className="flex items-center justify-center gap-4">
                    <Volume2 className="w-5 h-5 text-gray-400" />
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      defaultValue="1"
                      className="flex-1 max-w-xs h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
                    />
                  </div>
                </motion.div>

                {/* Additional Info */}
                {/* @ts-expect-error framer-motion className support */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center"
                >
                  {currentTrack.playCount !== undefined && (
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="text-2xl font-bold text-pink-400">{(currentTrack.playCount / 1000).toFixed(1)}K</div>
                      <div className="text-xs text-gray-400 mt-1">Plays</div>
                    </div>
                  )}
                  {currentTrack.price && (
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="text-2xl font-bold text-amber-400">{currentTrack.price}</div>
                      <div className="text-xs text-gray-400 mt-1">{currentTrack.currency || 'ZMW'}</div>
                    </div>
                  )}
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    {/* @ts-expect-error framer-motion event handlers support */}
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleLikeTrack(currentTrack.id)}
                      className={`w-full transition-colors ${
                        likedTracks.includes(currentTrack.id)
                          ? 'text-pink-400'
                          : 'text-gray-400 hover:text-pink-400'
                      }`}
                    >
                      <Heart className="w-6 h-6 mx-auto mb-1" fill={likedTracks.includes(currentTrack.id) ? 'currentColor' : 'none'} />
                      <div className="text-xs text-gray-400">{likedTracks.includes(currentTrack.id) ? 'Liked' : 'Like'}</div>
                    </motion.button>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}