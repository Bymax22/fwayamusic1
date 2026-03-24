// apps/player/src/app/page.tsx
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
  TrendingUp
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
        console.error('Fetch error:', err);
        setError({
          message: 'Failed to load tracks',
          details: err instanceof Error ? err.message : String(err)
        });
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
        <div className="container mx-auto px-4 py-12 sm:py-20 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm mb-6"
            >
              <Sparkles className="w-4 h-4 text-pink-400" />
              <span className="text-sm">Premium Audio Experience</span>
            </motion.div>
            
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-pink-400 to-white bg-clip-text text-transparent">
              Fwaya Music Player
            </h1>
            
            <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto mb-8">
              Experience high-quality music streaming with DRM protection, beautiful visualizations, and seamless playback across all your devices.
            </p>
            
            <div className="flex flex-wrap items-center justify-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-gradient-to-r from-pink-500 to-pink-600 rounded-full font-semibold shadow-lg hover:shadow-pink-500/30 transition-all"
                onClick={() => {
                if (filteredTracks[0]) {
                  handlePlayTrack(filteredTracks[0]);
                }
              }}
            >
                Start Listening
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-white/10 backdrop-blur-sm rounded-full font-semibold hover:bg-white/20 transition-all"
              >
                Explore Library
              </motion.button>
            </div>
          </motion.div>
          
          {/* Stats Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12 sm:mt-20"
          >
            {stats.map((stat, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm p-4 rounded-lg text-center">
                <stat.icon className="w-6 h-6 text-pink-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
      
      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Premium Features</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Everything you need for the ultimate music experience
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: ShieldCheck, title: 'DRM Protection', description: 'Secure playback with device binding' },
            { icon: BarChart3, title: 'Audio Visualizer', description: 'Real-time waveform visualization' },
            { icon: Smartphone, title: 'Cross-Platform', description: 'Works on all devices seamlessly' },
            { icon: RotateCw, title: 'High Quality', description: 'Studio-grade audio quality' },
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="glass-card p-6 text-center hover:transform hover:translateY-[-4px] transition-all"
            >
              <feature.icon className="w-12 h-12 text-[#e51f48] mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-400">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Track Library Section */}
      <div className="container mx-auto px-4 py-8">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300"
          >
            <p className="font-semibold">{error.message}</p>
            {error.details && <p className="text-sm mt-1">{error.details}</p>}
          </motion.div>
        )}
        
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold mb-2">Track Library</h2>
            <p className="text-gray-400">Discover and play your favorite music</p>
          </div>
          
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search tracks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2 bg-white/10 rounded-lg border border-white/20 focus:border-[#e51f48] focus:outline-none transition-colors"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 bg-white/10 rounded-lg border border-white/20 focus:border-[#e51f48] focus:outline-none transition-colors"
            >
              <option value="all">All</option>
              <option value="free">Free</option>
              <option value="premium">Premium</option>
            </select>
          </div>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="glass-card p-4 animate-pulse">
                <div className="w-full h-48 bg-white/10 rounded-lg mb-4" />
                <div className="h-4 bg-white/10 rounded w-3/4 mb-2" />
                <div className="h-3 bg-white/10 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredTracks.map((track, index) => (
                <motion.div
                  key={track.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-card group cursor-pointer overflow-hidden"
                  onClick={() => handlePlayTrack(track)}
                >
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={track.artCoverUrl || '/default-cover.jpg'}
                      alt={track.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      {currentTrack?.id === track.id && isPlaying ? (
                        <Pause className="w-12 h-12 text-white" />
                      ) : (
                        <Play className="w-12 h-12 text-white" />
                      )}
                    </div>
                    {track.accessType !== 'FREE' && (
                      <div className="absolute top-2 right-2 px-2 py-1 bg-amber-500 text-xs rounded-full">
                        {track.accessType === 'PREMIUM' ? 'PREMIUM' : 'PPV'}
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-white mb-1 truncate">
                          {track.title}
                        </h3>
                        <p className="text-sm text-gray-400 truncate">
                          {track.artistName || 'Unknown Artist'}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLikeTrack(track.id);
                        }}
                        className="ml-2 p-2 rounded-full hover:bg-white/10 transition-colors"
                      >
                        {likedTracks.includes(track.id) ? (
                          <Heart className="w-5 h-5 text-[#e51f48]" fill="currentColor" />
                        ) : (
                          <Heart className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                    
                    {track.price && (
                      <div className="mt-2 text-xs text-amber-400">
                        {track.price} USD
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
        
        {filteredTracks.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No tracks found</p>
          </div>
        )}
      </div>
      
      {/* Player */}
      {showPlayer && currentTrack && (
        <AdvancedPlayer
          track={{
            ...currentTrack,
            artist: currentTrack.artistName,
            artCoverUrl: currentTrack.artCoverUrl,
            url: currentTrack.url,
          }}
          isPlaying={isPlaying}
          onPlayPause={() => setIsPlaying(!isPlaying)}
          onClose={() => {
            setShowPlayer(false);
            setIsPlaying(false);
          }}
          onNext={() => {
            const currentIndex = allTracks.findIndex(t => t.id === currentTrack.id);
            const nextTrack = allTracks[(currentIndex + 1) % allTracks.length];
            setCurrentTrack(nextTrack);
          }}
          onPrevious={() => {
            const currentIndex = allTracks.findIndex(t => t.id === currentTrack.id);
            const prevTrack = allTracks[(currentIndex - 1 + allTracks.length) % allTracks.length];
            setCurrentTrack(prevTrack);
          }}
          onQueue={() => console.log('Open queue')}
          onPurchase={() => console.log('Purchase track')}
        />
      )}
    </div>
  );
}