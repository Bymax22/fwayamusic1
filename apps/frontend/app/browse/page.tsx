'use client';
import { useEffect, useState, useRef } from 'react';
import { 
  Play, Pause, Heart, Share2, Clock, Search, Filter, ListMusic, Grid, 
  Shuffle, SkipBack, SkipForward, Volume2, Repeat, Download, Plus, 
  MoreHorizontal, Eye, Crown, Users, TrendingUp, Calendar, MapPin,
  Bookmark, BookmarkCheck, ShoppingCart, DollarSign, Lock, Unlock,
  Star, Mic2, Video, Headphones, Radio, ChevronLeft, ChevronRight, UserPlus, UserCheck
} from 'lucide-react';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { formatDuration, formatFileSize } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import Image from "next/image";
import { AuthProvider } from "../context/AuthContext";
import { ThemeProvider } from "../context/ThemeContext";
import { PaymentProvider } from "../context/PaymentContext";

import { MobileMoneyPaymentModal } from '../components/modal/MobileMoneyPaymentModal';

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
  interactions?: { liked: boolean; saved: boolean }[]; // <-- replaced below via Interaction type
  accessType: 'FREE' | 'PREMIUM' | 'PAY_PER_VIEW';
  price?: number;
  currency?: string; // <-- Add this line
  isExplicit: boolean;
  downloadCount: number;
  shareCount: number;
  tags: string[];
  user?: {
    id: number;
    username?: string;
    displayName?: string;
    avatarUrl?: string;
    isVerified?: boolean;
  };
  isDRMProtected?: boolean;
  artistCommissionRate?: number;
  allowReselling?: boolean;
  type?: 'AUDIO' | 'VIDEO' | 'PODCAST' | 'LIVE_STREAM';
}

type Interaction = {
  liked: boolean;
  saved: boolean;
  userId?: number;
};

type BackendMedia = {
  id: number;
  title: string;
  description?: string;
  user?: { 
    id: number;
    username?: string; 
    displayName?: string;
    avatarUrl?: string;
    isVerified?: boolean;
  };
  url: string;
  duration?: number;
  format?: string;
  createdAt: string;
  artCoverUrl?: string;
  thumbnailUrl?: string;
  playCount?: number;
  downloadCount?: number;
  shareCount?: number;
  interactions?: Interaction[]; // use Interaction
  genre?: string;
  tags?: string[];
  type: 'AUDIO' | 'VIDEO' | 'PODCAST' | 'LIVE_STREAM';
  accessType: 'FREE' | 'PREMIUM' | 'PAY_PER_VIEW';
  price?: number;
  currency?: string; // <-- Add this line
  isExplicit?: boolean;
  isDRMProtected?: boolean;
  allowReselling?: boolean;
  artistCommissionRate?: number;
};

interface Playlist {
  id: number;
  name: string;
  description?: string;
  coverUrl?: string;
  isPublic: boolean;
  type: 'SYSTEM' | 'USER' | 'SMART' | 'RADIO';
  mediaCount: number;
}

interface PlaylistAPI {
  id?: number;
  name?: string;
  description?: string;
  coverUrl?: string;
  imageUrl?: string;
  isPublic?: boolean;
  type?: string;
  entries?: unknown[];
  mediaCount?: number;
}

interface Artist {
  id: number;
  username: string;
  displayName: string;
  avatarUrl?: string;
  isVerified?: boolean;
  followerCount: number;
  mediaCount: number;
  isFollowing?: boolean;
  bio?: string;
  socialLinks?: string[];
}

export default function Browse() {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<MediaFile[]>([]);
  const [visibleCount, setVisibleCount] = useState<number>(20); // new: how many items to show
  const PAGE_SIZE = 10;
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<{message: string; details?: string} | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'compact'>('list');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(80);
  const [isShuffleOn, setIsShuffleOn] = useState(false);
  const [isRepeatOn, setIsRepeatOn] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'popular' | 'newest' | 'trending' | 'recommended'>('popular');
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);
  const [showMediaMenu, setShowMediaMenu] = useState(false);
  const [userPlaylists, setUserPlaylists] = useState<Playlist[]>([]);
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);
  const [showMobileMoneyModal, setShowMobileMoneyModal] = useState(false);
  const [selectedMediaForPayment, setSelectedMediaForPayment] = useState<MediaFile | null>(null);
  const { currentTrack, isPlaying, togglePlay, setCurrentTrack } = useAudioPlayer();
  const progressInterval = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [artists, setArtists] = useState<Artist[]>([]);
  const artistsScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [mediaResponse, playlistsResponse, userPlaylistsResponse, artistsResponse] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/media`, {
            credentials: 'include',
            headers: { 'Accept': 'application/json' }
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/playlist?type=SYSTEM`, {
            credentials: 'include',
            headers: { 'Accept': 'application/json' }
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/playlist?type=USER`, {
            credentials: 'include',
            headers: { 'Accept': 'application/json' }
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/artists`, { 
            credentials: 'include',
            headers: { 'Accept': 'application/json' }
          })
        ]);

        if (!mediaResponse.ok) {
          const errorData = await mediaResponse.json().catch(() => ({}));
          throw new Error(
            errorData.message ||
            `Server responded with ${mediaResponse.status}: ${mediaResponse.statusText}`
          );
        }

        // Process media data
        const mediaData = await mediaResponse.json();
        const formattedData = (mediaData as BackendMedia[]).map((item) => ({
          id: item.id,
          title: item.title || 'Untitled',
          artist: item.user?.displayName || item.user?.username || 'Unknown Artist',
          url: item.url,
          duration: item.duration || 0,
          format: item.format || 'mp3',
          createdAt: item.createdAt,
          coverArt: item.artCoverUrl || item.thumbnailUrl || '/default-cover.jpg',
          views: item.playCount || 0,
          likes: Array.isArray(item.interactions)
            ? item.interactions.filter((i) => i.liked).length
            : 0,
          genre: item.genre || 'Other',
          type: item.type,
          accessType: item.accessType,
          price: (item.accessType === 'PREMIUM' || item.accessType === 'PAY_PER_VIEW')
            ? (typeof item.price === 'number' ? item.price : 1)
            : undefined,
          currency: (item.accessType === 'PREMIUM' || item.accessType === 'PAY_PER_VIEW')
            ? (item.currency ?? 'ZMW')
            : undefined,
          isExplicit: item.isExplicit || false,
          downloadCount: item.downloadCount || 0,
          shareCount: item.shareCount || 0,
          tags: item.tags || [],
          user: item.user,
          isDRMProtected: item.isDRMProtected,
          allowReselling: item.allowReselling,
          artistCommissionRate: item.artistCommissionRate,
       
          interactions: item.interactions?.map((i: Interaction) => ({
            liked: i.liked,
            saved: i.saved
          })) || []
        }));

        setMediaFiles(formattedData);
        setFilteredFiles(formattedData);
        setVisibleCount(PAGE_SIZE); // reset visible count on initial load

        // Process artists data
        if (artistsResponse.ok) {
          const artistsData = await artistsResponse.json();
          setArtists(artistsData);
        }

        // Process playlists (SYSTEM) and user playlists (USER)
        if (playlistsResponse.ok) {
          const playlistsDataRaw = await playlistsResponse.json().catch(() => []);
          const playlistsData = (playlistsDataRaw || []).map((p: PlaylistAPI) => ({
            id: p.id ?? 0,
            name: p.name ?? 'Untitled',
            description: p.description,
            coverUrl: p.coverUrl || p.imageUrl || '/default-playlist.png',
            isPublic: p.isPublic ?? true,
            type: (p.type as Playlist['type']) || 'SYSTEM',
            mediaCount: p.entries?.length ?? p.mediaCount ?? 0
          }));
          setPlaylists(playlistsData);
        }

        if (userPlaylistsResponse.ok) {
          const userPlaylistsRaw = await userPlaylistsResponse.json().catch(() => []);
          const userPlaylistsData = (userPlaylistsRaw || []).map((p: PlaylistAPI) => ({
            id: p.id ?? 0,
            name: p.name ?? 'Untitled',
            description: p.description,
            coverUrl: p.coverUrl || p.imageUrl || '/default-playlist.png',
            isPublic: p.isPublic ?? true,
            type: (p.type as Playlist['type']) || 'USER',
            mediaCount: p.entries?.length ?? p.mediaCount ?? 0
          }));
          setUserPlaylists(userPlaylistsData);
        }

      } catch (err) {
        console.error('Fetch error:', err);
        setError({
          message: 'Failed to load media',
          details: err instanceof Error ? err.message : String(err)
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMediaMenu(false);
        setShowAddToPlaylist(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter and search functionality
  useEffect(() => {
    let results = [...mediaFiles];
    
    if (searchQuery) {
      results = results.filter(file => 
        file.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.genre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    if (selectedGenre !== 'all') {
      results = results.filter(file => file.genre === selectedGenre);
    }

    if (selectedType !== 'all') {
      results = results.filter(file => file.type === selectedType);
    }
    
    switch (activeFilter) {
      case 'popular':
        results.sort((a, b) => b.views - a.views);
        break;
      case 'newest':
        results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'trending':
        results.sort((a, b) => (b.views + b.likes * 10 + b.downloadCount * 5) - (a.views + a.likes * 10 + a.downloadCount * 5));
        break;
      case 'recommended':
        // Simple recommendation based on user interactions
        results.sort((a, b) => {
          const aScore = a.likes * 2 + a.views + a.downloadCount;
          const bScore = b.likes * 2 + b.views + b.downloadCount;
          return bScore - aScore;
        });
        break;
    }
    
    setFilteredFiles(results);
    setVisibleCount(PAGE_SIZE); // reset visible count whenever filters/search change
  }, [searchQuery, selectedGenre, selectedType, mediaFiles, activeFilter]);

  // displayed slice based on visibleCount
  const displayedFiles = filteredFiles.slice(0, visibleCount);

  // Sync audio element with player state
   useEffect(() => {
     if (!audioRef.current) return;
     if (currentTrack) {
       audioRef.current.src = currentTrack.url;
       if (isPlaying) {
         audioRef.current.play().catch((e) => {
           console.warn('Audio play error:', e);
         });
       } else {
         audioRef.current.pause();
       }
     } else {
       audioRef.current.pause();
       audioRef.current.currentTime = 0;
     }
   }, [currentTrack, isPlaying]);

  // Update progress bar when playing
  useEffect(() => {
    if (isPlaying && currentTrack) {
      progressInterval.current = window.setInterval(() => {
        setCurrentTime(prev => {
          const newTime = prev + 1;
          return newTime >= currentTrack.duration ? 0 : newTime;
        });
      }, 1000);
    } else {
      if (progressInterval.current !== null) window.clearInterval(progressInterval.current);
    }

    return () => {
      if (progressInterval.current !== null) window.clearInterval(progressInterval.current);
    };
  }, [isPlaying, currentTrack]);

  const loadMore = () => {
    setVisibleCount(prev => Math.min(prev + PAGE_SIZE, filteredFiles.length));
  };

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
        duration: file.duration,
        isDRMProtected: file.isDRMProtected
      });
      setCurrentTime(0);
    }
  };

  const handleLike = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/media/${id}/like`, { 
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Like action failed');

      setMediaFiles(mediaFiles.map(file => 
        file.id === id ? { 
          ...file, 
          likes: file.likes + 1,
          interactions: [...(file.interactions || []), { liked: true, saved: false }]
        } : file
      ));
    } catch (err) {
      console.error('Like error:', err);
      setError({
        message: 'Failed to like media',
        details: err instanceof Error ? err.message : String(err)
      });
    }
  };

  const handleSave = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/media/${id}/save`, { 
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Save action failed');

      setMediaFiles(mediaFiles.map(file => 
        file.id === id ? { 
          ...file, 
          interactions: [...(file.interactions || []), { liked: false, saved: true }]
        } : file
      ));
    } catch (err) {
      console.error('Save error:', err);
      setError({
        message: 'Failed to save media',
        details: err instanceof Error ? err.message : String(err)
      });
    }
  };

  const handleDownload = async (file: MediaFile) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/media/${file.id}/download`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceId: localStorage.getItem('deviceId') || 'web-browser',
          deviceInfo: {
            deviceId: localStorage.getItem('deviceId') || 'web-browser',
            deviceName: 'Web Browser',
            deviceType: 'desktop',
            os: navigator.platform
          }
        })
      });

      if (!response.ok) throw new Error('Download failed');

      const downloadData = await response.json();
      
      // Update download count
      setMediaFiles(mediaFiles.map(f => 
        f.id === file.id ? { ...f, downloadCount: f.downloadCount + 1 } : f
      ));

      // Trigger actual download
      const downloadResponse = await fetch(downloadData.downloadUrl);
      const blob = await downloadResponse.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file.title}.${file.format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (err) {
      console.error('Download error:', err);
      setError({
        message: 'Failed to download media',
        details: err instanceof Error ? err.message : String(err)
      });
    }
  };


  
  const handlePurchase = async (file: MediaFile) => {
    // Don't close the menu here - let the button click handle it
    if (file.accessType === 'PAY_PER_VIEW' || file.accessType === 'PREMIUM') {
      setSelectedMediaForPayment(file);
      setShowMobileMoneyModal(true);
      return;
    }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/payment/transaction`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mediaId: file.id,
        amount: file.price,
        currency: 'ZMW',
        paymentMethod: 'CREDIT_CARD',
        paymentProvider: 'STRIPE',
        deviceInfo: {
          deviceId: localStorage.getItem('deviceId') || 'web-browser',
          deviceName: 'Web Browser',
          deviceType: 'desktop',
          os: navigator.platform,
          fingerprint: localStorage.getItem('deviceId') || 'web-browser'
        }
      })
    });

    if (!response.ok) throw new Error('Purchase failed');

    const transaction = await response.json();
    console.log('Transaction:', transaction);
    console.log('showMobileMoneyModal:', showMobileMoneyModal, 'selectedMediaForPayment:', selectedMediaForPayment);
    alert('Purchase successful! You can now download this track.');
    
  } catch (err) {
    console.error('Purchase error:', err);
    setError({
      message: 'Failed to purchase media',
      details: err instanceof Error ? err.message : String(err)
    });
  }
};

  const handleShare = async (file: MediaFile) => {
    try {
      const shareUrl = `${window.location.origin}/media/${file.id}`;
      
      if (navigator.share) {
        await navigator.share({
          title: file.title,
          text: `Check out "${file.title}" by ${file.artist}`,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
      }

      // Update share count
      setMediaFiles(mediaFiles.map(f => 
        f.id === file.id ? { ...f, shareCount: f.shareCount + 1 } : f
      ));

    } catch (err) {
      console.error('Share error:', err);
      setError({
        message: 'Failed to share',
        details: err instanceof Error ? err.message : String(err)
      });
    }
  };

  const handleAddToPlaylist = async (playlistId: number, mediaId: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/playlists/${playlistId}/media`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mediaId })
      });

      if (!response.ok) throw new Error('Failed to add to playlist');

      setShowAddToPlaylist(false);
      alert('Added to playlist successfully!');
    } catch (err) {
      console.error('Playlist error:', err);
      setError({
        message: 'Failed to add to playlist',
        details: err instanceof Error ? err.message : String(err)
      });
    }
  };

  const handleSkipForward = () => {
    const currentIndex = filteredFiles.findIndex(file => file.id === currentTrack?.id);
    if (currentIndex < filteredFiles.length - 1) {
      handlePlay(filteredFiles[currentIndex + 1]);
    }
  };

  const handleSkipBackward = () => {
    const currentIndex = filteredFiles.findIndex(file => file.id === currentTrack?.id);
    if (currentIndex > 0) {
      handlePlay(filteredFiles[currentIndex - 1]);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
    }
  };

  const getGenres = () => {
    const genres = new Set(mediaFiles.map(file => file.genre).filter(Boolean));
    return ['all', ...Array.from(genres)];
  };

  const getMediaTypes = () => {
    const types = new Set(mediaFiles.map(file => file.type));
    return ['all', ...Array.from(types)];
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'AUDIO': return <Headphones className="w-4 h-4" />;
      case 'VIDEO': return <Video className="w-4 h-4" />;
      case 'PODCAST': return <Mic2 className="w-4 h-4" />;
      case 'LIVE_STREAM': return <Radio className="w-4 h-4" />;
      default: return <Headphones className="w-4 h-4" />;
    }
  };

  const getAccessTypeBadge = (file: MediaFile) => {
    switch (file.accessType) {
      case 'PREMIUM':
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs">
            <Crown className="w-3 h-3" />
            Premium
          </div>
        );
      case 'PAY_PER_VIEW':
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
            <DollarSign className="w-3 h-3" />
            ${file.price}
          </div>
        );
      default:
        return (
          <div className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded-full text-xs">
            Free
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto bg-gradient-to-br from-[#0a3747]/95 to-[#0a1f29]/95 min-h-screen">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Browse Music</h1>
          <div className="flex gap-2">
            <div className="w-10 h-10 bg-[#0a3747] rounded-full animate-pulse"></div>
            <div className="w-10 h-10 bg-[#0a3747] rounded-full animate-pulse"></div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse bg-[#0a3747]/50 rounded-xl p-4 h-64">
              <div className="w-full h-40 bg-[#0a3747] rounded-lg"></div>
              <div className="mt-3 space-y-2">
                <div className="h-4 bg-[#0a3747] rounded w-3/4"></div>
                <div className="h-3 bg-[#0a3747] rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto bg-gradient-to-br from-[#0a3747]/95 to-[#0a1f29]/95 min-h-screen">
        <audio ref={audioRef} src={currentTrack?.url} />
        <h1 className="text-3xl font-bold text-white mb-8">Browse Music</h1>
        <div className="bg-[#0a3747] border border-[#0a3747] p-6 rounded-xl">
          <h3 className="text-[#e51f48] font-medium text-lg">{error.message}</h3>
          {error.details && (
            <p className="text-[#ff4d6d] text-sm mt-2">{error.details}</p>
          )}
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-[#e51f48] hover:bg-[#ff4d6d] text-white rounded-lg transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

   // Artist section functions
  const scrollArtists = (direction: 'left' | 'right') => {
    if (artistsScrollRef.current) {
      const scrollAmount = 300;
      const newScrollLeft = artistsScrollRef.current.scrollLeft + 
        (direction === 'right' ? scrollAmount : -scrollAmount);
      
      artistsScrollRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  const handleFollowArtist = async (artistId: number) => {
    try {
      const response = await fetch(`http://localhost:3001/api/v1/artists/${artistId}/follow`, {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        setArtists(artists.map(artist => 
          artist.id === artistId 
            ? { ...artist, isFollowing: true, followerCount: artist.followerCount + 1 }
            : artist
        ));
      }
    } catch (err) {
      console.error('Follow error:', err);
    }
  };

  const handleUnfollowArtist = async (artistId: number) => {
    try {
      const response = await fetch(`http://localhost:3001/api/v1/artists/${artistId}/unfollow`, {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        setArtists(artists.map(artist => 
          artist.id === artistId 
            ? { ...artist, isFollowing: false, followerCount: artist.followerCount - 1 }
            : artist
        ));
      }
    } catch (err) {
      console.error('Unfollow error:', err);
    }
  };

  const handleShareArtist = async (artist: Artist) => {
    try {
      const shareUrl = `${window.location.origin}/artist/${artist.id}`;
      
      if (navigator.share) {
        await navigator.share({
          title: artist.displayName,
          text: `Check out ${artist.displayName} on our platform`,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        alert('Artist link copied to clipboard!');
      }
    } catch (err) {
      console.error('Share error:', err);
    }
  };


  return (
    <ThemeProvider>
      <AuthProvider>
        <PaymentProvider>
         <div className="p-6 max-w-7xl mx-auto bg-gradient-to-br from-[#0a3747]/95 to-[#0a1f29]/95 min-h-screen pb-32">
            {/* Hidden audio element for volume control */ }
            <audio ref={audioRef} src={currentTrack?.url} />

            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-white">Browse Music</h1>
              <div className="flex gap-2">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-[#0a3747] text-[#e51f48]' : 'bg-[#0a3747]/50 text-gray-300'}`}
                  aria-label="Grid view"
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-[#0a3747] text-[#e51f48]' : 'bg-[#0a3747]/50 text-gray-300'}`}
                  aria-label="List view"
                > 
                  <ListMusic className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setViewMode('compact')}
                  className={`p-2 rounded-lg ${viewMode === 'compact' ? 'bg-[#0a3747] text-[#e51f48]' : 'bg-[#0a3747]/50 text-gray-300'}`}
                  aria-label="Compact view"
                >
                  <Eye className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Search and filter bar */}
            <div className="mb-8">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search songs, artists, genres, or tags..."
                  className="w-full pl-10 pr-4 py-3 bg-[#0a3747]/70 border border-[#0a3747] text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e51f48] focus:border-transparent placeholder-gray-400"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap gap-3 items-center">
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#e51f48] hover:bg-[#ff4d6d] text-white rounded-xl transition-colors"
                >
                  <Filter className="w-4 h-4" />
                  Filters
                </button>

                <div className="flex gap-2 overflow-x-auto pb-2">
                  {getGenres().map(genre => (
                    <button
                      key={genre ?? "Other"}
                      onClick={() => setSelectedGenre(genre ?? "Other")}
                      className={`px-4 py-2 rounded-xl whitespace-nowrap transition-colors ${
                        selectedGenre === (genre ?? "Other") 
                          ? 'bg-[#e51f48] text-white' 
                          : 'bg-[#0a3747] text-gray-300 hover:bg-[#0a3747]/80'
                      }`}
                    >
                      {(genre ?? "Other").charAt(0).toUpperCase() + (genre ?? "Other").slice(1)}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2">
                  {getMediaTypes().map(type => (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type || "all")}
                      className={`px-4 py-2 rounded-xl whitespace-nowrap transition-colors flex items-center gap-2 ${
                        selectedType === type 
                          ? 'bg-[#e51f48] text-white' 
                          : 'bg-[#0a3747] text-gray-300 hover:bg-[#0a3747]/80'
                      }`}
                    >
                      {getTypeIcon(type || "AUDIO")}
                      {(type || "AUDIO").charAt(0).toUpperCase() + (type || "AUDIO").slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Advanced filters */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 bg-[#0a3747] border border-[#0a3747] rounded-xl p-4 overflow-hidden"
                  >
                    <h3 className="font-medium mb-3 text-gray-300">Sort by</h3>
                    <div className="flex gap-3 flex-wrap">
                      <button
                        onClick={() => setActiveFilter('popular')}
                        className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                          activeFilter === 'popular' 
                            ? 'bg-[#e51f48] text-white' 
                            : 'bg-[#0a3747] text-gray-300'
                        }`}
                      >
                        <TrendingUp className="w-4 h-4" />
                        Most Popular
                        
                      </button>
                      <button
                        onClick={() => setActiveFilter('newest')}
                        className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                          activeFilter === 'newest' 
                            ? 'bg-[#e51f48] text-white' 
                            : 'bg-[#0a3747] text-gray-300'
                        }`}
                      >
                        <Calendar className="w-4 h-4" />
                        Newest
                      </button>
                      <button
                        onClick={() => setActiveFilter('trending')}
                        className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                          activeFilter === 'trending' 
                            ? 'bg-[#e51f48] text-white' 
                            : 'bg-[#0a3747] text-gray-300'
                        }`}
                      >
                        <Star className="w-4 h-4" />
                        Trending
                      </button>
                      <button
                        onClick={() => setActiveFilter('recommended')}
                        className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                          activeFilter === 'recommended' 
                            ? 'bg-[#e51f48] text-white' 
                            : 'bg-[#0a3747] text-gray-300'
                        }`}
                      >
                        <Users className="w-4 h-4" />
                        Recommended
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-[#0a3747]/70 p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <Headphones className="w-8 h-8 text-[#e51f48]" />
                  <div>
                    <p className="text-2xl font-bold text-white">{mediaFiles.length}</p>
                    <p className="text-sm text-gray-400">Total Tracks</p>
                  </div>
                </div>
              </div>
              <div className="bg-[#0a3747]/70 p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <Users className="w-8 h-8 text-green-400" />
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {new Set(mediaFiles.map(f => f.user?.id)).size}
                    </p>
                    <p className="text-sm text-gray-400">Artists</p>
                  </div>
                </div>
              </div>
              <div className="bg-[#0a3747]/70 p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <Download className="w-8 h-8 text-blue-400" />
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {mediaFiles.reduce((sum, file) => sum + file.downloadCount, 0)}
                    </p>
                    <p className="text-sm text-gray-400">Total Downloads</p>
                  </div>
                </div>
              </div>
              <div className="bg-[#0a3747]/70 p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <Heart className="w-8 h-8 text-pink-400" />
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {mediaFiles.reduce((sum, file) => sum + file.likes, 0)}
                    </p>
                    <p className="text-sm text-gray-400">Total Likes</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Media list / grid / compact — show displayedFiles (paginated slice) */}
            {viewMode === 'list' ? (
              <div className="bg-[#0a3747]/70 rounded-xl shadow-sm overflow-hidden">
                {/* Table-like header */}
                <div className="grid grid-cols-12 gap-4 items-center p-4 border-b border-[#0a3747] text-gray-400 text-sm font-medium">
                  <div className="col-span-1">#</div>
                  <div className="col-span-1"></div>
                  <div className="col-span-4">TITLE</div>
                  <div className="col-span-2">ARTIST</div>
                  <div className="col-span-2">INFO</div>
                  <div className="col-span-2 flex justify-end gap-4">
                    <Clock className="w-4 h-4" />
                    <span>ACTIONS</span>
                  </div>
                </div>

                {displayedFiles.length > 0 ? (
                  <div className="divide-y divide-[#0a3747]">
                    {displayedFiles.map((file, index) => (
                      <div 
                        key={file.id} 
                        className={`grid grid-cols-12 gap-4 items-center p-4 transition-colors ${
                          currentTrack?.id === file.id 
                            ? 'bg-[#0a3747]' 
                            : 'hover:bg-[#0a3747]/50'
                        }`}
                >
                  {/* Track # */}
                  <div className="col-span-1 text-gray-400">
                    {index + 1}
                  </div>

                  {/* Play/Pause Button */}
                  <div className="col-span-1 flex justify-center items-center">
                    <button
                      onClick={() => handlePlay(file)}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-[#e51f48] hover:bg-[#ff4d6d] text-white transition-colors"
                      aria-label={currentTrack?.id === file.id && isPlaying ? 'Pause' : 'Play'}
                    >
                      {currentTrack?.id === file.id && isPlaying ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Title and cover */}
                  <div className="col-span-4 flex items-center gap-3">
                    <Image 
                      src={file.coverArt} 
                      alt={file.title} 
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-lg object-cover shadow-sm"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/default-cover.jpg';
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium flex items-center gap-2 ${
                        currentTrack?.id === file.id 
                          ? 'text-[#e51f48]' 
                          : 'text-white'
                      }`}>
                        {file.title}
                        {file.isExplicit && (
                          <span className="px-1.5 py-0.5 bg-gray-600 text-gray-300 rounded text-xs">E</span>
                        )}
                        {file.isDRMProtected && (
                          <Lock className="w-3 h-3 text-blue-400" />
                        )}
                      </p>
                      <div className="flex items-center gap-3 text-sm text-gray-400">
                        <span>{file.views} plays</span>
                        <span>•</span>
                        <span>{file.format.toUpperCase()}</span>
                        <span>•</span>
{getTypeIcon(file.type || "AUDIO")}
<span className="text-xs">{file.type || "AUDIO"}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Artist */}
                  <div className="col-span-2">
<div className="flex items-center gap-2">
  {file.user?.avatarUrl && (
    <Image
      src={file.user.avatarUrl}
      alt={file.artist}
      width={24}
      height={24}
      className="rounded-full"
    />
  )}
  <span className="text-gray-300">{file.artist}</span>
  <span title="Location">
    <MapPin className="w-3 h-3 text-gray-400" />
  </span>
  {file.user?.isVerified && (
    <Star className="w-3 h-3 text-blue-400 fill-current" />
  )}
</div>
                  </div>
                  
                  {/* Info */}
                  <div className="col-span-2">
                    <div className="flex flex-wrap gap-1">
                      <span className="px-2 py-1 bg-[#0a3747] text-gray-300 rounded-full text-xs">
                        {file.genre}
                        {formatFileSize ? formatFileSize(5 * 1024 * 1024) : "5 MB"}
                      </span>
                      {getAccessTypeBadge(file)}
                    </div>
                  </div>
                  
                  {/* Duration and Actions */}
                  <div className="col-span-2 flex items-center justify-end gap-3">
                    <span className="text-gray-400 text-sm w-12 text-right">
                      {formatDuration(file.duration)}
                    </span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleLike(file.id)}
                        className="text-gray-400 hover:text-[#e51f48] transition-colors group"
                        aria-label="Like"
                      >
                        <Heart 
                          className="w-4 h-4 group-hover:scale-110 transition-transform" 
                          fill={file.likes > 0 ? 'currentColor' : 'none'} 
                        />
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedMedia(file);
                          setShowMediaMenu(true);
                        }}
                        className="text-gray-400 hover:text-[#e51f48] transition-colors group"
                        aria-label="More options"
                      >
                        <MoreHorizontal className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400">
              <div className="text-lg mb-2">No results found</div>
              <p>Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredFiles.length > 0 ? (
            filteredFiles.map(file => (
              <div 
                key={file.id} 
                className="bg-[#0a3747]/70 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all group"
              >
                <div className="relative">
                  <Image 
                    src={file.coverArt} 
                    alt={file.title} 
                    width={300}
                    height={300}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/default-cover.jpg';
                    }}
                  />
                  <div className={`absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all ${
                    currentTrack?.id === file.id && isPlaying ? 'bg-opacity-30' : ''
                  }`}>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handlePlay(file)}
                        className={`opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all ${
                          currentTrack?.id === file.id && isPlaying ? 'opacity-100 translate-y-0' : ''
                        }`}
                      >
                        <div className="w-12 h-12 rounded-full bg-[#e51f48] flex items-center justify-center shadow-lg">
                          {currentTrack?.id === file.id && isPlaying ? (
                            <Pause className="w-5 h-5 text-white" />
                          ) : (
                            <Play className="w-5 h-5 text-white" />
                          )}
                        </div>
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedMedia(file);
                          setShowMediaMenu(true);
                        }}
                        className="opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all"
                      >
                        <div className="w-10 h-10 rounded-full bg-[#0a3747] flex items-center justify-center shadow-lg">
                          <MoreHorizontal className="w-5 h-5 text-white" />
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {getAccessTypeBadge(file)}
                    {file.isDRMProtected && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                        <Lock className="w-3 h-3" />
                        DRM
                      </div>
                    )}
                  </div>

                  {!file.isDRMProtected && (
  <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
    <Unlock className="w-3 h-3" />
    Unlocked
  </div>
)}

                  {/* Type badge */}
                  <div className="absolute top-2 right-2">
                    <div className="flex items-center gap-1 px-2 py-1 bg-gray-500/20 text-gray-300 rounded-full text-xs">
                      {getTypeIcon(file.type || "AUDIO")}
                      {file.type}
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-medium text-white truncate mb-1">{file.title}</h3>
                  <div className="flex items-center gap-2 mb-2">
                    {file.user?.avatarUrl && (
                      <Image
                        src={file.user.avatarUrl}
                        alt={file.artist}
                        width={20}
                        height={20}
                        className="rounded-full"
                      />
                    )}
                    <p className="text-sm text-gray-400 truncate">{file.artist}</p>
                    {file.user?.isVerified && (
                      <Star className="w-3 h-3 text-blue-400 fill-current" />
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                      <span className="px-2 py-1 bg-[#0a3747] text-gray-300 rounded-full text-xs">
                        {file.genre}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        {file.likes}
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {file.views}
                      </div>
                      <div className="flex items-center gap-1">
                        <Download className="w-3 h-3" />
                        {file.downloadCount}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full p-8 text-center text-gray-400">
              <div className="text-lg mb-2">No results found</div>
              <p>Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      ) : (
        // Compact view
        <div className="space-y-2">
          {filteredFiles.length > 0 ? (
            filteredFiles.map(file => (
              <div 
                key={file.id} 
                className={`flex items-center gap-4 p-3 rounded-xl transition-colors ${
                  currentTrack?.id === file.id 
                    ? 'bg-[#0a3747]' 
                    : 'hover:bg-[#0a3747]/50'
                }`}
              >
                <button
                  onClick={() => handlePlay(file)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-[#e51f48] hover:bg-[#ff4d6d] text-white transition-colors flex-shrink-0"
                >
                  {currentTrack?.id === file.id && isPlaying ? (
                    <Pause className="w-3 h-3" />
                  ) : (
                    <Play className="w-3 h-3" />
                  )}
                </button>

                <Image 
                  src={file.coverArt} 
                  alt={file.title} 
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate text-sm">{file.title}</p>
                  <p className="text-xs text-gray-400 truncate">{file.artist}</p>
                </div>

                <div className="flex items-center gap-3 text-xs text-gray-400 flex-shrink-0">
                  <span>{file.genre}</span>
                  <span>{formatDuration(file.duration)}</span>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button 
                    onClick={() => handleLike(file.id)}
                    className="text-gray-400 hover:text-[#e51f48] transition-colors"
                  >
                    <Heart 
                      className="w-4 h-4" 
                      fill={file.likes > 0 ? 'currentColor' : 'none'} 
                    />
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedMedia(file);
                      setShowMediaMenu(true);
                    }}
                    className="text-gray-400 hover:text-[#e51f48] transition-colors"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-400">
              <div className="text-lg mb-2">No results found</div>
              <p>Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      )}

                  {/* Load more button (shows when there are more items) */}
            {filteredFiles.length > visibleCount && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={loadMore}
                  className="px-6 py-3 bg-[#e51f48] hover:bg-[#ff4d6d] text-white rounded-xl"
                >
                  Load more
                </button>
              </div>
            )}

                  {/* Artists Section */}
            {artists.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">Popular Artists</h2>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => scrollArtists('left')}
                      className="p-2 bg-[#0a3747] hover:bg-[#0a3747]/80 text-white rounded-lg transition-colors"
                      aria-label="Scroll left"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => scrollArtists('right')}
                      className="p-2 bg-[#0a3747] hover:bg-[#0a3747]/80 text-white rounded-lg transition-colors"
                      aria-label="Scroll right"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div 
                  ref={artistsScrollRef}
                  className="flex gap-4 overflow-x-auto scrollbar-hide pb-4"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {artists.map(artist => (
                    <div 
                      key={artist.id}
                      className="flex-shrink-0 w-48 bg-[#0a3747]/70 rounded-xl p-4 hover:bg-[#0a3747]/90 transition-colors"
                    >
                      <div className="flex flex-col items-center text-center">
                        {/* Artist Avatar */}
                        <div className="relative mb-3">
                          <Image
                            src={artist.avatarUrl || '/default-avatar.jpg'}
                            alt={artist.displayName}
                            width={80}
                            height={80}
                            className="w-20 h-20 rounded-full object-cover"
                          />
                          {artist.isVerified && (
                            <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1">
                              <Star className="w-3 h-3 text-white fill-current" />
                            </div>
                          )}
                        </div>
                        
                        {/* Artist Info */}
                        <h3 className="font-medium text-white text-sm mb-1 truncate w-full">
                          {artist.displayName}
                        </h3>
                        <p className="text-xs text-gray-400 mb-3">
                          {artist.followerCount} followers
                        </p>
                        
                        {/* Stats */}
                        <div className="flex justify-between w-full text-xs text-gray-400 mb-3">
                          <span>{artist.mediaCount} tracks</span>
                          <span>•</span>
                          <span>{artist.followerCount} fans</span>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-2 w-full">
                          <button
                            onClick={() => artist.isFollowing ? handleUnfollowArtist(artist.id) : handleFollowArtist(artist.id)}
                            className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs transition-colors ${
                              artist.isFollowing
                                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                : 'bg-[#e51f48] text-white hover:bg-[#ff4d6d]'
                            }`}
                          >
                            {artist.isFollowing ? (
                              <>
                                <UserCheck className="w-3 h-3" />
                                Following
                              </>
                            ) : (
                              <>
                                <UserPlus className="w-3 h-3" />
                                Follow
                              </>
                            )}
                          </button>
                          
                          <button
                            onClick={() => handleShareArtist(artist)}
                            className="p-2 bg-[#0a3747] hover:bg-[#0a3747]/80 text-gray-300 rounded-lg transition-colors"
                            aria-label="Share artist"
                          >
                            <Share2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Featured Playlists Section */}
            {playlists.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-white mb-4">Featured Playlists</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {playlists.map((playlist) => (
                    <div key={playlist.id} className="bg-[#0a3747]/70 rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        {playlist.coverUrl && (
                          <Image
                            src={playlist.coverUrl}
                            alt={playlist.name}
                            width={48}
                            height={48}
                            className="rounded-lg"
                          />
                        )}
                        <div>
                          <p className="font-medium text-white">{playlist.name}</p>
                          <p className="text-sm text-gray-400">{playlist.mediaCount} tracks</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Media Action Menu - UPDATED PURCHASE BUTTON */}
            <AnimatePresence>
              {showMediaMenu && selectedMedia && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-[#0a3747] rounded-xl p-4 w-full max-w-sm"
                    ref={menuRef}
                  >
                    <div className="flex items-center gap-3 mb-4 p-2">
                      <Image
                        src={selectedMedia.coverArt}
                        alt={selectedMedia.title}
                        width={50}
                        height={50}
                        className="rounded-lg"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate">{selectedMedia.title}</p>
                        <p className="text-sm text-gray-400 truncate">{selectedMedia.artist}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                <button
                  onClick={() => handlePlay(selectedMedia)}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-[#0a1f29] rounded-lg transition-colors"
                >
                  {currentTrack?.id === selectedMedia.id && isPlaying ? (
                    <Pause className="w-5 h-5 text-[#e51f48]" />
                  ) : (
                    <Play className="w-5 h-5 text-[#e51f48]" />
                  )}
                  <span className="text-white">
                    {currentTrack?.id === selectedMedia.id && isPlaying ? 'Pause' : 'Play'}
                  </span>
                </button>

                <button
                  onClick={() => handleLike(selectedMedia.id)}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-[#0a1f29] rounded-lg transition-colors"
                >
                  <Heart 
                    className="w-5 h-5 text-[#e51f48]" 
                    fill={selectedMedia.likes > 0 ? '#e51f48' : 'none'}
                  />
                  <span className="text-white">Like</span>
                </button>

                <button
  className="w-full flex items-center gap-3 p-3 text-left hover:bg-[#0a1f29] rounded-lg transition-colors"
  onClick={() => alert('Bookmark feature coming soon!')}
>
  <Bookmark className="w-5 h-5 text-[#e51f48]" />
  <span className="text-white">Bookmark</span>
</button>

                <button
                  onClick={() => handleSave(selectedMedia.id)}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-[#0a1f29] rounded-lg transition-colors"
                >
                  <BookmarkCheck className="w-5 h-5 text-[#e51f48]" />
                  <span className="text-white">Save to Library</span>
                </button>

                {selectedMedia.accessType === 'FREE' && (
                  <button
                    onClick={() => handleDownload(selectedMedia)}
                    className="w-full flex items-center gap-3 p-3 text-left hover:bg-[#0a1f29] rounded-lg transition-colors"
                  >
                    <Download className="w-5 h-5 text-[#e51f48]" />
                    <span className="text-white">Download</span>
                  </button>
                )}

                      {/* UPDATED PURCHASE BUTTON - FIXED */}
                      {(selectedMedia.accessType === 'PREMIUM' || selectedMedia.accessType === 'PAY_PER_VIEW') && typeof selectedMedia.price === 'number' && (
                        <button
                          onClick={() => {
                            setShowMediaMenu(false);
                            handlePurchase(selectedMedia);
                          }}
                          className="w-full flex items-center gap-3 p-3 text-left hover:bg-[#0a1f29] rounded-lg transition-colors"
                        >
                          <ShoppingCart className="w-5 h-5 text-[#e51f48]" />
                          <span className="text-white">
                            Purchase ZMW{selectedMedia.price}
                          </span>
                        </button>
                      )}

                <button
                  onClick={() => {
                    setShowAddToPlaylist(true);
                    setShowMediaMenu(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-[#0a1f29] rounded-lg transition-colors"
                >
                  <Plus className="w-5 h-5 text-[#e51f48]" />
                  <span className="text-white">Add to Playlist</span>
                </button>

                <button
                  onClick={() => handleShare(selectedMedia)}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-[#0a1f29] rounded-lg transition-colors"
                >
                  <Share2 className="w-5 h-5 text-[#e51f48]" />
                  <span className="text-white">Share</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

                    {/* Mobile Money Modal */}
            {showMobileMoneyModal && selectedMediaForPayment && (
              <MobileMoneyPaymentModal
                isOpen={showMobileMoneyModal}
                onClose={() => {
                  setShowMobileMoneyModal(false);
                  setSelectedMediaForPayment(null);
                }}
                media={{
                  ...selectedMediaForPayment,
                  price: selectedMediaForPayment.price ?? 1,
                  currency: selectedMediaForPayment.currency ?? 'ZMW',
                }}
              />
            )}
      

      {/* Add to Playlist Menu */}
      <AnimatePresence>
        {showAddToPlaylist && selectedMedia && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#0a3747] rounded-xl p-4 w-full max-w-sm"
              ref={menuRef}
            >
              <h3 className="font-medium text-white mb-4">Add to Playlist</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {userPlaylists.map(playlist => (
                  <button
                    key={playlist.id}
                    onClick={() => handleAddToPlaylist(playlist.id, selectedMedia.id)}
                    className="w-full flex items-center gap-3 p-3 text-left hover:bg-[#0a1f29] rounded-lg transition-colors"
                  >
                    <div className="w-10 h-10 bg-[#0a1f29] rounded-lg flex items-center justify-center">
                      <ListMusic className="w-5 h-5 text-[#e51f48]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{playlist.name}</p>
                      <p className="text-sm text-gray-400">{playlist.mediaCount} tracks</p>
                    </div>
                  </button>
                ))}
                {userPlaylists.length === 0 && (
                  <p className="text-gray-400 text-center py-4">No playlists found</p>
                )}
              </div>
              <button
                onClick={() => setShowAddToPlaylist(false)}
                className="w-full mt-4 p-3 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Now Playing Bar */}
      {currentTrack && (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-br from-[#0a3747]/95 to-[#0a1f29]/95 border-t border-[#0a3747] shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              {/* Track info */}
              <div className="flex items-center gap-4 w-1/4">
                <Image
                  src={currentTrack.coverArt} 
                  alt={currentTrack.title} 
                  width={56}
                  height={56}
                  className="w-14 h-14 rounded-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/default-cover.jpg';
                  }}
                />
                <div className="min-w-0">
                  <p className="font-medium text-white truncate">{currentTrack.title}</p>
                  <p className="text-sm text-gray-400 truncate">{currentTrack.artist}</p>
                </div>
                <button 
                  onClick={() => handleLike(Number(currentTrack.id))}
                  className="text-gray-400 hover:text-[#e51f48] transition-colors"
                  aria-label="Like"
                >
                  <Heart 
                    className="w-5 h-5 group-hover:scale-110 transition-transform" 
                    fill={typeof currentTrack.likes === 'number' && currentTrack.likes > 0 ? 'currentColor' : 'none'} 
                  />
                </button>
              </div>
              
              {/* Player controls */}
              <div className="flex flex-col items-center w-2/4">
                <div className="flex items-center gap-4 mb-2">
                  <button 
                    onClick={() => setIsShuffleOn(!isShuffleOn)}
                    className={`text-gray-400 hover:text-[#e51f48] transition-colors ${
                      isShuffleOn ? 'text-[#e51f48]' : ''
                    }`}
                    aria-label="Shuffle"
                  >
                    <Shuffle className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={handleSkipBackward}
                    className="text-gray-400 hover:text-[#e51f48] transition-colors"
                    aria-label="Previous track"
                  >
                    <SkipBack className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={togglePlay}
                    className="w-10 h-10 rounded-full bg-[#e51f48] hover:bg-[#ff4d6d] text-white flex items-center justify-center shadow-md transition-colors"
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </button>
                  <button 
                    onClick={handleSkipForward}
                    className="text-gray-400 hover:text-[#e51f48] transition-colors"
                    aria-label="Next track"
                  >
                    <SkipForward className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setIsRepeatOn(!isRepeatOn)}
                    className={`text-gray-400 hover:text-[#e51f48] transition-colors ${
                      isRepeatOn ? 'text-[#e51f48]' : ''
                    }`}
                    aria-label="Repeat"
                  >
                    <Repeat className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Progress bar */}
                <div className="w-full flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-10 text-right">
                    {formatDuration(currentTime)}
                  </span>
                  <div className="flex-1 h-1.5 bg-[#0a3747] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#e51f48] to-[#ff4d6d] rounded-full" 
                      style={{ 
                        width: `${(currentTime / currentTrack.duration) * 100}%`,
                        transition: 'width 0.3s ease'
                      }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-400 w-10">
                    {formatDuration(currentTrack.duration)}
                  </span>
                </div>
              </div>
              
              {/* Volume control */}
              <div className="flex items-center justify-end gap-2 w-1/4">
                <Volume2 className="w-5 h-5 text-gray-400" />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-24 h-1 bg-[#0a3747] rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#e51f48]"
                  aria-label="Volume control"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
            </PaymentProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}