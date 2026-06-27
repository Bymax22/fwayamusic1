// app/producer/page.tsx
"use client";
import Image from "next/image";
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Music2, BarChart2, Users, Download, Settings, 
  PlusCircle, Edit3, Trash2, DollarSign, 
  MessageSquare, Upload, Share2, Link, X,
  TrendingUp, UserCheck, Shield, Play, Pause,
  Zap, Package, Headphones, Gauge, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { parseAuthError } from '@/lib/auth-error-utils';
import RoleGuard from '@/components/RoleGuard';
import { DashboardCard } from '@/components/DashboardCard';
import DashboardHeader from '@/components/DashboardHeader';
import MobilePlayer from '@/components/MobilePlayer';

// Types for Producer Dashboard
interface Beat {
  id: number;
  url: string;
  artCoverUrl: string | null;
  thumbnailUrl: string | null;
  title: string;
  description: string | null;
  bpm: number | null;
  key: string | null;
  genre: string;
  price: number | null;
  accessType: 'FREE' | 'PREMIUM' | 'PAY_PER_VIEW';
  playCount: number;
  downloadCount: number;
  saleCount: number;
  duration: number;
  tags: string[];
  createdAt: string;
  allowReselling: boolean;
  artistCommissionRate: number;
}

interface ProducerStats {
  totalBeats: number;
  totalPlays: number;
  monthlyPlays: number;
  totalDownloads: number;
  monthlyDownloads: number;
  totalSales: number;
  monthlySales: number;
  totalRevenue: number;
  monthlyRevenue: number;
  followerCount: number;
}

interface BeatPack {
  id: number;
  title: string;
  description: string;
  beatCount: number;
  price: number;
  downloads: number;
  sales: number;
  createdAt: string;
}

interface SoundResource {
  id: number;
  title: string;
  type: 'SAMPLE_PACK' | 'SOUND_KIT' | 'PRESET' | 'TUTORIAL';
  description: string;
  price: number;
  downloads: number;
}

export default function ProducerPage() {
  const { user, getToken, setAuthError } = useAuth();
  const router = useRouter();
  const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '') || '';

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const token = await getToken();
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  };

  const [activeTab, setActiveTab] = useState<'dashboard' | 'beats' | 'packs' | 'analytics' | 'resources'>('dashboard');
  const [stats, setStats] = useState<ProducerStats | null>(null);
  const [beats, setBeats] = useState<Beat[]>([]);
  const [beatPacks, setBeatPacks] = useState<BeatPack[]>([]);
  const [soundResources, setSoundResources] = useState<SoundResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [newBeat, setNewBeat] = useState({
    title: '',
    description: '',
    genre: '',
    bpm: '',
    key: '',
    price: '',
    accessType: 'FREE' as 'FREE' | 'PREMIUM' | 'PAY_PER_VIEW',
    file: null as File | null,
    coverFile: null as File | null,
    coverPreview: null as string | null,
  });
  const [currentTrack, setCurrentTrack] = useState<Beat | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [editingBeat, setEditingBeat] = useState<Beat | null>(null);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

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
    const fetchData = async () => {
      if (!user?.id) return;
      try {
        setIsLoading(true);
        const headers = await getAuthHeaders();

        // Producer stats and content should use the authenticated producer APIs
        const statsResponse = await fetch(`${backendUrl || ''}/api/v1/beats/producer/${user.id}/stats`, {
          headers,
        });
        if (statsResponse.ok) {
          setStats(await statsResponse.json());
        }

        const beatsResponse = await fetch(`${backendUrl || ''}/api/v1/beats/producer/${user.id}/beats`, {
          headers,
        });
        if (beatsResponse.ok) {
          setBeats(await beatsResponse.json());
        }

        // Beat packs and resources are not available yet, leave as empty arrays for now
        setBeatPacks([]);
        setSoundResources([]);
      } catch (error) {
        console.error('Error fetching producer data:', error);
        const errorMsg = error instanceof Error ? error.message : 'Failed to load dashboard data';
        setAuthError({ message: `Dashboard error: ${errorMsg}` });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setNewBeat({ ...newBeat, coverPreview: reader.result as string });
    };
    reader.readAsDataURL(file);
    setNewBeat({ ...newBeat, coverFile: file });
  };

  const handleBeatFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      alert('Please select an audio file');
      return;
    }

    setNewBeat({ ...newBeat, file });
  };

  const handleUploadBeat = async () => {
    if (!newBeat.title || !newBeat.file || !newBeat.genre) {
      alert('Please fill in all required fields');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('title', newBeat.title);
      formData.append('description', newBeat.description);
      formData.append('genre', newBeat.genre);
      formData.append('bpm', newBeat.bpm);
      formData.append('key', newBeat.key);
      if (newBeat.price) {
        formData.append('price', newBeat.price);
      }
      formData.append('accessType', newBeat.accessType);
      formData.append('file', newBeat.file);
      if (newBeat.coverFile) {
        formData.append('coverFile', newBeat.coverFile);
      }

      const headers = await getAuthHeaders();
      const response = await fetch(`${backendUrl || ''}/api/v1/beats`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Upload failed');
      }

      const uploadedBeat = await response.json();
      setBeats([uploadedBeat, ...beats]);
      setShowUploadModal(false);
      setNewBeat({
        title: '',
        description: '',
        genre: '',
        bpm: '',
        key: '',
        price: '',
        accessType: 'FREE',
        file: null,
        coverFile: null,
        coverPreview: null,
      });
      setUploadProgress(100);
      alert('Beat uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to upload beat';
      setAuthError({ message: `Beat upload failed: ${errorMsg}` });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteBeat = async (beatId: number) => {
    if (window.confirm('Are you sure you want to delete this beat?')) {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${backendUrl || ''}/api/v1/beats/${beatId}`, {
          method: 'DELETE',
          headers,
        });

        if (response.ok) {
          setBeats(beats.filter(b => b.id !== beatId));
          alert('Beat deleted successfully');
          return;
        }

        const errorText = await response.text();
        throw new Error(errorText || 'Delete failed');
      } catch (error) {
        console.error('Delete error:', error);
        const errorMsg = error instanceof Error ? error.message : 'Failed to delete beat';
        setAuthError({ message: `Beat deletion failed: ${errorMsg}` });
      }
    }
  };

  const handlePlayBeat = (beat: Beat) => {
    if (currentTrack?.id === beat.id) {
      setIsPlaying(!isPlaying);
      if (audioRef.current) {
        isPlaying ? audioRef.current.pause() : audioRef.current.play();
      }
      return;
    }

    setCurrentTrack(beat);
    setIsPlaying(true);
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.src = beat.url;
        audioRef.current.play();
      }
    }, 100);
  };

  const handleShareBeat = (beat: Beat) => {
    const shareUrl = `${window.location.origin}/beats/${beat.id}`;
    setShareLink(shareUrl);
    navigator.clipboard.writeText(shareUrl);
    alert('Share link copied to clipboard!');
  };

  const handleComingSoon = (feature: string) => {
    alert(`${feature} is coming soon. Stay tuned!`);
  };

  return (
    <RoleGuard allowedRoles={["PRODUCER"]}>
      <div className="min-h-screen bg-black text-white">
        <div className="relative overflow-hidden">
          <DashboardHeader />
          <div className="relative p-6 max-w-7xl mx-auto pb-40 lg:pb-16">
            {/* Header */}
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between mb-10">
              <div className="space-y-3">
                <p className="inline-flex items-center gap-2 rounded-full bg-purple-500/20 px-4 py-1 text-xs uppercase tracking-[0.24em] text-purple-300">
                  Producer Dashboard
                </p>
                <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
                  Create, Share & Sell Your Beats
                </h1>
                <p className="max-w-2xl text-gray-400">
                  Manage your beat library, track sales, and grow your fanbase
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => router.push('/settings')}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800"
                >
                  <Settings className="w-5 h-5" />
                  Settings
                </button>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition hover:bg-purple-500"
                >
                  <PlusCircle className="w-5 h-5" />
                  Upload Beat
                </button>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-3 mb-10">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: <Gauge className="w-4 h-4" /> },
                { id: 'beats', label: 'My Beats', icon: <Music2 className="w-4 h-4" /> },
                { id: 'packs', label: 'Beat Packs', icon: <Package className="w-4 h-4" /> },
                { id: 'analytics', label: 'Analytics', icon: <BarChart2 className="w-4 h-4" /> },
                { id: 'resources', label: 'Resources', icon: <Zap className="w-4 h-4" /> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                    activeTab === tab.id
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/15'
                      : 'bg-white/10 text-gray-300 hover:bg-white/15'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <div className="grid gap-6">
                {/* Stats Grid */}
                {stats && (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-2xl bg-gradient-to-br from-purple-600/20 to-purple-900/20 border border-purple-500/30 p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-400 mb-1">Total Beats</p>
                          <p className="text-3xl font-bold text-white">{stats.totalBeats}</p>
                        </div>
                        <Music2 className="w-10 h-10 text-purple-500/30" />
                      </div>
                    </div>

                    <div className="rounded-2xl bg-gradient-to-br from-blue-600/20 to-blue-900/20 border border-blue-500/30 p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-400 mb-1">Total Plays</p>
                          <p className="text-3xl font-bold text-white">{stats.totalPlays.toLocaleString()}</p>
                          <p className="text-xs text-gray-500 mt-1">{stats.monthlyPlays} this month</p>
                        </div>
                        <Eye className="w-10 h-10 text-blue-500/30" />
                      </div>
                    </div>

                    <div className="rounded-2xl bg-gradient-to-br from-green-600/20 to-green-900/20 border border-green-500/30 p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-400 mb-1">Total Downloads</p>
                          <p className="text-3xl font-bold text-white">{stats.totalDownloads.toLocaleString()}</p>
                          <p className="text-xs text-gray-500 mt-1">{stats.monthlyDownloads} this month</p>
                        </div>
                        <Download className="w-10 h-10 text-green-500/30" />
                      </div>
                    </div>

                    <div className="rounded-2xl bg-gradient-to-br from-yellow-600/20 to-yellow-900/20 border border-yellow-500/30 p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-400 mb-1">Total Revenue</p>
                          <p className="text-3xl font-bold text-white">{formatZMW(stats.totalRevenue)}</p>
                          <p className="text-xs text-gray-500 mt-1">{formatZMW(stats.monthlyRevenue)} this month</p>
                        </div>
                        <DollarSign className="w-10 h-10 text-yellow-500/30" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Recent Beats */}
                <div className="rounded-2xl bg-black border border-white/10 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Recent Beats</h3>
                  <div className="grid gap-4">
                    {beats.slice(0, 5).map(beat => (
                      <div key={beat.id} className="flex items-center gap-4 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition">
                        {beat.artCoverUrl && (
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                            <Image src={beat.artCoverUrl} alt={beat.title} fill className="object-cover" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-medium truncate">{beat.title}</h4>
                          <p className="text-sm text-gray-400">{beat.genre} • {beat.bpm} BPM</p>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span>{beat.playCount} plays</span>
                          <span>{beat.downloadCount} downloads</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* My Beats Tab */}
            {activeTab === 'beats' && (
              <div className="grid gap-6">
                {beats.length === 0 ? (
                  <div className="rounded-2xl bg-black border border-white/10 p-12 text-center">
                    <Music2 className="w-16 h-16 text-purple-500/30 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No beats yet</h3>
                    <p className="text-gray-400 mb-6">Start by uploading your first beat to get started</p>
                    <button
                      onClick={() => setShowUploadModal(true)}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-500 transition"
                    >
                      <PlusCircle className="w-4 h-4" />
                      Upload Your First Beat
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {beats.map(beat => (
                      <div key={beat.id} className="group rounded-2xl bg-black border border-white/10 overflow-hidden hover:border-purple-500/50 transition">
                        {beat.artCoverUrl && (
                          <div className="relative h-44 overflow-hidden bg-gradient-to-b from-purple-600/20 to-black">
                            <Image src={beat.artCoverUrl} alt={beat.title} fill className="object-cover group-hover:scale-105 transition duration-300" />
                            <button
                              onClick={() => handlePlayBeat(beat)}
                              className="absolute right-4 bottom-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-purple-600 text-white shadow-lg shadow-purple-500/25 opacity-0 group-hover:opacity-100 transition"
                            >
                              {currentTrack?.id === beat.id && isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                            </button>
                          </div>
                        )}
                        <div className="p-4 space-y-3">
                          <div>
                            <h4 className="text-white font-semibold truncate">{beat.title}</h4>
                            <p className="text-sm text-gray-400">{beat.genre}</p>
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs">
                            <span className="px-2 py-1 rounded-full bg-purple-500/20 text-purple-300">{beat.bpm} BPM</span>
                            <span className="px-2 py-1 rounded-full bg-blue-500/20 text-blue-300">{beat.key || 'N/A'}</span>
                            <span className={`px-2 py-1 rounded-full ${beat.accessType === 'FREE' ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
                              {beat.accessType === 'FREE' ? 'Free' : beat.accessType}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm text-gray-400 pt-2 border-t border-white/10">
                            <div className="flex gap-3">
                              <span>{beat.playCount} plays</span>
                              <span>{beat.downloadCount} downloads</span>
                            </div>
                          </div>
                          <div className="flex gap-2 pt-2">
                            <button
                              onClick={() => handleShareBeat(beat)}
                              className="flex-1 px-3 py-2 text-sm rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition flex items-center justify-center gap-1"
                            >
                              <Share2 className="w-4 h-4" />
                              Share
                            </button>
                            <button
                              onClick={() => handleComingSoon('Beat editing')}
                              className="flex-1 px-3 py-2 text-sm rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition flex items-center justify-center gap-1"
                            >
                              <Edit3 className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteBeat(beat.id)}
                              className="flex-1 px-3 py-2 text-sm rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition flex items-center justify-center gap-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Beat Packs Tab */}
            {activeTab === 'packs' && (
              <div className="grid gap-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-white">Beat Packs</h2>
                  <button
                    onClick={() => handleComingSoon('Beat pack creation')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Create Pack
                  </button>
                </div>

                {beatPacks.length === 0 ? (
                  <div className="rounded-2xl bg-black border border-white/10 p-12 text-center">
                    <Package className="w-16 h-16 text-purple-500/30 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No beat packs yet</h3>
                    <p className="text-gray-400">Bundle your beats into packs for better pricing</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {beatPacks.map(pack => (
                      <div key={pack.id} className="rounded-2xl bg-black border border-white/10 p-6 hover:border-purple-500/50 transition">
                        <h4 className="text-white font-semibold mb-2">{pack.title}</h4>
                        <p className="text-sm text-gray-400 mb-4">{pack.description}</p>
                        <div className="flex items-center justify-between text-sm text-gray-400">
                          <span>{pack.beatCount} beats</span>
                          <span>{formatZMW(pack.price)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="grid gap-6">
                <div className="rounded-2xl bg-black border border-white/10 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Performance Analytics</h3>
                  <p className="text-gray-400">Detailed analytics coming soon</p>
                </div>
              </div>
            )}

            {/* Resources Tab */}
            {activeTab === 'resources' && (
              <div className="grid gap-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-white">Sound Resources</h2>
                  <button
                    onClick={() => handleComingSoon('Resource upload')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Add Resource
                  </button>
                </div>

                {soundResources.length === 0 ? (
                  <div className="rounded-2xl bg-black border border-white/10 p-12 text-center">
                    <Zap className="w-16 h-16 text-purple-500/30 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No resources yet</h3>
                    <p className="text-gray-400">Share sample packs, presets, and sound kits</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {soundResources.map(resource => (
                      <div key={resource.id} className="rounded-2xl bg-black border border-white/10 p-6">
                        <h4 className="text-white font-semibold mb-2">{resource.title}</h4>
                        <p className="text-xs text-purple-400 mb-2 capitalize">{resource.type}</p>
                        <p className="text-sm text-gray-400 mb-4">{resource.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-white font-semibold">{formatZMW(resource.price)}</span>
                          <span className="text-xs text-gray-400">{resource.downloads} downloads</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Upload Modal */}
        <AnimatePresence>
          {showUploadModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-black border border-white/10 rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold text-white">Upload New Beat</h2>
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="p-2 hover:bg-white/10 rounded-lg transition"
                  >
                    <X className="w-6 h-6 text-gray-400" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Beat Title *</label>
                    <input
                      type="text"
                      value={newBeat.title}
                      onChange={(e) => setNewBeat({ ...newBeat, title: e.target.value })}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="e.g., Trap Beat Vol.1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Description</label>
                    <textarea
                      value={newBeat.description}
                      onChange={(e) => setNewBeat({ ...newBeat, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Describe your beat..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Genre *</label>
                      <select
                        value={newBeat.genre}
                        onChange={(e) => setNewBeat({ ...newBeat, genre: e.target.value })}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">Select Genre</option>
                        <option value="Hip-Hop">Hip-Hop</option>
                        <option value="Trap">Trap</option>
                        <option value="R&B">R&B</option>
                        <option value="Drill">Drill</option>
                        <option value="Afrobeat">Afrobeat</option>
                        <option value="Amapiano">Amapiano</option>
                        <option value="Electronic">Electronic</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">BPM</label>
                      <input
                        type="number"
                        value={newBeat.bpm}
                        onChange={(e) => setNewBeat({ ...newBeat, bpm: e.target.value })}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="e.g., 140"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Key</label>
                      <input
                        type="text"
                        value={newBeat.key}
                        onChange={(e) => setNewBeat({ ...newBeat, key: e.target.value })}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="e.g., C Minor"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Access Type</label>
                      <select
                        value={newBeat.accessType}
                        onChange={(e) => setNewBeat({ ...newBeat, accessType: e.target.value as any })}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="FREE">Free</option>
                        <option value="PREMIUM">Premium</option>
                        <option value="PAY_PER_VIEW">Pay Per View</option>
                      </select>
                    </div>
                  </div>

                  {newBeat.accessType !== 'FREE' && (
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Price (ZMW)</label>
                      <input
                        type="number"
                        value={newBeat.price}
                        onChange={(e) => setNewBeat({ ...newBeat, price: e.target.value })}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="e.g., 50000"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Beat File *</label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-purple-500/30 rounded-lg p-6 text-center cursor-pointer hover:border-purple-500/50 transition"
                    >
                      <Upload className="w-8 h-8 text-purple-500/50 mx-auto mb-2" />
                      <p className="text-sm text-gray-300">
                        {newBeat.file ? newBeat.file.name : 'Click to upload or drag and drop'}
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="audio/*"
                        onChange={handleBeatFileChange}
                        className="hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Cover Art</label>
                    <div
                      onClick={() => coverInputRef.current?.click()}
                      className="border-2 border-dashed border-purple-500/30 rounded-lg p-6 text-center cursor-pointer hover:border-purple-500/50 transition"
                    >
                      {newBeat.coverPreview ? (
                        <div className="relative w-24 h-24 mx-auto">
                          <Image src={newBeat.coverPreview} alt="Cover preview" fill className="object-cover rounded-lg" />
                        </div>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-purple-500/50 mx-auto mb-2" />
                          <p className="text-sm text-gray-300">Click to upload cover art</p>
                        </>
                      )}
                      <input
                        ref={coverInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleCoverChange}
                        className="hidden"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setShowUploadModal(false)}
                      className="flex-1 px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUploadBeat}
                      disabled={isUploading}
                      className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 disabled:opacity-50 transition"
                    >
                      {isUploading ? `Uploading... ${uploadProgress}%` : 'Upload Beat'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hidden audio element for playing beats */}
        <audio ref={audioRef} onEnded={() => setIsPlaying(false)} />
      </div>
    </RoleGuard>
  );
}
