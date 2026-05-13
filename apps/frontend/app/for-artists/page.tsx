"use client";
import Image from "next/image";
import { useState, useEffect, useRef } from 'react';
import { 
  Music, BarChart2, Users, Download, Settings, 
  PlusCircle, Edit3, Trash2, DollarSign, 
  MessageSquare, Video, Podcast, Mic,
  Headphones, Upload, Share2, Link, X,
  TrendingUp, UserCheck, Shield, Play, Pause
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/firebase-config';
import RoleGuard from '@/components/RoleGuard';
import { DashboardCard } from '@/components/DashboardCard';
import DashboardHeader from '@/components/DashboardHeader';
import MobilePlayer from '@/components/MobilePlayer';



// Updated types based on schema
interface Media {
  id: number;
  url: string;
  artCoverUrl: string | null;
  thumbnailUrl: string | null;
  title: string;
  description: string | null;
  type: 'AUDIO' | 'VIDEO' | 'PODCAST' | 'LIVE_STREAM';
  accessType: 'FREE' | 'PREMIUM' | 'PAY_PER_VIEW';
  price: number | null;
  duration?: number;
  isExplicit: boolean;
  playCount: number;
  downloadCount: number;
  shareCount: number;
  genre: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  userId: number;
  allowReselling: boolean;
  artistCommissionRate: number;
  platformCommissionRate: number;
  isDRMProtected: boolean;
}

interface Follower {
  id: number;
  follower: {
    id: number;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  createdAt: string;
}

interface Analytics {
  totalPlays: number;
  monthlyPlays: number;
  totalDownloads: number;
  monthlyDownloads: number;
  totalRevenue: number;
  monthlyRevenue: number;
  followerCount: number;
  playsByDay: number[];
  topCountries: Array<{
    country: string;
    plays: number;
    percentage: number;
  }>;
  topTracks: Array<{
    id: number;
    title: string;
    plays: number;
    revenue: number;
  }>;
}

interface Commission {
  id: number;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'HOLD';
  transactionId: number;
  mediaId: number;
  paidAt: string | null;
  createdAt: string;
  transaction: {
    reference: string;
    user: {
      displayName: string | null;
      username: string;
    };
  };
  media: {
    title: string;
  };
}

interface Stats {
  totalPlays: number;
  monthlyPlays: number;
  totalDownloads: number;
  monthlyDownloads: number;
  totalRevenue: number;
  monthlyRevenue: number;
  followerCount: number;
  activeTracks: number;
  conversionRate: number;
}

interface NewMedia {
  title: string;
  type: 'AUDIO' | 'VIDEO' | 'PODCAST' | 'LIVE_STREAM';
  file: File | null;
  artCoverFile: File | null;
  artCoverPreview: string | null;
  accessType: 'FREE' | 'PREMIUM' | 'PAY_PER_VIEW';
  price: string;
  genre: string;
  lyrics: string;
}

export default function ForArtistsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'content' | 'analytics' | 'followers' | 'monetization' | 'reseller'>('dashboard');
  const [stats, setStats] = useState<Stats | null>(null);
  const [media, setMedia] = useState<Media[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [newMedia, setNewMedia] = useState<NewMedia>({
    title: '',
    type: 'AUDIO',
    file: null,
    artCoverFile: null,
    artCoverPreview: null,
    accessType: 'FREE',
    price: '',
    genre: '',
    lyrics: '',
  });
  const [currentTrack, setCurrentTrack] = useState<Media | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMobilePlayerOpen, setIsMobilePlayerOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isTrackLoading, setIsTrackLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const formatZMW = (amount: number) =>
    amount.toLocaleString('en-ZM', {
      style: 'currency',
      currency: 'ZMW',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const handleMediaChange = (event: MediaQueryListEvent) => setIsMobile(event.matches);

    setIsMobile(mediaQuery.matches);
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaChange);
    } else {
      mediaQuery.addListener(handleMediaChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMediaChange);
      } else {
        mediaQuery.removeListener(handleMediaChange);
      }
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      setIsTrackLoading(false);
    };

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    if (audio.src !== currentTrack.url) {
      audio.src = currentTrack.url;
      audio.load();
      setIsTrackLoading(true);
    }

    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch((error) => {
          console.warn('Playback interrupted:', error);
          setIsPlaying(false);
        });
      }
    } else {
      audio.pause();
    }
  }, [currentTrack, isPlaying]);

  const seekInTrack = (time: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const changeVolume = (value: number) => {
    if (!audioRef.current) return;
    audioRef.current.volume = value;
    setVolume(value);
    setIsMuted(value === 0);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !audioRef.current.muted;
    setIsMuted(audioRef.current.muted);
  };

  const playTrack = (track: Media) => {
    if (currentTrack?.id === track.id) {
      setIsPlaying((prev) => !prev);
      return;
    }

    setCurrentTrack(track);
    setIsPlaying(true);
    setIsMobilePlayerOpen(true);
    setCurrentTime(0);
    setDuration(track.duration || 0);
  };

  const handlePlayPause = () => {
    setIsPlaying((prev) => !prev);
  };

  const handleMobilePlayerClose = () => {
    setIsMobilePlayerOpen(false);
    setIsPlaying(false);
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Get auth token from Firebase
      let token: string | null = null;
      if (auth.currentUser) {
        token = await auth.currentUser.getIdToken();
      }
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      
      const [
        statsRes,
        mediaRes,
        analyticsRes,
        followersRes,
        commissionsRes
      ] = await Promise.all([
        fetch('/api/artist/stats', { headers }),
        fetch('/api/artist/media', { headers }),
        fetch('/api/artist/analytics', { headers }),
        fetch('/api/artist/followers', { headers }),
        fetch('/api/artist/commissions', { headers })
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (mediaRes.ok) setMedia(await mediaRes.json());
      if (analyticsRes.ok) setAnalytics(await analyticsRes.json());
      if (followersRes.ok) setFollowers(await followersRes.json());
      if (commissionsRes.ok) setCommissions(await commissionsRes.json());

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!newMedia.file) {
      alert('Please select a file to upload');
      return;
    }

    if (!newMedia.title.trim()) {
      alert('Please enter a title');
      return;
    }

    if (newMedia.accessType !== 'FREE' && !newMedia.price.trim()) {
      alert('Please set a price for premium or pay-per-view content');
      return;
    }

    if (newMedia.price && isNaN(Number(newMedia.price))) {
      alert('Please enter a valid price');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      let artCoverUrl: string | null = null;
      if (newMedia.artCoverFile) {
        const coverFormData = new FormData();
        coverFormData.append('file', newMedia.artCoverFile);
        coverFormData.append('upload_preset', 'bymaxdev1');
        
        const coverResponse = await fetch(
          `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
          {
            method: 'POST',
            body: coverFormData,
          }
        );

        if (!coverResponse.ok) {
          throw new Error('Cover art upload failed');
        }

        const coverData = await coverResponse.json();
        artCoverUrl = coverData.secure_url;
        setUploadProgress(20);
      }

      // Step 1: Upload media file to Cloudinary
      const cloudinaryFormData = new FormData();
      cloudinaryFormData.append('file', newMedia.file);
      cloudinaryFormData.append('upload_preset', 'bymaxdev1');
      cloudinaryFormData.append('resource_type', 'auto');
      
      setUploadProgress(30);

      const cloudinaryResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/auto/upload`,
        {
          method: 'POST',
          body: cloudinaryFormData,
        }
      );

      if (!cloudinaryResponse.ok) {
        throw new Error('Cloudinary upload failed');
      }

      const cloudinaryData = await cloudinaryResponse.json();
      setUploadProgress(65);

      // Step 2: Save metadata to database via backend API
      const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;
      
      const dbFormData = new FormData();
      dbFormData.append('title', newMedia.title);
      dbFormData.append('type', newMedia.type);
      dbFormData.append('cloudinaryPublicId', cloudinaryData.public_id);
      dbFormData.append('url', cloudinaryData.secure_url);
      dbFormData.append('duration', cloudinaryData.duration?.toString() || '0');
      dbFormData.append('format', cloudinaryData.format);
      dbFormData.append('resourceType', cloudinaryData.resource_type);
      if (artCoverUrl) dbFormData.append('artCoverUrl', artCoverUrl);
      dbFormData.append('accessType', newMedia.accessType);
      dbFormData.append('genre', newMedia.genre.trim());
      if (newMedia.accessType !== 'FREE') dbFormData.append('price', newMedia.price.trim());
      if (newMedia.lyrics.trim()) dbFormData.append('lyrics', newMedia.lyrics.trim());

      setUploadProgress(80);

      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      const dbResponse = await fetch('/api/artist/media', {
        method: 'POST',
        body: dbFormData,
        headers,
      });

      setUploadProgress(90);

      if (dbResponse.ok) {
        const uploadedMedia = await dbResponse.json() as Media;
        setMedia(prev => [uploadedMedia, ...prev]);
        
        // Log cover art validation
        console.log('✅ Media Upload Successful:', {
          id: uploadedMedia.id,
          title: uploadedMedia.title,
          artCoverUrl: uploadedMedia.artCoverUrl,
          thumbnailUrl: uploadedMedia.thumbnailUrl,
          url: uploadedMedia.url,
          timestamp: new Date().toISOString(),
        });
        
        setUploadProgress(100);
        
        setTimeout(() => {
          setShowUploadModal(false);
          setNewMedia({
            title: '',
            type: 'AUDIO',
            file: null,
            artCoverFile: null,
            artCoverPreview: null,
            accessType: 'FREE',
            price: '',
            genre: '',
            lyrics: '',
          });
          setUploadProgress(0);
          setIsUploading(false);
          alert('Media uploaded successfully!');
        }, 500);
      } else {
        const errorData = await dbResponse.text();
        throw new Error(`Failed to save media metadata: ${dbResponse.status} - ${errorData}`);
      }
    } catch (error) {
      console.error('Error uploading media:', error);
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setUploadProgress(0);
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewMedia(prev => ({ ...prev, file }));
    }
  };

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image for the cover art');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setNewMedia(prev => ({ ...prev, artCoverPreview: reader.result as string }));
    };
    reader.readAsDataURL(file);
    setNewMedia(prev => ({ ...prev, artCoverFile: file }));
  };

  const generateResellerLink = async (mediaId: number) => {
    try {
      const response = await fetch('/api/reseller/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mediaId }),
      });

      if (response.ok) {
        alert('Reseller link generated successfully!');
        await fetchDashboardData();
      }
    } catch (error) {
      console.error('Error generating reseller link:', error);
    }
  };

  const updateMediaSettings = async (mediaId: number, updates: Partial<Media>) => {
    try {
      // Get auth token from Firebase
      let token: string | null = null;
      if (auth.currentUser) {
        token = await auth.currentUser.getIdToken();
      }
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`/api/artist/media/${mediaId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const updatedMedia = await response.json();
        setMedia(prev => prev.map(m => m.id === mediaId ? updatedMedia : m));
      }
    } catch (error) {
      console.error('Error updating media:', error);
    }
  };

  const deleteMedia = async (mediaId: number) => {
    if (!confirm('Are you sure you want to delete this media?')) return;

    try {
      // Get auth token from Firebase
      let token: string | null = null;
      if (auth.currentUser) {
        token = await auth.currentUser.getIdToken();
      }
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await fetch(`/api/artist/media/${mediaId}`, {
        method: 'DELETE',
        headers,
      });

      if (response.ok) {
        setMedia(prev => prev.filter(m => m.id !== mediaId));
        alert('Media deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting media:', error);
    }
  };

  const renderTabContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <DashboardCard
              title="Total Plays"
              value={(stats?.totalPlays || 0).toLocaleString()}
              icon={<BarChart2 className="w-5 h-5" />}
              change={`+${stats?.monthlyPlays || 0} this month`}
              color="bg-gradient-to-br from-blue-500/20 to-cyan-500/20"
            />

            <DashboardCard
              title="Followers"
              value={(stats?.followerCount || 0).toLocaleString()}
              icon={<Users className="w-5 h-5" />}
              change="↑ 8% from last month"
              color="bg-gradient-to-br from-purple-500/20 to-pink-500/20"
            />

            <DashboardCard
              title="Downloads"
              value={(stats?.totalDownloads || 0).toLocaleString()}
              icon={<Download className="w-5 h-5" />}
              change="↑ 15% from last month"
              color="bg-gradient-to-br from-green-500/20 to-emerald-500/20"
            />

            <DashboardCard
              title="Total Revenue"
              value={formatZMW(stats?.totalRevenue ?? 0)}
              icon={<DollarSign className="w-5 h-5" />}
              change={`${formatZMW(stats?.monthlyRevenue ?? 0)} this month`}
              color="bg-gradient-to-br from-yellow-500/20 to-orange-500/20"
            />

            <DashboardCard
              title="Active Tracks"
              value={String(stats?.activeTracks || 0)}
              icon={<Music className="w-5 h-5" />}
              change={`${stats?.conversionRate}% conversion rate`}
              color="bg-gradient-to-br from-indigo-500/20 to-blue-500/20"
            />

            <DashboardCard
              title="Reseller Sales"
              value={String(commissions.filter(c => c.status === 'PAID').length)}
              icon={<Share2 className="w-5 h-5" />}
              change="Through reseller program"
              color="bg-gradient-to-br from-teal-500/20 to-cyan-500/20"
            />
            
            <div className="md:col-span-2 lg:col-span-3 bg-slate-950 p-6 rounded-3xl">
              <h3 className="text-gray-400 mb-4">Plays Over Time</h3>
              <div className="h-64 bg-slate-900 rounded-3xl p-4">
                <div className="flex items-end h-full gap-1">
                  {(analytics?.playsByDay || []).map((count, i) => (
                    <div 
                      key={i}
                      className="flex-1 bg-gradient-to-t from-purple-500 to-purple-600 rounded-t-sm"
                      style={{ height: `${Math.min(100, (count / Math.max(...(analytics?.playsByDay || [1]))) * 100)}%` }}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-400">
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                  <span>Sun</span>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'content':
        return (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Your Content</h2>
              <button 
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600/10 hover:bg-purple-500/15 text-white rounded-3xl transition-colors"
              >
                <PlusCircle className="w-5 h-5" />
                Upload New
              </button>
            </div>
            
            <div className="space-y-4">
              {(media || []).map(item => (
                <div
                  key={item.id}
                  className="group rounded-2xl bg-slate-900/50 overflow-hidden ring-1 ring-white/10 hover:ring-purple-400/30 transition"
                >
                  <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto_auto_auto] gap-4 items-center p-4 md:p-5">
                    {/* Cover Art */}
                    <div className="relative h-14 w-14 overflow-hidden rounded-xl bg-slate-800 flex-shrink-0 md:block hidden">
                      {item.artCoverUrl && (
                        <Image
                          src={item.artCoverUrl}
                          alt={item.title}
                          fill
                          className="object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/default-cover.jpg';
                          }}
                        />
                      )}
                    </div>

                    {/* Title, Type, Genre Info */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="truncate text-base font-semibold text-white">{item.title}</p>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs flex-shrink-0 ${
                          item.type === 'AUDIO' ? 'bg-blue-600/30 text-blue-400' :
                          item.type === 'VIDEO' ? 'bg-purple-600/30 text-purple-400' :
                          item.type === 'PODCAST' ? 'bg-amber-600/30 text-amber-400' :
                          'bg-green-600/30 text-green-400'
                        }`}>
                          {item.type === 'AUDIO' ? <Music className="w-3 h-3" /> :
                           item.type === 'VIDEO' ? <Video className="w-3 h-3" /> :
                           item.type === 'PODCAST' ? <Podcast className="w-3 h-3" /> :
                           <Mic className="w-3 h-3" />}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
                        <span>{item.genre || 'Unknown'}</span>
                        <span>•</span>
                        <span className={`px-2 py-0.5 rounded-full ${
                          item.accessType === 'PREMIUM' ? 'bg-amber-600/20 text-amber-300' :
                          item.accessType === 'PAY_PER_VIEW' ? 'bg-green-600/20 text-green-300' :
                          'bg-gray-600/20 text-gray-300'
                        }`}>
                          {item.accessType}
                        </span>
                        {item.price && item.accessType !== 'FREE' && (
                          <>
                            <span>•</span>
                            <span className="text-gray-300">ZMW {item.price}</span>
                          </>
                        )}
                      </div>
                      <div className="flex gap-3 text-xs text-gray-500 mt-2">
                        <span className="flex items-center gap-1">
                          <Headphones className="w-3 h-3" />
                          {(item.playCount || 0).toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Download className="w-3 h-3" />
                          {(item.downloadCount || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Reselling Status - Hidden on Mobile */}
                    <div className="hidden lg:flex flex-col items-center gap-1">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                        item.allowReselling ? 'bg-green-600/20 text-green-300' : 'bg-gray-600/20 text-gray-400'
                      }`}>
                        {item.allowReselling ? 'Resale On' : 'Resale Off'}
                      </span>
                      {item.allowReselling && (
                        <button
                          onClick={() => generateResellerLink(item.id)}
                          className="text-xs text-purple-400 hover:text-purple-300 transition flex items-center gap-1"
                        >
                          <Link className="w-3 h-3" />
                          Link
                        </button>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => playTrack(item)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-purple-600 text-white hover:bg-purple-500 transition flex-shrink-0"
                        title={currentTrack?.id === item.id && isPlaying ? 'Pause track' : 'Play track'}
                      >
                        {currentTrack?.id === item.id && isPlaying ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* More Actions Dropdown - Mobile */}
                    <div className="flex items-center gap-1 md:gap-2">
                      <button 
                        onClick={() => updateMediaSettings(item.id, { allowReselling: !item.allowReselling })}
                        className="text-gray-400 hover:text-purple-300 transition p-2"
                        title={item.allowReselling ? 'Disable reselling' : 'Allow reselling'}
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button className="text-gray-400 hover:text-purple-300 transition p-2">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button className="text-gray-400 hover:text-purple-300 transition p-2">
                        <BarChart2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => deleteMedia(item.id)}
                        className="text-gray-400 hover:text-red-400 transition p-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      
      case 'analytics':
        return (
          <div className="space-y-8">
            <div className="bg-slate-950 p-6 rounded-3xl">
              <h3 className="text-xl font-bold text-white mb-4">Top Tracks</h3>
              <div className="bg-slate-900 rounded-3xl p-4">
                <table className="w-full">
                  <thead>
                    <tr className="text-gray-400 text-left">
                      <th className="p-3">Track</th>
                      <th className="p-3">Plays</th>
                      <th className="p-3">Revenue</th>
                      <th className="p-3">Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(analytics?.topTracks || []).map((track) => (
                      <tr key={track.id} className="hover:bg-slate-900 transition-colors">
                        <td className="p-3 text-white">{track.title}</td>
                        <td className="p-3 text-gray-300">{(track.plays || 0).toLocaleString()}</td>
                        <td className="p-3 text-green-400">{formatZMW(track.revenue ?? 0)}</td>
                        <td className="p-3">
                          <div className="w-32 bg-slate-900 rounded-full h-2 overflow-hidden">
                            <div 
                              className="h-full bg-purple-500 rounded-full"
                              style={{ width: `${analytics?.topTracks && analytics.topTracks.length > 0 ? (track.plays / Math.max(...analytics.topTracks.map(t => t.plays))) * 100 : 0}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="bg-slate-950 p-6 rounded-3xl">
              <h3 className="text-xl font-bold text-white mb-4">Top Countries</h3>
              <div className="bg-slate-900 rounded-3xl p-4">
                <table className="w-full">
                  <thead>
                    <tr className="text-gray-400 text-left">
                      <th className="p-3">Country</th>
                      <th className="p-3">Plays</th>
                      <th className="p-3">% of Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(analytics?.topCountries || []).map((country, i) => (
                      <tr key={i} className="hover:bg-slate-900 transition-colors">
                        <td className="p-3 text-white">{country.country}</td>
                        <td className="p-3 text-gray-300">{(country.plays || 0).toLocaleString()}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-32 bg-slate-900 rounded-full h-2 overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"
                                style={{ width: `${country.percentage}%` }}
                              />
                            </div>
                            <span className="text-gray-400">{country.percentage}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      
      case 'followers':
        return (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Your Followers</h2>
              <div className="flex items-center gap-2 text-gray-400">
                <Users className="w-5 h-5" />
                <span>{followers.length} followers</span>
              </div>
            </div>
            
            <div className="bg-slate-950 rounded-3xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="text-gray-400 text-left">
                    <th className="p-4">Follower</th>
                    <th className="p-4">Followed Since</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(followers || []).map(follower => (
                    <tr key={follower.id} className="hover:bg-slate-900 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {follower.follower.avatarUrl && (
                            <Image
                              src={follower.follower.avatarUrl}
                              alt={follower.follower.username}
                              width={40}
                              height={40}
                              className="rounded-full object-cover"
                            />
                          )}
                          <div>
                            <span className="font-medium text-white">
                              {follower.follower.displayName || follower.follower.username}
                            </span>
                            <p className="text-sm text-gray-400">@{follower.follower.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-gray-400">
                        {new Date(follower.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <button className="text-gray-400 hover:text-purple-300 transition-colors">
                          <MessageSquare className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      
      case 'monetization':
        return (
          <div className="space-y-6">
            <div className="bg-slate-950 p-6 rounded-3xl">
              <h3 className="text-xl font-bold text-white mb-4">Earnings Overview</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-slate-900 p-4 rounded-3xl">
                  <h4 className="text-gray-400">Total Earnings</h4>
                  <p className="text-2xl font-bold text-white mt-2">{formatZMW(stats?.totalRevenue ?? 0)}</p>
                </div>
                
                <div className="bg-slate-900 p-4 rounded-3xl">
                  <h4 className="text-gray-400">This Month</h4>
                  <p className="text-2xl font-bold text-white mt-2">{formatZMW(stats?.monthlyRevenue ?? 0)}</p>
                </div>
                
                <div className="bg-slate-900 p-4 rounded-3xl">
                  <h4 className="text-gray-400">Reseller Commissions</h4>
                  <p className="text-2xl font-bold text-white mt-2">
                    {formatZMW(commissions.reduce((sum, c) => sum + (c.status === 'PAID' ? c.amount : 0), 0))}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-950 p-6 rounded-3xl">
              <h3 className="text-xl font-bold text-white mb-4">Commission History</h3>
              <div className="bg-slate-900 rounded-3xl p-4">
                <table className="w-full">
                  <thead>
                    <tr className="text-gray-400 text-left">
                      <th className="p-3">Track</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(commissions || []).map(commission => (
                      <tr key={commission.id} className="hover:bg-slate-900 transition-colors">
                        <td className="p-3 text-white">{commission.media.title}</td>
                        <td className="p-3 text-green-400">
                          {commission.currency} {(commission.amount ?? 0).toFixed(2)}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            commission.status === 'PAID' ? 'bg-green-600/30 text-green-400' :
                            commission.status === 'PENDING' ? 'bg-yellow-600/30 text-yellow-400' :
                            'bg-purple-600/30 text-purple-400'
                          }`}>
                            {commission.status}
                          </span>
                        </td>
                        <td className="p-3 text-gray-400">
                          {new Date(commission.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'reseller':
        return (
          <div className="space-y-6">
            <div className="bg-slate-950 p-6 rounded-3xl">
              <h3 className="text-xl font-bold text-white mb-4">Reseller Program</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900 p-6 rounded-3xl">
                  <h4 className="text-white font-bold mb-2">Program Benefits</h4>
                  <ul className="text-gray-400 space-y-2">
                    <li className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-400" />
                      Increased exposure through reseller networks
                    </li>
                    <li className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-400" />
                      Earn commissions on every resold track
                    </li>
                    <li className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-green-400" />
                      Verified reseller community
                    </li>
                    <li className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-green-400" />
                      Protected content with DRM
                    </li>
                  </ul>
                </div>
                
                <div className="bg-slate-900 p-6 rounded-3xl">
                  <h4 className="text-white font-bold mb-2">Quick Stats</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Tracks with Reselling</span>
                      <span className="text-white">
                        {media.filter(m => m.allowReselling).length} / {media.length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Reseller Sales</span>
                      <span className="text-white">
                        {commissions.filter(c => c.status === 'PAID').length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Reseller Revenue</span>
                      <span className="text-green-400">
                        ${(commissions.reduce((sum, c) => sum + (c.status === 'PAID' ? c.amount : 0), 0) ?? 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-950 p-6 rounded-3xl">
              <h3 className="text-xl font-bold text-white mb-4">Reseller Settings</h3>
              <div className="space-y-4">
                {(media || []).map(item => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-slate-900 rounded-3xl">
                    <div>
                      <h4 className="text-white">{item.title}</h4>
                      <p className="text-sm text-gray-400">{item.genre}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        item.allowReselling ? 'bg-green-600/30 text-green-400' : 'bg-gray-600/30 text-gray-400'
                      }`}>
                        {item.allowReselling ? 'Reselling Enabled' : 'Reselling Disabled'}
                      </span>
                      <button
                        onClick={() => updateMediaSettings(item.id, { allowReselling: !item.allowReselling })}
                        className={`px-4 py-2 rounded-3xl text-sm ${
                          item.allowReselling 
                            ? 'bg-purple-600/30 text-purple-300 hover:bg-purple-500/40' 
                            : 'bg-green-600/30 text-green-400 hover:bg-green-600/40'
                        }`}
                      >
                        {item.allowReselling ? 'Disable' : 'Enable'}
                      </button>
                      {item.allowReselling && (
                        <button
                          onClick={() => generateResellerLink(item.id)}
                          className="px-4 py-2 bg-purple-600 text-white rounded-3xl hover:bg-purple-500 text-sm"
                        >
                          Generate Link
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <RoleGuard allowedRoles={['ARTIST']} 
      requireKYC={false}
      requireEmailVerification={false}>
          <div className="bg-black min-h-screen">
        {/* Your artist dashboard content */}
        {user?.kycStatus !== 'APPROVED' && (
          <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4 mb-6">
            <p className="text-yellow-400">
              Complete KYC verification to access all artist features.
            </p>
          </div>
        )}
      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[120] p-2 sm:p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#050509] border border-white/10 rounded-[28px] p-4 sm:p-5 w-full max-w-[26rem] shadow-2xl max-h-[calc(100vh-5rem)] overflow-y-auto"
            >
              <div className="flex items-center justify-between gap-4 mb-4">
                <h2 className="text-xl font-bold text-white">Upload New Media</h2>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="rounded-full p-2 text-gray-400 hover:text-white hover:bg-white/10 transition"
                  aria-label="Close upload modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              {isUploading ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-400 text-sm">Uploading...</span>
                      <span className="text-white font-medium">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-[#11131c] rounded-full h-3 overflow-hidden">
                      <motion.div 
                        className="h-full bg-purple-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm text-center">
                    {uploadProgress < 50 ? 'Preparing file...' : uploadProgress < 90 ? 'Uploading to cloud...' : 'Finalizing...'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-gray-400 mb-2">Title *</label>
                    <input
                      type="text"
                      className="w-full bg-[#090a0f] rounded-3xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Enter media title"
                      value={newMedia.title}
                      onChange={(e) => setNewMedia({...newMedia, title: e.target.value})}
                      disabled={isUploading}
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 mb-2">Type *</label>
                    <select
                      className="w-full bg-[#090a0f] rounded-3xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      value={newMedia.type}
                      onChange={(e) => setNewMedia({
                        ...newMedia, 
                        type: e.target.value as 'AUDIO' | 'VIDEO' | 'PODCAST' | 'LIVE_STREAM'
                      })}
                      disabled={isUploading}
                    >
                      <option value="AUDIO">Audio Track</option>
                      <option value="VIDEO">Video</option>
                      <option value="PODCAST">Podcast</option>
                      <option value="LIVE_STREAM">Live Stream</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-400 mb-2">Genre</label>
                    <input
                      type="text"
                      className="w-full bg-[#090a0f] rounded-3xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Enter genre (e.g. Afrobeats, Hip Hop, Gospel)"
                      value={newMedia.genre}
                      onChange={(e) => setNewMedia({ ...newMedia, genre: e.target.value })}
                      disabled={isUploading}
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 mb-2">Cover Art</label>
                    <div className="bg-[#08080e] rounded-3xl p-3 text-center">
                      <input
                        type="file"
                        className="hidden"
                        id="cover-upload"
                        onChange={handleCoverSelect}
                        accept="image/*"
                        disabled={isUploading}
                      />
                      <label htmlFor="cover-upload" className="cursor-pointer inline-flex flex-col items-center gap-1 text-gray-400">
                        <Upload className="w-6 h-6 text-purple-400" />
                        <span className="text-white font-medium">Upload cover art</span>
                        <span className="text-xs">JPG, PNG, WEBP</span>
                      </label>
                      {newMedia.artCoverPreview && (
                        <img src={newMedia.artCoverPreview} alt="Cover preview" className="mx-auto mt-3 h-20 w-20 rounded-3xl object-cover" />
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-400 mb-2">File * (Max 10MB)</label>
                    <div className="bg-[#08080e] rounded-3xl p-4 text-center">
                      <div className="flex flex-col items-center justify-center gap-1 text-gray-400">
                        <Upload className="w-8 h-8 text-purple-400" />
                        <input
                          type="file"
                          className="hidden"
                          id="file-upload"
                          onChange={handleFileSelect}
                          accept="audio/*,video/*"
                          disabled={isUploading}
                        />
                        <label htmlFor="file-upload" className="cursor-pointer text-white font-medium">
                          Click to select file
                        </label>
                        <p className="text-sm">MP3, WAV, FLAC, MP4, MOV</p>
                        {newMedia.file && (
                          <p className="text-purple-300 text-sm mt-2">
                            ✓ {newMedia.file.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-400 mb-2">Pricing</label>
                    <div className="grid grid-cols-1 gap-3">
                      <select
                        className="w-full bg-[#090a0f] rounded-3xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        value={newMedia.accessType}
                        onChange={(e) => setNewMedia({ ...newMedia, accessType: e.target.value as 'FREE' | 'PREMIUM' | 'PAY_PER_VIEW' })}
                        disabled={isUploading}
                      >
                        <option value="FREE">Free</option>
                        <option value="PREMIUM">Premium</option>
                        <option value="PAY_PER_VIEW">Pay Per View</option>
                      </select>
                      {newMedia.accessType !== 'FREE' && (
                        <input
                          type="text"
                          className="w-full bg-[#090a0f] rounded-3xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="Set price in ZMW"
                          value={newMedia.price}
                          onChange={(e) => setNewMedia({ ...newMedia, price: e.target.value })}
                          disabled={isUploading}
                        />
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-400 mb-2">Optional Lyrics</label>
                    <textarea
                      rows={4}
                      className="w-full bg-[#090a0f] rounded-3xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Add lyrics or production notes"
                      value={newMedia.lyrics}
                      onChange={(e) => setNewMedia({ ...newMedia, lyrics: e.target.value })}
                      disabled={isUploading}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                    <button
                      onClick={() => {
                        setShowUploadModal(false);
                        setNewMedia({ title: '', type: 'AUDIO', file: null, artCoverFile: null, artCoverPreview: null, accessType: 'FREE', price: '', genre: '', lyrics: '' });
                      }}
                      className="px-4 py-2 bg-[#11131c] text-white rounded-3xl hover:bg-[#161a24] transition-colors"
                      disabled={isUploading}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpload}
                      disabled={!newMedia.title || !newMedia.file || isUploading}
                      className="px-4 py-2 bg-purple-600 disabled:bg-gray-600 text-white rounded-3xl hover:bg-purple-500 transition-colors disabled:cursor-not-allowed"
                    >
                      {isUploading ? 'Uploading...' : 'Upload'}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Header */}
      <DashboardHeader />

      <div className="max-w-7xl mx-auto p-6 pb-32">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Music className="w-8 h-8 text-purple-400" />
              Artist Dashboard
            </h1>
            <p className="text-gray-400">Manage your music, view analytics, and connect with fans</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-slate-900 text-white rounded-3xl hover:bg-slate-800 transition-colors flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Settings
            </button>
            <button 
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-3xl hover:bg-purple-500 transition-colors flex items-center gap-2"
            >
              <PlusCircle className="w-5 h-5" />
              Upload
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto mb-6">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: <BarChart2 className="w-5 h-5" /> },
            { id: 'content', label: 'Content', icon: <Music className="w-5 h-5" /> },
            { id: 'analytics', label: 'Analytics', icon: <TrendingUp className="w-5 h-5" /> },
            { id: 'followers', label: 'Followers', icon: <Users className="w-5 h-5" /> },
            { id: 'monetization', label: 'Monetization', icon: <DollarSign className="w-5 h-5" /> },
            { id: 'reseller', label: 'Reseller Program', icon: <Share2 className="w-5 h-5" /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-3 font-medium whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'text-purple-400 border-b-2 border-purple-400' 
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {tab.icon}
                {tab.label}
              </div>
            </button>
          ))}
        </div>

        {/* Content */}
        {renderTabContent()}
        {isMobile && isMobilePlayerOpen && currentTrack && (
          <MobilePlayer
            track={{
              id: currentTrack.id,
              title: currentTrack.title,
              imageUrl: currentTrack.artCoverUrl || currentTrack.thumbnailUrl || '/default-cover.jpg',
              audioUrl: currentTrack.url,
              duration: currentTrack.duration || 0,
            }}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            volume={volume}
            isMuted={isMuted}
            isLoading={isTrackLoading}
            onPlayPause={handlePlayPause}
            onClose={handleMobilePlayerClose}
            onSeek={seekInTrack}
            onVolumeChange={changeVolume}
            onToggleMute={toggleMute}
          />
        )}
        <audio ref={audioRef} className="hidden" />
      </div>
    </div>
    </RoleGuard>
  );
}




