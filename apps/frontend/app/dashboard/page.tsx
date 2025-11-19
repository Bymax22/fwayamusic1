"use client";
import { ReactNode } from "react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Image from "next/image";
import { DashboardLoading } from '@/components/DashboardLoading';
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
  const { user, loading: authLoading } = useAuth();
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
    if (!user) return;

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
      label: 'Minutes',
      value: Math.floor(libraryStats.totalMinutes).toString(),
      icon: <FaHeadphones />,
      change: '+12%',
      color: 'from-[#e51f48] to-[#ff4d6d]'
    },
    {
      label: 'Tracks',
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
      label: 'Artists',
      value: libraryStats.totalArtists.toString(),
      icon: <FaUsers />,
      change: '+3',
      color: 'from-[#e51f48] to-[#ff4d6d]'
    }
  ];

  // Enhanced stats for artists and resellers
  const businessStats: StatCard[] = user.role === 'ARTIST' ? [
    { 
      label: 'Earnings', 
      value: `$${(user.totalEarnings ?? 0).toFixed(2)}`, 
      icon: <FaDollarSign />, 
      change: '+15%',
      color: 'from-green-500 to-emerald-500'
    },
    { 
      label: 'Plays', 
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
      label: 'Rating', 
      value: '4.8', 
      icon: <FaStar />, 
      change: '+0.2',
      color: 'from-amber-500 to-orange-500'
    }
  ] : user.role === 'RESELLER' ? [
    { 
      label: 'Commission', 
      value: `$${(user.totalCommission ?? 0).toFixed(2)}`, 
      icon: <FaDollarSign />, 
      change: '+18%',
      color: 'from-green-500 to-emerald-500'
    },
    { 
      label: 'Paid', 
      value: `$${(user.paidCommission ?? 0).toFixed(2)}`, 
      icon: <FaChartLine />, 
      change: '+12%',
      color: 'from-blue-500 to-cyan-500'
    },
    { 
      label: 'Links', 
      value: '24', 
      icon: <FaShare />, 
      change: '+3',
      color: 'from-purple-500 to-pink-500'
    },
    { 
      label: 'Conversion', 
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
      case 'AUDIO': return <FaMusic className="w-3 h-3" />;
      case 'VIDEO': return <FaVideo className="w-3 h-3" />;
      case 'PODCAST': return <FaPodcast className="w-3 h-3" />;
      case 'LIVE_STREAM': return <FaBroadcastTower className="w-3 h-3" />;
      default: return <FaMusic className="w-3 h-3" />;
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
          <div className="w-12 h-12 border-3 border-[#e51f48] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-400 mobile-text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={['USER']} customLoadingComponent={<DashboardLoading/>}>
      <div className="min-h-screen bg-gradient-to-b from-[#0a1f29] to-[#0a3747] text-white pb-20">
        {/* Mobile-Optimized Header */}
        <header className="bg-[#0a3747]/80 backdrop-blur-lg border-b border-[#0a3747] sticky top-0 z-40">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {user.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt={user.displayName || user.username}
                    width={50}
                    height={50}
                    className="rounded-full border-2 border-[#e51f48]"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#e51f48] to-[#ff4d6d] flex items-center justify-center border-2 border-[#e51f48]">
                    <FaUser className="text-white text-lg" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-lg font-bold truncate mobile-text-lg">
                      {user.displayName || user.username}
                    </h1>
                    {user.role !== 'USER' && (
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold mobile-text-xs ${
                        user.role === 'ARTIST' ? 'bg-purple-500/20 text-purple-400' :
                        user.role === 'RESELLER' ? 'bg-green-500/20 text-green-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {user.role}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-300 mobile-text-xs flex items-center gap-1">
                    <FaMapPin className="w-3 h-3" />
                    {user.country || 'Global'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="bg-[#0a1f29] rounded-full p-2 border border-[#0a3747]">
                  {user.walletBalance && user.walletBalance > 0 ? (
                    <div className="flex items-center gap-1 text-sm mobile-text-sm">
                      <FaDollarSign className="text-green-400" />
                      <span className="font-semibold">${user.walletBalance.toFixed(2)}</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => router.push('/reseller-dashboard')}
                      className="px-2 py-1 bg-[#e51f48] hover:bg-[#ff4d6d] text-white rounded-full text-xs font-semibold transition-colors mobile-text-xs"
                    >
                      Reseller
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile-Optimized Navigation Tabs */}
            <nav className="flex space-x-1 bg-[#0a1f29] rounded-lg p-1 border border-[#0a3747] overflow-x-auto">
              {[
                { id: 'overview', label: 'Overview', icon: <FaChartLine className="w-3 h-3" /> },
                { id: 'library', label: 'Library', icon: <FaMusic className="w-3 h-3" /> },
                { id: 'playlists', label: 'Playlists', icon: <FaList className="w-3 h-3" /> },
                ...(user.role === 'ARTIST' ? [{ id: 'uploads', label: 'Uploads', icon: <FaUpload className="w-3 h-3" /> }] : []),
                ...(user.role === 'RESELLER' ? [{ id: 'reseller', label: 'Reseller', icon: <FaShare className="w-3 h-3" /> }] : []),
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1 px-3 py-2 rounded-md transition-all flex-shrink-0 mobile-text-xs ${
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

        <main className="p-4">
          {/* Compact Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {quickStats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-gradient-to-br ${stat.color} p-4 rounded-xl shadow-lg hover:scale-105 transition-transform cursor-pointer`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xl font-bold text-white mb-1 mobile-text-lg">{stat.value}</div>
                    <div className="text-white/90 text-xs mobile-text-xs">{stat.label}</div>
                  </div>
                  <div className="text-white/80 text-lg">
                    {stat.icon}
                  </div>
                </div>
                {stat.change && (
                  <div className="mt-2 text-white/80 text-xs flex items-center gap-1 mobile-text-xs">
                    <FaChartLine className="w-2 h-2" />
                    {stat.change}
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Business Stats for Artists/Resellers */}
          {(user.role === 'ARTIST' || user.role === 'RESELLER') && (
            <div className="mb-6">
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2 mobile-text-lg">
                <FaChartLine />
                Business
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {businessStats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={`bg-gradient-to-br ${stat.color} p-3 rounded-xl shadow-lg`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-lg font-bold text-white mobile-text-lg">{stat.value}</div>
                        <div className="text-white/80 text-xs mobile-text-xs">{stat.label}</div>
                      </div>
                      <div className="text-white/80 text-lg">
                        {stat.icon}
                      </div>
                    </div>
                    {stat.change && (
                      <div className="mt-1 text-white/80 text-xs mobile-text-xs">
                        {stat.change}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Recently Played - Mobile Optimized */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2 mobile-text-lg">
                <FaHistory />
                Recently Played
              </h2>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg ${viewMode === 'grid' ? 'bg-[#e51f48] text-white' : 'bg-[#0a3747] text-gray-400'}`}
                >
                  <FaThLarge className="w-3 h-3" />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg ${viewMode === 'list' ? 'bg-[#e51f48] text-white' : 'bg-[#0a3747] text-gray-400'}`}
                >
                  <FaList className="w-3 h-3" />
                </button>
              </div>
            </div>
            
            {viewMode === 'list' ? (
              <div className="space-y-2">
                {recentPlays.slice(0, 6).map((track, index) => (
                  <motion.div
                    key={track.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3 p-3 hover:bg-[#0a3747]/50 rounded-xl cursor-pointer group transition-all border border-transparent hover:border-[#0a4a5f] touch-target"
                    onClick={() => handlePlay(track)}
                  >
                    <div className="relative flex-shrink-0">
                      <Image
                        src={track.coverArt}
                        alt={track.title}
                        width={45}
                        height={45}
                        className="rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/default-cover.jpg';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center rounded-lg transition-all">
                        {currentTrack?.id === track.id && isPlaying ? (
                          <FaPause className="text-white opacity-0 group-hover:opacity-100 transition-opacity w-3 h-3" />
                        ) : (
                          <FaPlay className="text-white opacity-0 group-hover:opacity-100 transition-opacity w-3 h-3" />
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate mobile-text-sm flex items-center gap-1">
                        {track.title}
                        {track.isExplicit && (
                          <span className="px-1 py-0.5 bg-gray-600 text-gray-300 rounded text-xs mobile-text-xs">E</span>
                        )}
                      </h3>
                      <p className="text-gray-400 truncate mobile-text-xs">{track.artist}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5 mobile-text-xs">
                        <span>{formatDuration(track.duration)}</span>
                        <span>•</span>
                        <span>{track.views.toLocaleString()} plays</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleLike(track.id); }}
                        className="text-gray-400 hover:text-[#e51f48] transition-colors touch-target"
                      >
                        <FaHeart className={track.likes > 0 ? 'text-[#e51f48] fill-current w-4 h-4' : 'w-4 h-4'} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {recentPlays.slice(0, 4).map((track, index) => (
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
                        width={200}
                        height={200}
                        className="w-full h-32 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/default-cover.jpg';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-all">
                        {currentTrack?.id === track.id && isPlaying ? (
                          <button className="w-8 h-8 rounded-full bg-[#e51f48] flex items-center justify-center shadow-lg">
                            <FaPause className="text-white w-3 h-3" />
                          </button>
                        ) : (
                          <button className="w-8 h-8 rounded-full bg-[#e51f48] flex items-center justify-center shadow-lg">
                            <FaPlay className="text-white w-3 h-3 ml-0.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-3">
                      <h3 className="font-semibold truncate mobile-text-sm mb-1">{track.title}</h3>
                      <p className="text-gray-400 truncate mobile-text-xs mb-2">{track.artist}</p>
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          {getTypeIcon(track.type || 'AUDIO')}
                        </div>
                        <div className="flex items-center gap-2">
                          <span>{formatDuration(track.duration)}</span>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleLike(track.id); }}
                            className="text-gray-400 hover:text-[#e51f48] transition-colors"
                          >
                            <FaHeart className={track.likes > 0 ? 'text-[#e51f48] fill-current w-3 h-3' : 'w-3 h-3'} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Recommendations & Quick Actions Side by Side on Mobile */}
          <div className="grid grid-cols-1 gap-6">
            {/* Recommendations */}
            <section className="bg-[#0a3747]/50 rounded-xl p-4 border border-[#0a4a5f]">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold flex items-center gap-2 mobile-text-base">
                  <FaStar className="text-amber-400" />
                  For You
                </h2>
                <button className="text-[#e51f48] hover:underline text-xs mobile-text-xs">
                  More
                </button>
              </div>
              
              <div className="space-y-2">
                {recommendations.slice(0, 3).map((track, index) => (
                  <motion.div
                    key={track.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3 p-2 hover:bg-[#0a3747] rounded-lg cursor-pointer group transition-colors touch-target"
                    onClick={() => handlePlay(track)}
                  >
                    <div className="relative flex-shrink-0">
                      <Image
                        src={track.coverArt}
                        alt={track.title}
                        width={35}
                        height={35}
                        className="rounded"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/default-cover.jpg';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center rounded transition-all">
                        <FaPlay className="text-white opacity-0 group-hover:opacity-100 transition-opacity w-2 h-2" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate mobile-text-sm">{track.title}</h3>
                      <p className="text-xs text-gray-400 truncate mobile-text-xs">{track.artist}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Quick Actions */}
            <section className="bg-[#0a3747]/50 rounded-xl p-4 border border-[#0a4a5f]">
              <h2 className="font-bold mb-3 mobile-text-base">Quick Actions</h2>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Browse', icon: <FaSearch />, href: '/browse', color: 'bg-blue-500/20 text-blue-400' },
                  { label: 'Library', icon: <FaMusic />, href: '/library', color: 'bg-green-500/20 text-green-400' },
                  { label: 'Playlist', icon: <FaPlus />, href: '/playlists/new', color: 'bg-purple-500/20 text-purple-400' },
                  { label: 'Liked', icon: <FaHeart />, href: '/library/liked', color: 'bg-pink-500/20 text-pink-400' },
                  ...(user.role === 'ARTIST' ? [
                    { label: 'Upload', icon: <FaUpload />, href: '/upload', color: 'bg-amber-500/20 text-amber-400' },
                  ] : []),
                  { label: 'Settings', icon: <FaCog />, href: '/settings', color: 'bg-gray-500/20 text-gray-400' },
                ].slice(0, 6).map((action, index) => (
                  <motion.a
                    key={action.label}
                    href={action.href}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={`${action.color} p-2 rounded-lg text-center hover:scale-105 transition-transform border border-transparent hover:border-current/20 touch-target`}
                  >
                    <div className="text-sm mb-1 flex justify-center">
                      {action.icon}
                    </div>
                    <div className="text-xs font-medium mobile-text-xs">{action.label}</div>
                  </motion.a>
                ))}
              </div>
            </section>
          </div>

          {/* Recent Playlists */}
          {userPlaylists.length > 0 && (
            <section className="mt-6 bg-[#0a3747]/50 rounded-xl p-4 border border-[#0a4a5f]">
              <h2 className="font-bold mb-3 mobile-text-base">Your Playlists</h2>
              <div className="grid grid-cols-2 gap-3">
                {userPlaylists.slice(0, 4).map((playlist, index) => (
                  <motion.div
                    key={playlist.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-2 p-2 hover:bg-[#0a3747] rounded-lg cursor-pointer transition-colors touch-target"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <FaMusic className="text-white text-sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate mobile-text-sm">{playlist.name}</h3>
                      <p className="text-xs text-gray-400 mobile-text-xs">{playlist.mediaCount} tracks</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* User Uploads Section for Artists */}
          {user.role === 'ARTIST' && userMedia.length > 0 && (
            <section className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold flex items-center gap-2 mobile-text-base">
                  <FaMicrophone />
                  Your Uploads
                </h2>
                <a href="/upload" className="text-[#e51f48] hover:underline text-xs flex items-center gap-1 mobile-text-xs">
                  <FaPlus className="w-2 h-2" />
                  New
                </a>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {userMedia.slice(0, 2).map((media, index) => (
                  <motion.div
                    key={media.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-[#0a3747]/50 rounded-xl p-3 hover:bg-[#0a3747]/70 transition-colors border border-[#0a4a5f]"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Image
                        src={media.coverArt}
                        alt={media.title}
                        width={40}
                        height={40}
                        className="rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/default-cover.jpg';
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate mobile-text-sm">{media.title}</h3>
                        <p className="text-xs text-gray-400 mobile-text-xs">{media.views.toLocaleString()} plays</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-400 mobile-text-xs">
                      <span>${((media.views * 0.001) * (media.artistCommissionRate || 0.5)).toFixed(2)}</span>
                      <span>{formatDuration(media.duration)}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}
        </main>

        {/* Enhanced Mini Player */}
        {currentTrack && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed bottom-16 left-0 right-0 bg-[#0a3747]/95 backdrop-blur-lg border-t border-[#0a4a5f] p-3 shadow-2xl mx-4 rounded-t-xl"
          >
            <div className="flex items-center justify-between">
              {/* Track Info */}
              <div className="flex items-center gap-3 w-2/5">
                <Image
                  src={currentTrack.coverArt}
                  alt={currentTrack.title}
                  width={40}
                  height={40}
                  className="rounded-lg shadow-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/default-cover.jpg';
                  }}
                />
                <div className="min-w-0">
                  <p className="font-semibold text-white truncate mobile-text-sm">{currentTrack.title}</p>
                  <p className="text-xs text-gray-300 truncate mobile-text-xs">{currentTrack.artist}</p>
                </div>
              </div>
              
              {/* Player Controls */}
              <div className="flex items-center gap-3 w-3/5 justify-end">
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-10 h-10 rounded-full bg-[#e51f48] hover:bg-[#ff4d6d] text-white flex items-center justify-center shadow-lg transition-all hover:scale-105 touch-target"
                >
                  {isPlaying ? <FaPause className="w-4 h-4" /> : <FaPlay className="w-4 h-4 ml-0.5" />}
                </button>
                
                <button className="text-gray-300 hover:text-white transition-colors touch-target">
                  <FaStepForward className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full flex items-center gap-2 mt-2">
              <span className="text-xs text-gray-400 w-8 text-right mobile-text-xs">0:00</span>
              <div className="flex-1 h-1 bg-[#0a1f29] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#e51f48] to-[#ff4d6d] rounded-full" 
                  style={{ width: '30%' }}
                ></div>
              </div>
              <span className="text-xs text-gray-400 w-8 mobile-text-xs">
                {formatDuration(currentTrack.duration)}
              </span>
            </div>
          </motion.div>
        )}
      </div>
    </RoleGuard>
  );
};

export default UserDashboard;