"use client";
import { ReactNode } from "react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Image from "next/image";
import {DashboardLoading} from '@/components/DashboardLoading';
import {
  FaPlay,
  FaPause,
  FaHeadphones,
  FaDownload,
  FaHeart,
  FaRegHeart,
  FaHistory,
  FaCrown,
  FaMusic,
  FaUser,
  FaUsers,
  FaShare,
  FaBell,
  FaSearch,
  FaRandom,
  FaStepForward,
  FaStepBackward,
  FaVolumeUp,
  FaClock,
  FaGlobe,
  FaChartLine,      
  FaStar,
  FaBookmark,       
  FaShoppingCart,
  FaDollarSign,
  FaCalendar,
  FaMapPin,
  FaEdit,
  FaCog,
  FaPlus,
  FaList,
  FaThLarge,       
  FaEye,
  FaCompactDisc,
  FaMicrophone,
  FaPodcast,
  FaVideo,
  FaBroadcastTower, 
  FaLock,
  FaUnlock,
  FaUpload,         
} from "react-icons/fa";
import { useRouter } from "next/navigation";
import RoleGuard from '@/components/RoleGuard';
import { useAuth } from "../context/AuthContext";

export interface User {
   id: number;
   email: string;
   username: string;
   displayName: string | null;
   avatarUrl: string | null;
   role: "USER" | "ARTIST" | "ADMIN" | "MODERATOR" | "RESELLER";
   status: "PENDING" | "ACTIVE" | "SUSPENDED" | "VERIFIED" | "REJECTED";
   isEmailVerified: boolean;
   isPhoneVerified: boolean;
   kycStatus: string; // Use string if you have many possible values
   createdAt: string;
   premiumUntil: string | null;
   walletBalance: number;
   totalEarnings: number;
   isReseller: boolean;
   resellerCode: string | null;
   totalCommission: number;
   paidCommission: number;
   country: string | null;
   defaultCurrency: string;
   isPremium: boolean;
   artistName?: string;
   stageName?: string;
   businessName?: string;
   bio?: string;
   website?: string;
   socialLinks?: Record<string, string>;
 }

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
  interactions?: { liked: boolean; saved: boolean }[];
  accessType: 'FREE' | 'PREMIUM' | 'PAY_PER_VIEW';
  price?: number;
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

interface Playlist {
  id: number;
  name: string;
  description?: string;
  coverUrl?: string;
  isPublic: boolean;
  type: 'SYSTEM' | 'USER' | 'SMART' | 'RADIO';
  mediaCount: number;
  createdAt: string;
}

interface StatCard {
  label: string;
  value: string;
  icon: ReactNode;
  change?: string;
  color: string;
}

const UserDashboard: React.FC = () => {
  // read auth state
  const { user, loading: authLoading } = useAuth();

  // Hooks must be called unconditionally — declare them first
  const [recentPlays, setRecentPlays] = useState<MediaFile[]>([]);
  const [recommendations, setRecommendations] = useState<MediaFile[]>([]);
  const [userPlaylists, setUserPlaylists] = useState<Playlist[]>([]);
  const [userMedia, setUserMedia] = useState<MediaFile[]>([]);
  const router = useRouter();
  const [libraryStats, setLibraryStats] = useState({
    totalSongs: 0,
    totalArtists: 0,
    totalPlaylists: 0,
    totalMinutes: 0,
  });
  const [currentTrack, setCurrentTrack] = useState<MediaFile | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Fetch user data from backend
useEffect(() => {
    if (!user) return; // safe guard when auth not ready

    const fetchUserData = async () => {
      try {
        setLoading(true);
        const token = await fetch('/api/auth/token').then(res => res.json());

        const [
          recentPlaysRes,
          recommendationsRes,
          playlistsRes,
          userMediaRes,
          statsRes
        ] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/${user.id}/recent-plays`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/${user.id}/recommendations`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/${user.id}/playlists`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/${user.id}/media`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/${user.id}/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        if (recentPlaysRes.ok) setRecentPlays(await recentPlaysRes.json());
        if (recommendationsRes.ok) setRecommendations(await recommendationsRes.json());
        if (playlistsRes.ok) setUserPlaylists(await playlistsRes.json());
        if (userMediaRes.ok) setUserMedia(await userMediaRes.json());
        if (statsRes.ok) setLibraryStats(await statsRes.json());

      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  if (authLoading || !user) return <DashboardLoading />;

  const quickStats: StatCard[] = [
    {
      label: 'Minutes Listened',
      value: Math.floor(libraryStats.totalMinutes).toString(),
      icon: <FaHeadphones />,
      change: '+12%',
      color: 'from-[#e51f48] to-[#ff4d6d]'
    },
    {
      label: 'Tracks in Library',
      value: libraryStats.totalSongs.toString(),
      icon: <FaMusic />,
      change: '+5',
      color: 'from-[#e51f48] to-[#ff4d6d]'
    },
    {
      label: 'Playlists',
      value: libraryStats.totalPlaylists.toString(),
      icon: <FaList />,
      change: '+2',
      color: 'from-[#e51f48] to-[#ff4d6d]'
    },
    {
      label: 'Artists Followed',
      value: libraryStats.totalArtists.toString(),
      icon: <FaUsers />,
      change: '+3',
      color: 'from-[#e51f48] to-[#ff4d6d]'
    }
   ];

  
  // Enhanced stats for artists and resellers
  const businessStats: StatCard[] = user.role === 'ARTIST' ? [
    { 
      label: 'Total Earnings', 
      value: `$${(user.totalEarnings ?? 0).toFixed(2)}`, 
      icon: <FaDollarSign />, 
      change: '+15%',
      color: 'from-green-500 to-emerald-500'
    },
    { 
      label: 'Total Plays', 
      value: userMedia.reduce((sum, media) => sum + media.views, 0).toLocaleString(), 
      icon: <FaHeadphones />, 
      change: '+23%',
      color: 'from-blue-500 to-cyan-500'
    },
    { 
      label: 'Uploads', 
      value: userMedia.length.toString(), 
      icon: <FaUpload />, 
      change: '+2',
      color: 'from-purple-500 to-pink-500'
    },
    { 
      label: 'Avg. Rating', 
      value: '4.8', 
      icon: <FaStar />, 
      change: '+0.2',
      color: 'from-amber-500 to-orange-500'
    }
  ] : user.role === 'RESELLER' ? [
    { 
      label: 'Total Commission', 
      value: `$${(user.totalCommission ?? 0).toFixed(2)}`, 
      icon: <FaDollarSign />, 
      change: '+18%',
      color: 'from-green-500 to-emerald-500'
    },
    { 
      label: 'Paid Out', 
      value: `$${(user.paidCommission ?? 0).toFixed(2)}`, 
      icon: <FaChartLine />, 
      change: '+12%',
      color: 'from-blue-500 to-cyan-500'
    },
    { 
      label: 'Active Links', 
      value: '24', 
      icon: <FaShare />, 
      change: '+3',
      color: 'from-purple-500 to-pink-500'
    },
    { 
      label: 'Conversion Rate', 
      value: '8.5%', 
      icon: <FaChartLine />, 
      change: '+1.2%',
      color: 'from-amber-500 to-orange-500'
    }
  ] : [];

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'AUDIO': return <FaMusic className="w-4 h-4" />;
      case 'VIDEO': return <FaVideo className="w-4 h-4" />;
      case 'PODCAST': return <FaPodcast className="w-4 h-4" />;
      case 'LIVE_STREAM': return <FaBroadcastTower className="w-4 h-4" />;
      default: return <FaMusic className="w-4 h-4" />;
    }
  };

  const handlePlay = (track: MediaFile) => {
    if (currentTrack?.id === track.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentTrack(track);
      setIsPlaying(true);
    }
  };

  const handleLike = async (mediaId: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/media/${mediaId}/like`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        // Update local state
        setRecentPlays(prev => prev.map(item => 
          item.id === mediaId ? { ...item, likes: item.likes + 1 } : item
        ));
        setRecommendations(prev => prev.map(item => 
          item.id === mediaId ? { ...item, likes: item.likes + 1 } : item
        ));
      }
    } catch (error) {
      console.error('Error liking media:', error);
    }
  };

  const handleDownload = async (file: MediaFile) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/media/${file.id}/download`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
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

      if (response.ok) {
        const downloadData = await response.json();
        // Trigger download
        window.open(downloadData.downloadUrl, '_blank');
      }
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a1f29] to-[#0a3747] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#e51f48] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={['USER']} customLoadingComponent={<DashboardLoading/>}>
    <div className="min-h-screen bg-gradient-to-b from-[#0a1f29] to-[#0a3747] text-white">
      {/* Enhanced Header */}
      <header className="bg-[#0a3747]/80 backdrop-blur-lg border-b border-[#0a3747] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {user.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt={user.displayName || user.username}
                  width={70}
                  height={70}
                  className="rounded-full border-2 border-[#e51f48]"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#e51f48] to-[#ff4d6d] flex items-center justify-center border-2 border-[#e51f48]">
                  <FaUser className="text-white text-2xl" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold">
                    {user.displayName || user.username}
                  </h1>
                  {user.role !== 'USER' && (
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      user.role === 'ARTIST' ? 'bg-purple-500/20 text-purple-400' :
                      user.role === 'RESELLER' ? 'bg-green-500/20 text-green-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {user.role}
                    </span>
                  )}
                  {user.isPremium && (
                    <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs font-semibold flex items-center gap-1">
                      <FaCrown className="w-3 h-3" />
                      PREMIUM
                    </span>
                  )}
                </div>
                <p className="text-gray-300 flex items-center gap-2">
                  <FaMapPin className="w-3 h-3" />
                  {user.country || 'Global'} • Joined {new Date(user.createdAt ?? Date.now()).toLocaleDateString()}
                </p>
                {user.artistName && (
                  <p className="text-purple-400 text-sm">Artist: {user.artistName}</p>
                )}
                {user.businessName && (
                  <p className="text-green-400 text-sm">Business: {user.businessName}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="bg-[#0a1f29] rounded-full p-2 border border-[#0a3747]">
                {user.walletBalance && user.walletBalance > 0 ? (
                  <div className="flex items-center gap-2 text-sm">
                    <FaDollarSign className="text-green-400" />
                    <span className="font-semibold">${user.walletBalance.toFixed(2)}</span>
                  </div>
                ) : (
                  <button
                    onClick={() => router.push('/reseller-dashboard')}
                    className="px-3 py-1 bg-[#e51f48] hover:bg-[#ff4d6d] text-white rounded-full text-sm font-semibold transition-colors"
                  >
                    Become a Reseller
                  </button>
                )}
              </div>
              <button className="p-3 bg-[#0a1f29] rounded-full hover:bg-[#0a3747] transition-colors border border-[#0a3747] relative">
                <FaBell />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#e51f48] rounded-full"></span>
              </button>
              <button className="p-3 bg-[#0a1f29] rounded-full hover:bg-[#0a3747] transition-colors border border-[#0a3747]">
                <FaCog />
              </button>
            </div>
          </div>


          {/* Navigation Tabs */}
          <nav className="mt-6 flex space-x-1 bg-[#0a1f29] rounded-xl p-1 border border-[#0a3747]">
            {[
              { id: 'overview', label: 'Overview', icon: <FaChartLine /> },
              { id: 'library', label: 'My Library', icon: <FaMusic /> },
              { id: 'playlists', label: 'Playlists', icon: <FaList /> },
              ...(user.role === 'ARTIST' ? [{ id: 'uploads', label: 'My Uploads', icon: <FaUpload /> }] : []),
              ...(user.role === 'RESELLER' ? [{ id: 'reseller', label: 'Reseller Hub', icon: <FaShare /> }] : []),
              { id: 'stats', label: 'Statistics', icon: <FaChartLine /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#e51f48] text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-[#0a3747]'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 pb-32">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-gradient-to-br ${stat.color} p-6 rounded-2xl shadow-lg hover:scale-105 transition-transform cursor-pointer`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-white/90 text-sm">{stat.label}</div>
                </div>
                <div className="text-white/80 text-2xl">
                  {stat.icon}
                </div>
              </div>
              {stat.change && (
                <div className="mt-3 text-white/80 text-sm flex items-center gap-1">
                  <FaChartLine className="w-3 h-3" />
                  {stat.change} this month
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Business Stats for Artists/Resellers */}
        {(user.role === 'ARTIST' || user.role === 'RESELLER') && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FaChartLine />
              Business Overview
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {businessStats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`bg-gradient-to-br ${stat.color} p-4 rounded-xl shadow-lg`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-white">{stat.value}</div>
                      <div className="text-white/80 text-sm">{stat.label}</div>
                    </div>
                    <div className="text-white/80 text-xl">
                      {stat.icon}
                    </div>
                  </div>
                  {stat.change && (
                    <div className="mt-2 text-white/80 text-xs">
                      {stat.change} from last month
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Recently Played */}
          <div className="xl:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FaHistory />
                Recently Played
              </h2>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-[#e51f48] text-white' : 'bg-[#0a3747] text-gray-400'}`}
                >
                  <FaThLarge className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-[#e51f48] text-white' : 'bg-[#0a3747] text-gray-400'}`}
                >
                  <FaList className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {viewMode === 'list' ? (
              <div className="space-y-2">
                {recentPlays.slice(0, 8).map((track, index) => (
                  <motion.div
                    key={track.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-4 p-4 hover:bg-[#0a3747]/50 rounded-xl cursor-pointer group transition-all border border-transparent hover:border-[#0a4a5f]"
                    onClick={() => handlePlay(track)}
                  >
                    <div className="relative flex-shrink-0">
                      <Image
                        src={track.coverArt}
                        alt={track.title}
                        width={50}
                        height={50}
                        className="rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/default-cover.jpg';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center rounded-lg transition-all">
                        {currentTrack?.id === track.id && isPlaying ? (
                          <FaPause className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        ) : (
                          <FaPlay className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate flex items-center gap-2">
                        {track.title}
                        {track.isExplicit && (
                          <span className="px-1.5 py-0.5 bg-gray-600 text-gray-300 rounded text-xs">E</span>
                        )}
                        {track.isDRMProtected && (
                          <FaLock className="w-3 h-3 text-blue-400" />
                        )}
                      </h3>
                      <p className="text-sm text-gray-400 truncate">{track.artist}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                        <span>{track.genre}</span>
                        <span>•</span>
                        <span>{formatDuration(track.duration)}</span>
                        <span>•</span>
                        <span>{track.views.toLocaleString()} plays</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleLike(track.id); }}
                        className="text-gray-400 hover:text-[#e51f48] transition-colors"
                      >
                        <FaHeart className={track.likes > 0 ? 'text-[#e51f48] fill-current' : ''} />
                      </button>
                      {track.accessType === 'FREE' && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDownload(track); }}
                          className="text-gray-400 hover:text-white transition-colors"
                        >
                          <FaDownload />
                        </button>
                      )}
                      <button className="text-gray-400 hover:text-white transition-colors">
                        <FaShare />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {recentPlays.slice(0, 6).map((track, index) => (
                  <motion.div
                    key={track.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-[#0a3747]/50 rounded-xl overflow-hidden hover:bg-[#0a3747]/70 transition-all group cursor-pointer border border-transparent hover:border-[#0a4a5f]"
                    onClick={() => handlePlay(track)}
                  >
                    <div className="relative">
                      <Image
                        src={track.coverArt}
                        alt={track.title}
                        width={300}
                        height={300}
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/default-cover.jpg';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-all">
                        <div className="flex gap-2">
                          {currentTrack?.id === track.id && isPlaying ? (
                            <button className="w-12 h-12 rounded-full bg-[#e51f48] flex items-center justify-center shadow-lg">
                              <FaPause className="text-white" />
                            </button>
                          ) : (
                            <button className="w-12 h-12 rounded-full bg-[#e51f48] flex items-center justify-center shadow-lg">
                              <FaPlay className="text-white ml-1" />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {/* Badges */}
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        {track.accessType === 'PREMIUM' && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs">
                            <FaCrown className="w-3 h-3" />
                            Premium
                          </div>
                        )}
                        {track.accessType === 'PAY_PER_VIEW' && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
                            <FaDollarSign className="w-3 h-3" />
                            ${track.price}
                          </div>
                        )}
                        {track.isDRMProtected && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                            <FaLock className="w-3 h-3" />
                            DRM
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-semibold truncate mb-1">{track.title}</h3>
                      <p className="text-sm text-gray-400 truncate mb-2">{track.artist}</p>
                      <div className="flex justify-between items-center text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          {getTypeIcon(track.type || 'AUDIO')}
                          <span>{track.type}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span>{formatDuration(track.duration)}</span>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleLike(track.id); }}
                            className="text-gray-400 hover:text-[#e51f48] transition-colors"
                          >
                            <FaHeart className={track.likes > 0 ? 'text-[#e51f48] fill-current' : ''} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>



          {/* Sidebar - Recommendations & Quick Actions */}
          <div className="space-y-6">
            {/* Recommendations */}
            <section className="bg-[#0a3747]/50 rounded-2xl p-6 border border-[#0a4a5f]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <FaStar className="text-amber-400" />
                  Recommended For You
                </h2>
                <button className="text-[#e51f48] hover:underline text-sm">
                  More
                </button>
              </div>
              
              <div className="space-y-3">
                {recommendations.slice(0, 5).map((track, index) => (
                  <motion.div
                    key={track.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3 p-3 hover:bg-[#0a3747] rounded-lg cursor-pointer group transition-colors"
                    onClick={() => handlePlay(track)}
                  >
                    <div className="relative flex-shrink-0">
                      <Image
                        src={track.coverArt}
                        alt={track.title}
                        width={40}
                        height={40}
                        className="rounded"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/default-cover.jpg';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center rounded transition-all">
                        <FaPlay className="text-white opacity-0 group-hover:opacity-100 transition-opacity w-3 h-3" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">{track.title}</h3>
                      <p className="text-xs text-gray-400 truncate">{track.artist}</p>
                    </div>
                    
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleLike(track.id); }}
                        className="text-gray-400 hover:text-[#e51f48] transition-colors"
                      >
                        <FaRegHeart className="w-3 h-3" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Quick Actions */}
            <section className="bg-[#0a3747]/50 rounded-2xl p-6 border border-[#0a4a5f]">
              <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Browse Music', icon: <FaSearch />, href: '/browse', color: 'bg-blue-500/20 text-blue-400' },
                  { label: 'Your Library', icon: <FaMusic />, href: '/library', color: 'bg-green-500/20 text-green-400' },
                  { label: 'Create Playlist', icon: <FaPlus />, href: '/playlists/new', color: 'bg-purple-500/20 text-purple-400' },
                  { label: 'Liked Songs', icon: <FaHeart />, href: '/library/liked', color: 'bg-pink-500/20 text-pink-400' },
                  ...(user.role === 'ARTIST' ? [
                    { label: 'Upload Media', icon: <FaUpload />, href: '/upload', color: 'bg-amber-500/20 text-amber-400' },
                    { label: 'Earnings', icon: <FaDollarSign />, href: '/earnings', color: 'bg-emerald-500/20 text-emerald-400' },
                  ] : []),
                  ...(user.role === 'RESELLER' ? [
                    { label: 'Reseller Hub', icon: <FaShare />, href: '/reseller', color: 'bg-teal-500/20 text-teal-400' },
                    { label: 'Commission', icon: <FaChartLine />, href: '/commission', color: 'bg-indigo-500/20 text-indigo-400' },
                  ] : []),
                  { label: 'Settings', icon: <FaCog />, href: '/settings', color: 'bg-gray-500/20 text-gray-400' },
                ].slice(0, 6).map((action, index) => (
                  <motion.a
                    key={action.label}
                    href={action.href}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={`${action.color} p-3 rounded-xl text-center hover:scale-105 transition-transform border border-transparent hover:border-current/20`}
                  >
                    <div className="text-lg mb-1 flex justify-center">
                      {action.icon}
                    </div>
                    <div className="text-xs font-medium">{action.label}</div>
                  </motion.a>
                ))}
              </div>
            </section>

            {/* Recent Playlists */}
            {userPlaylists.length > 0 && (
              <section className="bg-[#0a3747]/50 rounded-2xl p-6 border border-[#0a4a5f]">
                <h2 className="text-lg font-bold mb-4">Your Playlists</h2>
                <div className="space-y-3">
                  {userPlaylists.slice(0, 4).map((playlist, index) => (
                    <motion.div
                      key={playlist.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-3 p-3 hover:bg-[#0a3747] rounded-lg cursor-pointer transition-colors"
                    >
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                        <FaMusic className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate">{playlist.name}</h3>
                        <p className="text-xs text-gray-400">{playlist.mediaCount} tracks</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>

        {/* User Uploads Section for Artists */}
        {user.role === 'ARTIST' && userMedia.length > 0 && (
          <section className="mt-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FaMicrophone />
                Your Uploads
              </h2>
              <a href="/upload" className="text-[#e51f48] hover:underline text-sm flex items-center gap-1">
                <FaPlus className="w-3 h-3" />
                Upload New
              </a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {userMedia.slice(0, 4).map((media, index) => (
                <motion.div
                  key={media.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-[#0a3747]/50 rounded-xl p-4 hover:bg-[#0a3747]/70 transition-colors border border-[#0a4a5f]"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Image
                      src={media.coverArt}
                      alt={media.title}
                      width={50}
                      height={50}
                      className="rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/default-cover.jpg';
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate">{media.title}</h3>
                      <p className="text-xs text-gray-400">{media.views.toLocaleString()} plays</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-400">
                    <span>Earnings: ${((media.views * 0.001) * (media.artistCommissionRate || 0.5)).toFixed(2)}</span>
                    <span>{formatDuration(media.duration)}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

{/* Feature Legend & Icon Reference */}
<section className="mt-12 bg-[#0a3747]/50 rounded-2xl border border-[#0a4a5f] p-6">
  <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
    <FaEye />
    Feature Legend & Icon Reference
  </h2>
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
    {[
      { icon: <FaClock />, label: "Clock" },
      { icon: <FaGlobe />, label: "Globe" },
      { icon: <FaBookmark />, label: "Bookmark" },
      { icon: <FaShoppingCart />, label: "Shopping Cart" },
      { icon: <FaCalendar />, label: "Calendar" },
      { icon: <FaEdit />, label: "Edit" },
      { icon: <FaEye />, label: "Eye" },
      { icon: <FaCompactDisc />, label: "Compact Disc" },
      { icon: <FaUnlock />, label: "Unlock" },
    ].map(({ icon, label }) => (
      <div key={label} className="flex items-center gap-3 p-3 bg-[#0a1f29] rounded-lg">
        <span className="text-2xl">{icon}</span>
        <span className="text-sm">{label}</span>
      </div>
    ))}
  </div>
  <div className="mt-6 text-sm text-gray-300">
    <FaCompactDisc className="inline mr-2" />
    Example file size: {formatFileSize(5242880)}
  </div>
</section>
      </main>

      {/* Enhanced Mini Player */}
      {currentTrack && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-0 left-0 right-0 bg-[#0a3747]/95 backdrop-blur-lg border-t border-[#0a4a5f] p-4 shadow-2xl"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Track Info */}
            <div className="flex items-center gap-4 w-1/4">
              <Image
                src={currentTrack.coverArt}
                alt={currentTrack.title}
                width={56}
                height={56}
                className="rounded-lg shadow-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/default-cover.jpg';
                }}
              />
              <div className="min-w-0">
                <p className="font-semibold text-white truncate">{currentTrack.title}</p>
                <p className="text-sm text-gray-300 truncate">{currentTrack.artist}</p>
              </div>
              <button 
                onClick={() => handleLike(currentTrack.id)}
                className="text-gray-300 hover:text-[#e51f48] transition-colors"
              >
                <FaHeart className={currentTrack.likes > 0 ? 'text-[#e51f48] fill-current' : ''} />
              </button>
            </div>
            
            {/* Player Controls */}
            <div className="flex flex-col items-center w-2/4">
              <div className="flex items-center gap-6 mb-2">
                <button className="text-gray-300 hover:text-white transition-colors">
                  <FaRandom className="w-4 h-4" />
                </button>
                <button className="text-gray-300 hover:text-white transition-colors">
                  <FaStepBackward className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-12 h-12 rounded-full bg-[#e51f48] hover:bg-[#ff4d6d] text-white flex items-center justify-center shadow-lg transition-all hover:scale-105"
                >
                  {isPlaying ? <FaPause className="w-5 h-5" /> : <FaPlay className="w-5 h-5 ml-1" />}
                </button>
                <button className="text-gray-300 hover:text-white transition-colors">
                  <FaStepForward className="w-5 h-5" />
                </button>
                <button className="text-gray-300 hover:text-white transition-colors">
                  <FaShare className="w-4 h-4" />
                </button>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full flex items-center gap-3">
                <span className="text-xs text-gray-400 w-12 text-right">0:00</span>
                <div className="flex-1 h-1.5 bg-[#0a1f29] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#e51f48] to-[#ff4d6d] rounded-full" 
                    style={{ width: '30%' }}
                  ></div>
                </div>
                <span className="text-xs text-gray-400 w-12">
                  {formatDuration(currentTrack.duration)}
                </span>
              </div>
            </div>
            
            {/* Volume Control */}
            <div className="flex items-center justify-end gap-3 w-1/4">
              <FaVolumeUp className="w-4 h-4 text-gray-300" />
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(parseInt(e.target.value))}
                className="w-24 h-1 bg-[#0a1f29] rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#e51f48]"
              />
            </div>
          </div>
        </motion.div>
      )}
    </div>
    </RoleGuard>
  );
};

export default UserDashboard;