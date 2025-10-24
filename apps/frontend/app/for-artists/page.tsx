"use client";
import Image from "next/image";
import { useState, useEffect } from 'react';
import { 
  Music, BarChart2, Users, Download, Settings, 
  PlusCircle, Edit3, Trash2, DollarSign, 
  MessageSquare, Video, Podcast, Mic,
  Headphones, Upload, Share2, Link,
  TrendingUp, UserCheck, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import RoleGuard from '@/components/RoleGuard';



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
  description: string;
  type: 'AUDIO' | 'VIDEO' | 'PODCAST' | 'LIVE_STREAM';
  accessType: 'FREE' | 'PREMIUM' | 'PAY_PER_VIEW';
  price: number;
  isExplicit: boolean;
  genre: string;
  tags: string[];
  allowReselling: boolean;
  artistCommissionRate: number;
  file: File | null;
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
  const [newMedia, setNewMedia] = useState<NewMedia>({
    title: '',
    description: '',
    type: 'AUDIO',
    accessType: 'FREE',
    price: 0,
    isExplicit: false,
    genre: '',
    tags: [],
    allowReselling: true,
    artistCommissionRate: 0.5, // Default 50%
    file: null
  });


  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      const [
        statsRes,
        mediaRes,
        analyticsRes,
        followersRes,
        commissionsRes
      ] = await Promise.all([
        fetch('/api/artist/stats'),
        fetch('/api/artist/media'),
        fetch('/api/artist/analytics'),
        fetch('/api/artist/followers'),
        fetch('/api/artist/commissions')
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

    try {
      const formData = new FormData();
      formData.append('file', newMedia.file);
      formData.append('title', newMedia.title);
      formData.append('description', newMedia.description);
      formData.append('type', newMedia.type);
      formData.append('accessType', newMedia.accessType);
      formData.append('price', newMedia.price.toString());
      formData.append('isExplicit', newMedia.isExplicit.toString());
      formData.append('genre', newMedia.genre);
      formData.append('tags', JSON.stringify(newMedia.tags));
      formData.append('allowReselling', newMedia.allowReselling.toString());
      formData.append('artistCommissionRate', newMedia.artistCommissionRate.toString());

      const response = await fetch('/api/artist/media', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const uploadedMedia = await response.json();
        setMedia(prev => [uploadedMedia, ...prev]);
        setShowUploadModal(false);
        setNewMedia({
          title: '',
          description: '',
          type: 'AUDIO',
          accessType: 'FREE',
          price: 0,
          isExplicit: false,
          genre: '',
          tags: [],
          allowReselling: true,
          artistCommissionRate: 0.5,
          file: null
        });
        alert('Media uploaded successfully!');
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading media:', error);
      alert('Upload failed. Please try again.');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewMedia(prev => ({ ...prev, file }));
    }
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
      const response = await fetch(`/api/artist/media/${mediaId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
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
      const response = await fetch(`/api/artist/media/${mediaId}`, {
        method: 'DELETE',
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
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#e51f48]"></div>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-[#0a3747]/70 p-6 rounded-xl">
              <h3 className="text-gray-400 flex items-center gap-2">
                <BarChart2 className="w-5 h-5" />
                Total Plays
              </h3>
              <p className="text-3xl font-bold text-white mt-2">{stats?.totalPlays.toLocaleString()}</p>
              <p className="text-sm text-gray-400 mt-1">
                <span className="text-green-500">+{stats?.monthlyPlays}</span> this month
              </p>
            </div>
            
            <div className="bg-[#0a3747]/70 p-6 rounded-xl">
              <h3 className="text-gray-400 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Followers
              </h3>
              <p className="text-3xl font-bold text-white mt-2">{stats?.followerCount.toLocaleString()}</p>
              <p className="text-sm text-gray-400 mt-1">
                <span className="text-green-500">↑ 8%</span> from last month
              </p>
            </div>
            
            <div className="bg-[#0a3747]/70 p-6 rounded-xl">
              <h3 className="text-gray-400 flex items-center gap-2">
                <Download className="w-5 h-5" />
                Downloads
              </h3>
              <p className="text-3xl font-bold text-white mt-2">{stats?.totalDownloads.toLocaleString()}</p>
              <p className="text-sm text-gray-400 mt-1">
                <span className="text-green-500">↑ 15%</span> from last month
              </p>
            </div>
            
            <div className="bg-[#0a3747]/70 p-6 rounded-xl">
              <h3 className="text-gray-400 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Total Revenue
              </h3>
              <p className="text-3xl font-bold text-white mt-2">${stats?.totalRevenue.toFixed(2)}</p>
              <p className="text-sm text-gray-400 mt-1">
                <span className="text-green-500">${stats?.monthlyRevenue.toFixed(2)}</span> this month
              </p>
            </div>

            <div className="bg-[#0a3747]/70 p-6 rounded-xl">
              <h3 className="text-gray-400 flex items-center gap-2">
                <Music className="w-5 h-5" />
                Active Tracks
              </h3>
              <p className="text-3xl font-bold text-white mt-2">{stats?.activeTracks}</p>
              <p className="text-sm text-gray-400 mt-1">
                {stats?.conversionRate}% conversion rate
              </p>
            </div>

            <div className="bg-[#0a3747]/70 p-6 rounded-xl">
              <h3 className="text-gray-400 flex items-center gap-2">
                <Share2 className="w-5 h-5" />
                Reseller Sales
              </h3>
              <p className="text-3xl font-bold text-white mt-2">
                {commissions.filter(c => c.status === 'PAID').length}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Through reseller program
              </p>
            </div>
            
            <div className="md:col-span-2 lg:col-span-3 bg-[#0a3747]/70 p-6 rounded-xl">
              <h3 className="text-gray-400 mb-4">Plays Over Time</h3>
              <div className="h-64 bg-[#0a1f29] rounded-lg p-4">
                <div className="flex items-end h-full gap-1">
                  {analytics?.playsByDay.map((count, i) => (
                    <div 
                      key={i}
                      className="flex-1 bg-gradient-to-t from-[#e51f48] to-[#ff4d6d] rounded-t-sm"
                      style={{ height: `${Math.min(100, (count / Math.max(...analytics.playsByDay)) * 100)}%` }}
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
                className="flex items-center gap-2 px-4 py-2 bg-[#e51f48] hover:bg-[#ff4d6d] text-white rounded-lg transition-colors"
              >
                <PlusCircle className="w-5 h-5" />
                Upload New
              </button>
            </div>
            
            <div className="bg-[#0a3747]/70 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#0a3747] text-gray-400 text-left">
                    <th className="p-4">Title</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Access</th>
                    <th className="p-4">
                      <div className="flex items-center gap-1">
                        <Headphones className="w-4 h-4" />
                        Plays
                      </div>
                    </th>
                    <th className="p-4">
                      <div className="flex items-center gap-1">
                        <Download className="w-4 h-4" />
                        Downloads
                      </div>
                    </th>
                    <th className="p-4">Reselling</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {media.map(item => (
                    <tr key={item.id} className="border-b border-[#0a3747] hover:bg-[#0a3747]/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {item.artCoverUrl && (
                            <Image
                              src={item.artCoverUrl}
                              alt={item.title}
                              width={40}
                              height={40}
                              className="rounded-lg object-cover"
                            />
                          )}
                          <div>
                            <p className="font-medium text-white">{item.title}</p>
                            <p className="text-sm text-gray-400">{item.genre}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                          item.type === 'AUDIO' ? 'bg-blue-600/30 text-blue-400' :
                          item.type === 'VIDEO' ? 'bg-purple-600/30 text-purple-400' :
                          item.type === 'PODCAST' ? 'bg-amber-600/30 text-amber-400' :
                          'bg-green-600/30 text-green-400'
                        }`}>
                          {item.type === 'AUDIO' ? <Music className="w-3 h-3" /> :
                           item.type === 'VIDEO' ? <Video className="w-3 h-3" /> :
                           item.type === 'PODCAST' ? <Podcast className="w-3 h-3" /> :
                           <Mic className="w-3 h-3" />}
                          {item.type}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                          item.accessType === 'PREMIUM' ? 'bg-amber-600/30 text-amber-400' :
                          item.accessType === 'PAY_PER_VIEW' ? 'bg-green-600/30 text-green-400' :
                          'bg-gray-600/30 text-gray-400'
                        }`}>
                          {item.accessType === 'PREMIUM' && <DollarSign className="w-3 h-3" />}
                          {item.accessType}
                        </span>
                        {item.price && item.accessType !== 'FREE' && (
                          <p className="text-xs text-gray-400 mt-1">${item.price}</p>
                        )}
                      </td>
                      <td className="p-4 text-gray-300">{item.playCount.toLocaleString()}</td>
                      <td className="p-4 text-gray-300">{item.downloadCount.toLocaleString()}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                          item.allowReselling ? 'bg-green-600/30 text-green-400' : 'bg-gray-600/30 text-gray-400'
                        }`}>
                          {item.allowReselling ? 'Allowed' : 'Disabled'}
                        </span>
                        {item.allowReselling && (
                          <button
                            onClick={() => generateResellerLink(item.id)}
                            className="text-xs text-[#e51f48] hover:text-[#ff4d6d] mt-1 flex items-center gap-1"
                          >
                            <Link className="w-3 h-3" />
                            Generate Link
                          </button>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => updateMediaSettings(item.id, { allowReselling: !item.allowReselling })}
                            className="text-gray-400 hover:text-[#e51f48] transition-colors"
                            title={item.allowReselling ? 'Disable reselling' : 'Allow reselling'}
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button className="text-gray-400 hover:text-[#e51f48] transition-colors">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => deleteMedia(item.id)}
                            className="text-gray-400 hover:text-[#e51f48] transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button className="text-gray-400 hover:text-[#e51f48] transition-colors">
                            <BarChart2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      
      case 'analytics':
        return (
          <div className="space-y-8">
            <div className="bg-[#0a3747]/70 p-6 rounded-xl">
              <h3 className="text-xl font-bold text-white mb-4">Top Tracks</h3>
              <div className="bg-[#0a1f29] rounded-lg p-4">
                <table className="w-full">
                  <thead>
                    <tr className="text-gray-400 text-left border-b border-[#0a3747]">
                      <th className="p-3">Track</th>
                      <th className="p-3">Plays</th>
                      <th className="p-3">Revenue</th>
                      <th className="p-3">Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics?.topTracks.map((track) => (
                      <tr key={track.id} className="border-b border-[#0a3747] hover:bg-[#0a3747]/50 transition-colors">
                        <td className="p-3 text-white">{track.title}</td>
                        <td className="p-3 text-gray-300">{track.plays.toLocaleString()}</td>
                        <td className="p-3 text-green-400">${track.revenue.toFixed(2)}</td>
                        <td className="p-3">
                          <div className="w-32 bg-[#0a3747] rounded-full h-2 overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-[#e51f48] to-[#ff4d6d] rounded-full"
                              style={{ width: `${(track.plays / Math.max(...analytics.topTracks.map(t => t.plays))) * 100}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="bg-[#0a3747]/70 p-6 rounded-xl">
              <h3 className="text-xl font-bold text-white mb-4">Top Countries</h3>
              <div className="bg-[#0a1f29] rounded-lg p-4">
                <table className="w-full">
                  <thead>
                    <tr className="text-gray-400 text-left border-b border-[#0a3747]">
                      <th className="p-3">Country</th>
                      <th className="p-3">Plays</th>
                      <th className="p-3">% of Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics?.topCountries.map((country, i) => (
                      <tr key={i} className="border-b border-[#0a3747] hover:bg-[#0a3747]/50 transition-colors">
                        <td className="p-3 text-white">{country.country}</td>
                        <td className="p-3 text-gray-300">{country.plays.toLocaleString()}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-32 bg-[#0a3747] rounded-full h-2 overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-[#e51f48] to-[#ff4d6d] rounded-full"
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
            
            <div className="bg-[#0a3747]/70 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#0a3747] text-gray-400 text-left">
                    <th className="p-4">Follower</th>
                    <th className="p-4">Followed Since</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {followers.map(follower => (
                    <tr key={follower.id} className="border-b border-[#0a3747] hover:bg-[#0a3747]/50 transition-colors">
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
                        <button className="text-gray-400 hover:text-[#e51f48] transition-colors">
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
            <div className="bg-[#0a3747]/70 p-6 rounded-xl">
              <h3 className="text-xl font-bold text-white mb-4">Earnings Overview</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-[#0a1f29] p-4 rounded-lg">
                  <h4 className="text-gray-400">Total Earnings</h4>
                  <p className="text-2xl font-bold text-white mt-2">${stats?.totalRevenue.toFixed(2)}</p>
                </div>
                
                <div className="bg-[#0a1f29] p-4 rounded-lg">
                  <h4 className="text-gray-400">This Month</h4>
                  <p className="text-2xl font-bold text-white mt-2">${stats?.monthlyRevenue.toFixed(2)}</p>
                </div>
                
                <div className="bg-[#0a1f29] p-4 rounded-lg">
                  <h4 className="text-gray-400">Reseller Commissions</h4>
                  <p className="text-2xl font-bold text-white mt-2">
                    ${commissions.reduce((sum, c) => sum + (c.status === 'PAID' ? c.amount : 0), 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-[#0a3747]/70 p-6 rounded-xl">
              <h3 className="text-xl font-bold text-white mb-4">Commission History</h3>
              <div className="bg-[#0a1f29] rounded-lg p-4">
                <table className="w-full">
                  <thead>
                    <tr className="text-gray-400 text-left border-b border-[#0a3747]">
                      <th className="p-3">Track</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissions.map(commission => (
                      <tr key={commission.id} className="border-b border-[#0a3747] hover:bg-[#0a3747]/50 transition-colors">
                        <td className="p-3 text-white">{commission.media.title}</td>
                        <td className="p-3 text-green-400">
                          {commission.currency} {commission.amount.toFixed(2)}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            commission.status === 'PAID' ? 'bg-green-600/30 text-green-400' :
                            commission.status === 'PENDING' ? 'bg-yellow-600/30 text-yellow-400' :
                            'bg-red-600/30 text-red-400'
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
            <div className="bg-[#0a3747]/70 p-6 rounded-xl">
              <h3 className="text-xl font-bold text-white mb-4">Reseller Program</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#0a1f29] p-6 rounded-lg">
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
                
                <div className="bg-[#0a1f29] p-6 rounded-lg">
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
                        ${commissions.reduce((sum, c) => sum + (c.status === 'PAID' ? c.amount : 0), 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#0a3747]/70 p-6 rounded-xl">
              <h3 className="text-xl font-bold text-white mb-4">Reseller Settings</h3>
              <div className="space-y-4">
                {media.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-[#0a1f29] rounded-lg">
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
                        className={`px-4 py-2 rounded-lg text-sm ${
                          item.allowReselling 
                            ? 'bg-red-600/30 text-red-400 hover:bg-red-600/40' 
                            : 'bg-green-600/30 text-green-400 hover:bg-green-600/40'
                        }`}
                      >
                        {item.allowReselling ? 'Disable' : 'Enable'}
                      </button>
                      {item.allowReselling && (
                        <button
                          onClick={() => generateResellerLink(item.id)}
                          className="px-4 py-2 bg-[#e51f48] text-white rounded-lg hover:bg-[#ff4d6d] text-sm"
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
      requireKYC={true}
      requireEmailVerification={true}>
          <div className="bg-gradient-to-br from-[#0a3747]/95 to-[#0a1f29]/95 min-h-screen">
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
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#0a3747] rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-xl font-bold text-white mb-4">Upload New Media</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-400 mb-1">Title *</label>
                    <input
                      type="text"
                      className="w-full bg-[#0a1f29] border border-[#0a3747] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#e51f48]"
                      value={newMedia.title}
                      onChange={(e) => setNewMedia({...newMedia, title: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-400 mb-1">Description</label>
                    <textarea
                      className="w-full bg-[#0a1f29] border border-[#0a3747] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#e51f48] h-24"
                      value={newMedia.description}
                      onChange={(e) => setNewMedia({...newMedia, description: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-400 mb-1">Type *</label>
                    <select
                      className="w-full bg-[#0a1f29] border border-[#0a3747] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#e51f48]"
                      value={newMedia.type}
                      onChange={(e) => setNewMedia({
                        ...newMedia, 
                        type: e.target.value as 'AUDIO' | 'VIDEO' | 'PODCAST' | 'LIVE_STREAM'
                      })}
                    >
                      <option value="AUDIO">Audio Track</option>
                      <option value="VIDEO">Video</option>
                      <option value="PODCAST">Podcast</option>
                      <option value="LIVE_STREAM">Live Stream</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-gray-400 mb-1">Access Type *</label>
                    <select
                      className="w-full bg-[#0a1f29] border border-[#0a3747] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#e51f48]"
                      value={newMedia.accessType}
                      onChange={(e) => setNewMedia({
                        ...newMedia, 
                        accessType: e.target.value as 'FREE' | 'PREMIUM' | 'PAY_PER_VIEW'
                      })}
                    >
                      <option value="FREE">Free</option>
                      <option value="PREMIUM">Premium</option>
                      <option value="PAY_PER_VIEW">Pay Per View</option>
                    </select>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {(newMedia.accessType === 'PREMIUM' || newMedia.accessType === 'PAY_PER_VIEW') && (
                    <div>
                      <label className="block text-gray-400 mb-1">Price ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="w-full bg-[#0a1f29] border border-[#0a3747] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#e51f48]"
                        value={newMedia.price}
                        onChange={(e) => setNewMedia({...newMedia, price: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-gray-400 mb-1">Genre</label>
                    <input
                      type="text"
                      className="w-full bg-[#0a1f29] border border-[#0a3747] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#e51f48]"
                      value={newMedia.genre}
                      onChange={(e) => setNewMedia({...newMedia, genre: e.target.value})}
                    />
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-gray-400">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-[#e51f48] rounded focus:ring-[#e51f48]"
                        checked={newMedia.isExplicit}
                        onChange={(e) => setNewMedia({...newMedia, isExplicit: e.target.checked})}
                      />
                      Explicit Content
                    </label>
                    
                    <label className="flex items-center gap-2 text-gray-400">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-[#e51f48] rounded focus:ring-[#e51f48]"
                        checked={newMedia.allowReselling}
                        onChange={(e) => setNewMedia({...newMedia, allowReselling: e.target.checked})}
                      />
                      Allow Reselling
                    </label>
                  </div>
                  
                  <div>
                    <label className="block text-gray-400 mb-1">File *</label>
                    <div className="border border-dashed border-[#0a3747] rounded-lg p-6 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-gray-400">
                        <Upload className="w-8 h-8" />
                        <input
                          type="file"
                          className="hidden"
                          id="file-upload"
                          onChange={handleFileSelect}
                          accept="audio/*,video/*"
                        />
                        <label htmlFor="file-upload" className="cursor-pointer">
                          <p>Click to select file</p>
                          <p className="text-sm">Supports MP3, WAV, FLAC, MP4, MOV</p>
                        </label>
                        {newMedia.file && (
                          <p className="text-green-400 text-sm">
                            Selected: {newMedia.file.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 bg-[#0a1f29] text-gray-300 rounded-lg hover:bg-[#0a3747] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!newMedia.title || !newMedia.file}
                  className="px-4 py-2 bg-[#e51f48] disabled:bg-gray-600 text-white rounded-lg hover:bg-[#ff4d6d] transition-colors"
                >
                  Upload
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Music className="w-8 h-8 text-[#e51f48]" />
              Artist Dashboard
            </h1>
            <p className="text-gray-400">Manage your music, view analytics, and connect with fans</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-[#0a3747] text-gray-300 rounded-lg hover:bg-[#0a3747]/80 transition-colors flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Settings
            </button>
            <button 
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2 bg-[#e51f48] text-white rounded-lg hover:bg-[#ff4d6d] transition-colors flex items-center gap-2"
            >
              <PlusCircle className="w-5 h-5" />
              Upload
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto border-b border-[#0a3747] mb-6">
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
                  ? 'text-[#e51f48] border-b-2 border-[#e51f48]' 
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
      </div>
    </div>
    </RoleGuard>
  );
}