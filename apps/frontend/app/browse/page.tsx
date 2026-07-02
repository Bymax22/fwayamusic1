'use client';
import { useEffect, useState, useRef } from 'react';
import { 
  Play, Pause, Heart, Share2, Clock, Search, Filter, ListMusic, Grid, 
  Download, Plus, 
  MoreHorizontal, Eye, Crown, Users, TrendingUp, Calendar, MapPin,
  Bookmark, BookmarkCheck, ShoppingCart, DollarSign, Lock, Unlock,
  Star, Mic2, Video, Headphones, Radio
} from 'lucide-react';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import Waveform from '@/components/Waveform';
import ShareModal from '@/components/ShareModal';
import { formatDuration, formatFileSize } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import Image from "next/image";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from "../context/AuthContext";
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
  playCount?: number;
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

export default function Browse() {
  const { getToken } = useAuth();
  const router = useRouter();
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<MediaFile[]>([]);
  const [visibleCount, setVisibleCount] = useState<number>(20); // new: how many items to show
  const PAGE_SIZE = 10;
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<{message: string; details?: string} | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'compact'>('compact');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'popular' | 'newest' | 'trending' | 'recommended'>('popular');
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);
  const [showMediaMenu, setShowMediaMenu] = useState(false);
  const [selectedMediaForShare, setSelectedMediaForShare] = useState<MediaFile | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [userPlaylists, setUserPlaylists] = useState<Playlist[]>([]);
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);
  const [showMobileMoneyModal, setShowMobileMoneyModal] = useState(false);
  const [selectedMediaForPayment, setSelectedMediaForPayment] = useState<MediaFile | null>(null);
  const { currentTrack, isPlaying, togglePlay, playTrack } = useAudioPlayer();
  const menuRef = useRef<HTMLDivElement>(null);
  const [db, setDb] = useState<IDBDatabase | null>(null);

  useEffect(() => {
    // Set device ID if not exists
    if (typeof window !== 'undefined' && !localStorage.getItem('deviceId')) {
      const deviceId = 'web-' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('deviceId', deviceId);
    }
  }, []);

  useEffect(() => {
    const request = indexedDB.open("fwayaMusic", 2);
    request.onupgradeneeded = (e: IDBVersionChangeEvent) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("downloads")) {
        db.createObjectStore("downloads");
      }
      if (!db.objectStoreNames.contains("downloadMetadata")) {
        const store = db.createObjectStore("downloadMetadata", { keyPath: "id" });
        store.createIndex("title", "title", { unique: false });
        store.createIndex("artist", "artist", { unique: false });
      }
    };
    request.onsuccess = (e: Event) => {
      setDb((e.target as IDBOpenDBRequest).result);
    };
  }, []);

  useEffect(() => {
    const fetchWithTimeout = async (input: RequestInfo, timeout = 4000, options: RequestInit = {}) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);
      try {
        const res = await fetch(input, { signal: controller.signal, ...options });
        clearTimeout(id);
        return res;
      } catch (err) {
        clearTimeout(id);
        throw err;
      }
    };

    const fetchWithFallback = async (primaryUrl: string, fallbackUrl: string, options: RequestInit = {}) => {
      // Prefer the frontend proxy first for faster local response
      try {
        const proxyRes = await fetchWithTimeout(fallbackUrl, 2500, options);
        if (proxyRes.ok) return proxyRes;
        console.warn(`Proxy fetch failed: ${fallbackUrl}`, proxyRes.status, proxyRes.statusText);
      } catch (proxyErr) {
        console.warn(`Proxy fetch error: ${fallbackUrl}`, proxyErr);
      }

      // Fall back to primary backend with a slightly longer timeout
      return fetchWithTimeout(primaryUrl, 4000, options);
    };

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [mediaResponse, userPlaylistsResponse] = await Promise.all([
          fetchWithFallback(
            `${process.env.NEXT_PUBLIC_API_URL}/api/v1/media`,
            '/api/media',
            {
              credentials: 'include',
              headers: { 'Accept': 'application/json' }
            }
          ),
          fetchWithFallback(
            `${process.env.NEXT_PUBLIC_API_URL}/api/v1/playlist?type=USER`,
            '/api/playlists?type=USER',
            {
              credentials: 'include',
              headers: { 'Accept': 'application/json' }
            }
          )
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
  }, [searchQuery, selectedGenre, mediaFiles, activeFilter]);

  // displayed slice based on visibleCount
  const displayedFiles = filteredFiles.slice(0, visibleCount);

  const loadMore = () => {
    setVisibleCount(prev => Math.min(prev + PAGE_SIZE, filteredFiles.length));
  };

  const handlePlay = async (file: MediaFile) => {
    if (String(currentTrack?.id) === String(file.id)) {
      togglePlay();
    } else {
      // Check for encrypted download first
      if (db) {
        const transaction = db.transaction(["downloads"], "readonly");
        const store = transaction.objectStore("downloads");
        const request = store.get(file.id);
        request.onsuccess = async (e: Event) => {
          if ((e.target as IDBRequest).result) {
            const data = (e.target as IDBRequest).result;
            const { encrypted, iv } = data;
            const deviceId = localStorage.getItem('deviceId') || 'web-browser';
            const key = await getKey(deviceId);
            try {
              const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, encrypted);
              const decryptedBlob = new Blob([decrypted], { type: 'audio/mpeg' });
              const url = URL.createObjectURL(decryptedBlob);
              playTrack({
                id: file.id,
                title: file.title,
                artist: file.artist,
                audioUrl: url,
                url: url,
                coverArt: file.coverArt,
                duration: file.duration,
                isDRMProtected: file.isDRMProtected,
                accessType: file.accessType,
                price: file.price,
                currency: file.currency
              });
            } catch (error) {
              console.error('Decryption failed', error);
              // Fallback to original URL
              playTrack({
                id: file.id,
                title: file.title,
                artist: file.artist,
                audioUrl: file.url,
                url: file.url,
                coverArt: file.coverArt,
                duration: file.duration,
                isDRMProtected: file.isDRMProtected,
                accessType: file.accessType,
                price: file.price,
                currency: file.currency
              });
            }
          } else {
            // No encrypted download, use original URL
            playTrack({
              id: file.id,
              title: file.title,
              artist: file.artist,
              audioUrl: file.url,
              url: file.url,
              coverArt: file.coverArt,
              duration: file.duration,
              isDRMProtected: file.isDRMProtected,
              accessType: file.accessType,
              price: file.price,
              currency: file.currency
            });
          }
        };
      } else {
        // No IndexedDB, use original URL
        playTrack({
          id: file.id,
          title: file.title,
          artist: file.artist,
          audioUrl: file.url,
          url: file.url,
          coverArt: file.coverArt,
          duration: file.duration,
          isDRMProtected: file.isDRMProtected
        });
      }

      // Track play interaction
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/media/${file.id}/interact/play`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: 1 }) // TODO: Get from auth context
      }).catch(err => console.warn('Play tracking failed:', err));
    }
  };

  const handleLike = async (id: number) => {
    try {
      const token = await getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/media/${id}/interact/like`, { 
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
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

  // const handleSave = async (id: number) => {
  //   try {
  //     const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/media/${id}/save`, { 
  //       method: 'POST',
  //       credentials: 'include'
  //     });

  //     if (!response.ok) throw new Error('Save action failed');

  //     setMediaFiles(mediaFiles.map(file => 
  //       file.id === id ? { 
  //         ...file, 
  //         interactions: [...(file.interactions || []), { liked: false, saved: true }]
  //       } : file
  //     ));
  //   } catch (err) {
  //     console.error('Save error:', err);
  //     setError({
  //       message: 'Failed to save media',
  //       details: err instanceof Error ? err.message : String(err)
  //     });
  //   }
  // };

  const handleDownload = async (file: MediaFile) => {
    try {
      const token = await getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/media/${file.id}/interact/download`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          deviceId: localStorage.getItem('deviceId') || 'web-browser',
        })
      });

      if (!response.ok) throw new Error('Download failed');

      const downloadData = await response.json();
      
      // Update download count
      setMediaFiles(mediaFiles.map(f => 
        f.id === file.id ? { ...f, downloadCount: f.downloadCount + 1 } : f
      ));

      // Encrypt and download the file
      const downloadResponse = await fetch(downloadData.downloadUrl);
      const blob = await downloadResponse.blob();
      const deviceId = localStorage.getItem('deviceId') || 'web-browser';
      const key = await getKey(deviceId);
      const arrayBuffer = await blob.arrayBuffer();
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, arrayBuffer);
      const encryptedBlob = new Blob([encrypted]);

      // Store decryption data in IndexedDB
      if (db) {
        const transaction = db.transaction(["downloads"], "readwrite");
        const store = transaction.objectStore("downloads");
        const data = { encrypted: new Uint8Array(encrypted), iv };
        store.put(data, file.id);

        // Also store metadata
        if (!db.objectStoreNames.contains("downloadMetadata")) {
          // Create the store if it doesn't exist
          const version = db.version + 1;
          db.close();
          const upgradeRequest = indexedDB.open("fwayaMusic", version);
          upgradeRequest.onupgradeneeded = (e: IDBVersionChangeEvent) => {
            const db = (e.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains("downloadMetadata")) {
              const store = db.createObjectStore("downloadMetadata", { keyPath: "id" });
              store.createIndex("title", "title", { unique: false });
              store.createIndex("artist", "artist", { unique: false });
            }
          };
          upgradeRequest.onsuccess = (e: Event) => {
            const newDb = (e.target as IDBOpenDBRequest).result;
            const metaTransaction = newDb.transaction(["downloadMetadata"], "readwrite");
            const metaStore = metaTransaction.objectStore("downloadMetadata");
            const metadata = {
              id: file.id,
              title: file.title,
              artist: file.artist,
              coverArt: file.coverArt,
              duration: file.duration,
              fileSize: blob.size,
              quality: 'HD',
              downloadDate: new Date().toISOString(),
              accessType: file.accessType,
              isDRMProtected: file.isDRMProtected,
              downloadStatus: 'completed'
            };
            metaStore.put(metadata);
          };
        } else {
          const metaTransaction = db.transaction(["downloadMetadata"], "readwrite");
          const metaStore = metaTransaction.objectStore("downloadMetadata");
          const metadata = {
            id: file.id,
            title: file.title,
            artist: file.artist,
            coverArt: file.coverArt,
            duration: file.duration,
            fileSize: blob.size,
            quality: 'HD',
            downloadDate: new Date().toISOString(),
            accessType: file.accessType,
            isDRMProtected: file.isDRMProtected,
            downloadStatus: 'completed'
          };
          metaStore.put(metadata);
        }
      }

      // Download the encrypted file (looks like normal audio but is encrypted)
      const url = window.URL.createObjectURL(encryptedBlob);
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

  const getKey = async (deviceId: string) => {
    const keyMaterial = await crypto.subtle.importKey(
      "raw", 
      new TextEncoder().encode(deviceId), 
      "PBKDF2", 
      false, 
      ["deriveBits", "deriveKey"]
    );
    const salt = new Uint8Array(16);
    salt.fill(0);
    const key = await crypto.subtle.deriveKey({
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256"
    }, keyMaterial, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
    return key;
  };


  
  const handlePurchase = async (file: MediaFile) => {
    if (file.accessType === 'PAY_PER_VIEW' || file.accessType === 'PREMIUM') {
      setSelectedMediaForPayment(file);
      setShowMobileMoneyModal(true);
    }
  };

  const handleShare = (file: MediaFile) => {
    setSelectedMediaForShare(file);
    setShowShareModal(true);
  };

  const handleShareSuccess = () => {
    if (!selectedMediaForShare) return;
    setMediaFiles(mediaFiles.map(f => 
      f.id === selectedMediaForShare.id ? { ...f, shareCount: f.shareCount + 1 } : f
    ));
  };

  const handleAddToPlaylist = async (playlistId: number, mediaId: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/playlists/${playlistId}/media`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          mediaId,
          userId: 1 // TODO: Get from auth context
        })
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
    const displayPrice = typeof file.price === 'number' ? `${file.currency ?? 'ZMW'}${file.price}` : 'ZMW1';

    switch (file.accessType) {
      case 'PREMIUM':
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-white/10 text-white/80 rounded-full text-xs">
            <Crown className="w-3 h-3" />
            Premium
          </div>
        );
      case 'PAY_PER_VIEW':
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-white/10 text-white/80 rounded-full text-xs">
            <DollarSign className="w-3 h-3" />
            {displayPrice}
          </div>
        );
      default:
        return (
          <div className="px-2 py-1 bg-white/10 text-white/80 rounded-full text-xs">
            Free
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="py-6 px-2 sm:px-6 max-w-7xl mx-auto bg-black min-h-screen">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Browse Music</h1>
          <div className="flex gap-2">
            <div className="w-10 h-10 bg-white/10 rounded-full animate-pulse"></div>
            <div className="w-10 h-10 bg-white/10 rounded-full animate-pulse"></div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse bg-white/5 rounded-xl p-4 h-64">
              <div className="w-full h-40 bg-white/10 rounded-lg"></div>
              <div className="mt-3 space-y-2">
                <div className="h-4 bg-white/10 rounded w-3/4"></div>
                <div className="h-3 bg-white/10 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-6 px-2 sm:px-6 max-w-7xl mx-auto bg-black min-h-screen">
        <h1 className="text-3xl font-bold text-white mb-8">Browse Music</h1>
        <div className="bg-black p-6 rounded-xl">
          <h3 className="text-[#c4b5fd] font-medium text-lg">{error.message}</h3>
          {error.details && (
            <p className="text-[#d8b4fe] text-sm mt-2">{error.details}</p>
          )}
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-purple-500 hover:bg-purple-400 text-white rounded-lg transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }



  return (
         <div className="py-6 px-2 sm:px-6 max-w-7xl mx-auto bg-black min-h-screen pb-32">

            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-white">Browse Music</h1>
              <div className="flex gap-2">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-full ${viewMode === 'grid' ? 'bg-purple-500 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/15'}`}
                  aria-label="Grid view"
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-full ${viewMode === 'list' ? 'bg-purple-500 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/15'}`}
                  aria-label="List view"
                > 
                  <ListMusic className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setViewMode('compact')}
                  className={`p-2 rounded-full ${viewMode === 'compact' ? 'bg-purple-500 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/15'}`}
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
                  className="w-full pl-10 pr-4 py-3 bg-[#080a13]/70 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent placeholder-gray-400"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-full transition-colors"
                  >
                    <Filter className="w-4 h-4" />
                    Filters
                  </button>

                  <div className="flex flex-wrap gap-2 items-center justify-start sm:justify-end">
                    <div className="flex flex-wrap gap-2 items-center bg-[#080a13]/50 rounded-full px-2 py-1">
                      {getGenres().map(genre => (
                        <button
                          key={genre ?? "Other"}
                          onClick={() => setSelectedGenre(genre ?? "Other")}
                          className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                            selectedGenre === (genre ?? "Other") 
                              ? 'bg-purple-600 text-white' 
                              : 'bg-[#080a13] text-gray-300 hover:bg-[#0a0d18]'
                          }`}
                        >
                          {(genre ?? "Other").charAt(0).toUpperCase() + (genre ?? "Other").slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Advanced filters */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 bg-black rounded-xl p-4 overflow-hidden"
                  >
                    <h3 className="font-medium mb-3 text-gray-300">Sort by</h3>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setActiveFilter('popular')}
                        className={`px-3 py-1.5 rounded-full text-sm transition-colors flex items-center gap-2 ${
                          activeFilter === 'popular' 
                            ? 'bg-purple-500 text-white' 
                            : 'bg-white/10 text-gray-300 hover:bg-white/15'
                        }`}
                      >
                        <TrendingUp className="w-4 h-4" />
                        Most Popular
                      </button>
                      <button
                        onClick={() => setActiveFilter('newest')}
                        className={`px-3 py-1.5 rounded-full text-sm transition-colors flex items-center gap-2 ${
                          activeFilter === 'newest' 
                            ? 'bg-purple-500 text-white' 
                            : 'bg-white/10 text-gray-300 hover:bg-white/15'
                        }`}
                      >
                        <Calendar className="w-4 h-4" />
                        Newest
                      </button>
                      <button
                        onClick={() => setActiveFilter('trending')}
                        className={`px-3 py-1.5 rounded-full text-sm transition-colors flex items-center gap-2 ${
                          activeFilter === 'trending' 
                            ? 'bg-purple-500 text-white' 
                            : 'bg-white/10 text-gray-300 hover:bg-white/15'
                        }`}
                      >
                        <Star className="w-4 h-4" />
                        Trending
                      </button>
                      <button
                        onClick={() => setActiveFilter('recommended')}
                        className={`px-3 py-1.5 rounded-full text-sm transition-colors flex items-center gap-2 ${
                          activeFilter === 'recommended' 
                            ? 'bg-purple-500 text-white' 
                            : 'bg-white/10 text-gray-300 hover:bg-white/15'
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

            {/* Media list / grid / compact — show displayedFiles (paginated slice) */}
            {viewMode === 'list' ? (
              <div className="bg-black rounded-xl overflow-hidden">
                {/* Table-like header */}
                <div className="grid grid-cols-12 gap-4 items-center p-4 border-b border-[#080a13] text-gray-400 text-sm font-medium">
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
                  <div className="divide-y divide-[#080a13]">
                    {displayedFiles.map((file, index) => (
                      <div 
                        key={file.id} 
                        className={`grid grid-cols-12 gap-4 items-center p-4 transition-colors ${
                          String(currentTrack?.id) === String(file.id) 
                            ? 'bg-[#080a13]' 
                            : 'hover:bg-[#080a13]/50'
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
                      className="w-8 h-8 flex items-center justify-center rounded-full text-[#a855f7] hover:text-white transition-colors"
                        aria-label={String(currentTrack?.id) === String(file.id) && isPlaying ? 'Pause' : 'Play'}
                    >
                      {String(currentTrack?.id) === String(file.id) && isPlaying ? (
                        <Waveform playing={true} className="w-4 h-4" />
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
                      <Link href={`/track/${file.id}`}>
                        <p className={`font-medium flex items-center gap-2 cursor-pointer hover:text-green-400 transition-colors ${
                          String(currentTrack?.id) === String(file.id) 
                            ? 'text-[#a855f7]' 
                            : 'text-white'
                        }`}>
                          {file.title}
                          {file.isExplicit && (
                            <span className="px-1.5 py-0.5 bg-gray-600 text-gray-300 rounded text-xs">E</span>
                          )}
                          {file.isDRMProtected && (
                            <Lock className="w-3 h-3 text-gray-600" />
                          )}
                        </p>
                      </Link>
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
    <Star className="w-3 h-3 text-gray-600 fill-current" />
  )}
</div>
                  </div>
                  
                  {/* Info */}
                  <div className="col-span-2">
                    <div className="flex flex-wrap gap-1">
                      <span className="px-2 py-1 bg-[#080a13] text-gray-300 rounded-full text-xs">
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
                        className="text-gray-400 hover:text-[#a855f7] transition-colors group"
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
                        className="text-gray-400 hover:text-[#a855f7] transition-colors group"
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
          {displayedFiles.length > 0 ? (
            displayedFiles.map(file => (
              <div 
                key={file.id} 
                className="bg-black rounded-xl overflow-hidden group"
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
                    String(currentTrack?.id) === String(file.id) && isPlaying ? 'bg-opacity-30' : ''
                  }`}>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handlePlay(file)}
                        className={`opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all ${
                          String(currentTrack?.id) === String(file.id) && isPlaying ? 'opacity-100 translate-y-0' : ''
                        }`}
                      >
                        <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg text-[#a855f7] hover:text-white transition-colors">
                          {String(currentTrack?.id) === String(file.id) && isPlaying ? (
                            <Waveform playing={true} className="w-6 h-6" />
                          ) : (
                            <Play className="w-5 h-5" />
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
                        <div className="w-10 h-10 rounded-full bg-[#080a13] flex items-center justify-center">
                          <MoreHorizontal className="w-5 h-5 text-white" />
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {getAccessTypeBadge(file)}
                    {file.isDRMProtected && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-gray-600/20 text-gray-400 rounded-full text-xs">
                        <Lock className="w-3 h-3" />
                        DRM
                      </div>
                    )}
                  </div>

                  {!file.isDRMProtected && (
  <div className="flex items-center gap-1 px-2 py-1 bg-[#4c1d95]/20 text-[#d8b4fe] rounded-full text-xs">
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
                  <Link href={`/track/${file.id}`}>
                    <h3 className="font-medium text-white truncate mb-1 hover:text-green-400 transition-colors cursor-pointer">{file.title}</h3>
                  </Link>
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
                      <Star className="w-3 h-3 text-gray-600 fill-current" />
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                      <span className="px-2 py-1 bg-[#080a13] text-gray-300 rounded-full text-xs">
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
        // Compact view - Mobile optimized
        <div className="space-y-0.5">
          {displayedFiles.length > 0 ? (
            displayedFiles.map(file => (
              <div 
                key={file.id} 
                className={`flex items-start gap-2 px-1 py-1 rounded-xl transition-colors min-w-0 hover:bg-white/5`}
              >
                {/* Album cover with play button on top */}
                <div className="relative flex-shrink-0">
                  <Image 
                    src={file.coverArt} 
                    alt={file.title} 
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <button
                    onClick={() => handlePlay(file)}
                    className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 transition-colors text-[#a855f7] hover:text-white"
                  >
                    {String(currentTrack?.id) === String(file.id) && isPlaying ? (
                      <Waveform playing={true} className="w-5 h-5" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Track info - 2 lines only */}
                <div className="flex-1 min-w-0 py-0.5">
                  {/* Line 1: Title - Artist (with horizontal scroll animation when playing) */}
                  <Link href={`/track/${file.id}`}>
                    <div className="overflow-hidden cursor-pointer hover:text-green-400 transition-colors">
                      <p 
                        className={`font-medium text-white text-sm whitespace-nowrap ${
                          String(currentTrack?.id) === String(file.id) && isPlaying
                            ? 'animate-scroll'
                            : ''
                        }`}
                        style={
                          String(currentTrack?.id) === String(file.id) && isPlaying
                            ? {
                                animation: 'scroll-left 8s linear infinite',
                                paddingRight: '2rem'
                              }
                            : {}
                        }
                      >
                        {file.title} <span className="text-gray-400">• {file.artist}</span>
                      </p>
                    </div>
                  </Link>

                  {/* Line 2: Access Type | Genre | Duration | Play Count */}
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                    <span className={file.accessType === 'FREE' ? 'text-gray-400 font-semibold' : 'text-[#c4b5fd] font-semibold'}>
                      {file.accessType === 'FREE' ? 'FREE' : (file.accessType === 'PAY_PER_VIEW' ? 'PAY_PER_VIEW' : 'PREMIUM')}
                    </span>
                    <span>•</span>
                    <span className="truncate">{file.genre}</span>
                    <span>•</span>
                    <span>{formatDuration(file.duration)}</span>
                    <span>•</span>
                    <span>{file.playCount || 0}</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button 
                    onClick={() => handleLike(file.id)}
                    className="text-gray-400 hover:text-[#a855f7] transition-colors"
                  >
                    <Heart 
                      className="w-3.5 h-3.5" 
                      fill={file.likes > 0 ? 'currentColor' : 'none'} 
                    />
                  </button>
                  <button 
                    onClick={() => handleDownload(file)}
                    className={`transition-colors ${
                      file.accessType === 'PREMIUM' || file.accessType === 'PAY_PER_VIEW'
                        ? 'text-[#c4b5fd] hover:text-[#d8b4fe]'
                        : 'text-gray-400 hover:text-[#a855f7]'
                    }`}
                    aria-label="Download"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => handleShare(file)}
                    className="text-gray-400 hover:text-[#a855f7] transition-colors"
                    aria-label="Share"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedMedia(file);
                      setShowMediaMenu(true);
                    }}
                    className="text-gray-400 hover:text-[#a855f7] transition-colors"
                  >
                    <MoreHorizontal className="w-3.5 h-3.5" />
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
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
                >
                  Load more
                </button>
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
                    className="bg-black rounded-xl p-4 w-full max-w-sm"
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
                  onClick={() => selectedMedia && handlePlay(selectedMedia)}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/5 rounded-lg transition-colors"
                >
                  {currentTrack?.id === selectedMedia.id && isPlaying ? (
                    <Pause className="w-5 h-5 text-[#a855f7]" />
                  ) : (
                    <Play className="w-5 h-5 text-[#a855f7]" />
                  )}
                  <span className="text-white">
                    {currentTrack?.id === selectedMedia.id && isPlaying ? 'Pause' : 'Play'}
                  </span>
                </button>

                <button
                  onClick={() => selectedMedia && handleLike(selectedMedia.id)}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/5 rounded-lg transition-colors"
                >
                  <Heart 
                    className="w-5 h-5 text-[#a855f7]" 
                    fill={selectedMedia.likes > 0 ? '#a855f7' : 'none'}
                  />
                  <span className="text-white">Like</span>
                </button>

                <button
  className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/5 rounded-lg transition-colors"
  onClick={() => alert('Bookmark feature coming soon!')}
>
  <Bookmark className="w-5 h-5 text-[#a855f7]" />
  <span className="text-white">Bookmark</span>
</button>

                <button
  className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/5 rounded-lg transition-colors"
  onClick={() => alert('Save to Library feature coming soon!')}
>
  <BookmarkCheck className="w-5 h-5 text-[#a855f7]" />
  <span className="text-white">Save to Library</span>
</button>

                {selectedMedia.accessType === 'FREE' && (
                  <button
                    onClick={() => selectedMedia && handleDownload(selectedMedia)}
                    className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <Download className="w-5 h-5 text-[#a855f7]" />
                    <span className="text-white">Download</span>
                  </button>
                )}

                      {/* UPDATED PURCHASE BUTTON - FIXED */}
                      {(selectedMedia.accessType === 'PREMIUM' || selectedMedia.accessType === 'PAY_PER_VIEW') && typeof selectedMedia.price === 'number' && (
                        <button
                          onClick={() => {
                            setShowMediaMenu(false);
                            selectedMedia && handlePurchase(selectedMedia);
                          }}
                          className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/5 rounded-lg transition-colors"
                        >
                          <ShoppingCart className="w-5 h-5 text-[#a855f7]" />
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
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/5 rounded-lg transition-colors"
                >
                  <Plus className="w-5 h-5 text-[#a855f7]" />
                  <span className="text-white">Add to Playlist</span>
                </button>

                <button
                  onClick={() => selectedMedia && handleShare(selectedMedia)}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/5 rounded-lg transition-colors"
                >
                  <Share2 className="w-5 h-5 text-[#a855f7]" />
                  <span className="text-white">Share</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ShareModal
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        title={selectedMediaForShare?.title ?? ''}
        artist={selectedMediaForShare?.artist}
        coverUrl={selectedMediaForShare?.coverArt}
        url={selectedMediaForShare ? `${window.location.origin}/track/${selectedMediaForShare.id}` : ''}
        genre={selectedMediaForShare?.genre ?? undefined}
        duration={selectedMediaForShare ? formatDuration(selectedMediaForShare.duration) : undefined}
        shareText={selectedMediaForShare ? `Check out "${selectedMediaForShare.title}" by ${selectedMediaForShare.artist} on Fwaya.\n${window.location.origin}/track/${selectedMediaForShare.id}` : undefined}
        onShare={handleShareSuccess}
      />

                    {/* Mobile Money Modal */}
            {showMobileMoneyModal && selectedMediaForPayment && (
              <MobileMoneyPaymentModal
                isOpen={showMobileMoneyModal}
                onClose={() => {
                  setShowMobileMoneyModal(false);
                  setSelectedMediaForPayment(null);
                }}
                media={{
                  id: selectedMediaForPayment.id ?? 0,
                  title: selectedMediaForPayment.title ?? 'Unknown',
                  artist: selectedMediaForPayment.artist ?? 'Unknown',
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
              className="bg-[#0a0a0d] rounded-xl p-4 w-full max-w-sm"
              ref={menuRef}
            >
              <h3 className="font-medium text-white mb-4">Add to Playlist</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {userPlaylists.map(playlist => (
                  <button
                    key={playlist.id}
                    onClick={() => selectedMedia && handleAddToPlaylist(playlist.id, selectedMedia.id)}
                    className="w-full flex items-center gap-3 p-3 text-left hover:bg-[#100c26] rounded-lg transition-colors"
                  >
                    <div className="w-10 h-10 bg-[#100c26] rounded-lg flex items-center justify-center">
                      <ListMusic className="w-5 h-5 text-[#a855f7]" />
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

    </div>
  );
}


