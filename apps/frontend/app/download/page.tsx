'use client';
import { useState, useEffect, useRef } from 'react';
import { Download, Music, Headphones, HardDrive, ArrowDown, Check, Crown, Clock, Sparkles, Play, Shield, Lock, Wifi, WifiOff } from 'lucide-react';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import Waveform from '@/components/Waveform';
import ScrollingTrackTitle from '@/components/ScrollingTrackTitle';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { formatFileSize, formatDuration } from '@/lib/utils';
import Image from "next/image";
import { useAuth } from '@/context/AuthContext';
import {
  deletePrivateDownload,
  downloadTrackToPrivateStorage,
  listPrivateDownloads,
  readPrivateDownload,
  type PrivateDownload,
} from '@/lib/privateDownloads';

interface DownloadItem {
  id: string;
  title: string;
  artist: string;
  coverArt: string;
  duration: number;
  fileSize: number;
  quality: 'SD' | 'HD' | 'Lossless';
  downloadDate: string;
  accessType: 'FREE' | 'PREMIUM' | 'PAY_PER_VIEW';
  downloadStatus: 'pending' | 'downloading' | 'completed' | 'failed';
  progress?: number;
  isDRMProtected: boolean;
  licenseKey?: string;
  deviceId?: string;
  expiresAt?: string;
  url?: string;
  privateRecord?: PrivateDownload;
}

export default function DownloadPage() {
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [suggestions, setSuggestions] = useState<DownloadItem[]>([]);
  const [freeDownloads, setFreeDownloads] = useState<DownloadItem[]>([]);
  const [premiumDownloads, setPremiumDownloads] = useState<DownloadItem[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'downloaded' | 'suggested' | 'free' | 'premium'>('all');
  const [storageUsage, setStorageUsage] = useState({ used: 0, total: 10 * 1024 * 1024 * 1024 });
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [downloadedFiles, setDownloadedFiles] = useState<DownloadItem[]>([]);
  const [showNetworkNotification, setShowNetworkNotification] = useState(false);
  const { currentTrack, isPlaying, playTrack } = useAudioPlayer();
  const { getToken, user } = useAuth();
  const { isOnline, connectionQuality } = useNetworkStatus();
  const currentObjectUrl = useRef<string | null>(null);

  useEffect(() => () => {
    if (currentObjectUrl.current) URL.revokeObjectURL(currentObjectUrl.current);
  }, []);

useEffect(() => {
  let mounted = true;

  const loadData = async () => {
    try {
      const token = await getToken();
      if (user && token) {
        const localItems = await listPrivateDownloads(user.id);
        if (mounted) {
          setDownloadedFiles(localItems.map((record) => ({
            id: record.id,
            title: record.title,
            artist: record.artist,
            coverArt: record.coverArt,
            duration: record.duration,
            fileSize: record.data.size,
            quality: 'HD',
            downloadDate: record.downloadedAt,
            accessType: record.accessType,
            downloadStatus: 'completed',
            isDRMProtected: record.encrypted,
            expiresAt: record.expiresAt ?? undefined,
            privateRecord: record,
          })));
      }
      }

      const backend = process.env.NEXT_PUBLIC_API_URL || 'https://fwayamusic1-backend.vercel.app';
      const suggestionsResponse = await fetch(`${backend}/api/v1/media/suggestions?type=downloadable`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (suggestionsResponse.ok) {
        const suggested = await suggestionsResponse.json();
        const items: DownloadItem[] = (Array.isArray(suggested) ? suggested : (suggested.data ?? []))
          .filter((item: unknown): item is DownloadItem => Boolean(item && typeof item === 'object'))
          .map((item: DownloadItem) => ({
            ...item,
            id: String(item.id),
            title: item.title || 'Untitled track',
            artist: item.artist || 'Fwaya artist',
            coverArt: item.coverArt || (item as DownloadItem & { artCoverUrl?: string }).artCoverUrl || '/default-cover.jpg',
            duration: Number(item.duration) || 0,
            fileSize: Number(item.fileSize) || 0,
            quality: item.quality || 'HD',
            downloadDate: item.downloadDate || '',
            accessType: item.accessType || 'FREE',
            downloadStatus: 'pending',
            isDRMProtected: item.accessType !== 'FREE',
            url: item.url || (item as DownloadItem & { audioUrl?: string }).audioUrl,
          }));
        if (mounted) {
          setSuggestions(items);
          setFreeDownloads(items.filter((item) => item.accessType === 'FREE'));
          setPremiumDownloads(items.filter((item) => item.accessType === 'PREMIUM'));
        }
      }
    } catch (error) {
      console.error('Error loading private download library:', error);
    }
  };

  void loadData();
  return () => {
    mounted = false;
  };
}, [getToken, user?.id]);

// Add this effect for storage usage calculation
useEffect(() => {
  const used = [...downloads, ...downloadedFiles].reduce((sum, item) => sum + (item.fileSize || 0), 0);
  setStorageUsage(prev => ({ ...prev, used }));
}, [downloads, downloadedFiles]);

// Auto-enable offline mode when network is offline or poor quality
useEffect(() => {
  const wasOnline = isOfflineMode === false;
  
  if (!isOnline || connectionQuality === 'offline' || connectionQuality === 'poor') {
    setIsOfflineMode(true);
    if (wasOnline && connectionQuality === 'offline') {
      setShowNetworkNotification(true);
      setTimeout(() => setShowNetworkNotification(false), 5000);
    }
  } else {
    // Only auto-disable if user had enabled it for network reasons
    if (isOfflineMode) {
      setShowNetworkNotification(true);
      setTimeout(() => setShowNetworkNotification(false), 5000);
    }
  }
}, [isOnline, connectionQuality]);

const handleDownload = async (item: DownloadItem) => {
  if (!isOnline || connectionQuality === 'offline' || isOfflineMode) {
    alert('Connect to the internet before downloading a track.');
    return;
  }
  if (!user) {
    window.location.assign('/auth/user/signup');
    return;
  }
  if (!item.url) {
    alert('This track does not have a downloadable audio file.');
    return;
  }
  const token = await getToken();
  if (!token) {
    window.location.assign('/auth/user/signup');
    return;
  }

  setDownloads((existing) => [
    ...existing.filter((download) => download.id !== item.id),
    { ...item, downloadStatus: 'downloading', progress: 0 },
  ]);
  try {
    const record = await downloadTrackToPrivateStorage(
      { ...item, url: item.url },
      user.id,
      token
    );
    const completed: DownloadItem = {
      ...item,
      id: record.id,
      coverArt: record.coverArt,
      duration: record.duration,
      fileSize: record.data.size,
      downloadDate: record.downloadedAt,
      accessType: record.accessType,
      downloadStatus: 'completed',
      progress: 100,
      isDRMProtected: record.encrypted,
      expiresAt: record.expiresAt ?? undefined,
      privateRecord: record,
    };
    setDownloadedFiles((existing) => [
      ...existing.filter((download) => download.id !== completed.id),
      completed,
    ]);
    setDownloads((existing) => existing.filter((download) => download.id !== item.id));
  } catch (error) {
    console.error('Private download failed:', error);
    setDownloads((existing) => existing.filter((download) => download.id !== item.id));
    alert(error instanceof Error ? error.message : 'Download failed. Please try again.');
  }
};

  const handleDelete = async (id: string) => {
    try {
      const item = downloadedFiles.find((download) => download.id === id);
      if (!item?.privateRecord) throw new Error('This private download is not available in browser storage.');
      await deletePrivateDownload(item.privateRecord.id);
      setDownloadedFiles((existing) => existing.filter((download) => download.id !== id));
    } catch (error) {
      console.error('Error deleting private download:', error);
      alert(error instanceof Error ? error.message : 'Download could not be deleted.');
    }
  };

  const calculateStoragePercentage = () => {
    return Math.min(100, Math.max(0, (storageUsage.used / storageUsage.total) * 100));
  };

  const handlePlay = async (item: DownloadItem) => {
    try {
      if (item.privateRecord) {
        const audio = await readPrivateDownload(item.privateRecord);
        if (currentObjectUrl.current) URL.revokeObjectURL(currentObjectUrl.current);
        const objectUrl = URL.createObjectURL(audio);
        currentObjectUrl.current = objectUrl;
        playTrack({
          id: item.id,
          title: item.title,
          artist: item.artist,
          imageUrl: item.coverArt,
          audioUrl: objectUrl,
          accessType: 'FREE',
        });
        return;
      }
      if (!item.url) throw new Error('This item does not have a playable audio URL.');
      playTrack({
        id: item.id,
        title: item.title,
        artist: item.artist,
        imageUrl: item.coverArt,
        audioUrl: item.url,
        accessType: item.accessType,
      });
    } catch (error) {
      console.error('Unable to play a private download:', error);
      alert(error instanceof Error ? error.message : 'This download cannot be played in this browser.');
    }
  };

  const getFilteredDownloads = () => {
    switch (activeTab) {
      case 'downloaded': return [...downloads.filter(d => d.downloadStatus === 'downloading'), ...downloadedFiles];
      case 'suggested': return suggestions;
      case 'free': return freeDownloads;
      case 'premium': return premiumDownloads;
      default: return [...downloads, ...downloadedFiles, ...suggestions];
    }
  };

  const getDRMStatus = (item: DownloadItem) => {
    if (!item.isDRMProtected) return null;
    if (item.expiresAt && new Date(item.expiresAt) < new Date()) {
      return { status: 'expired', color: 'text-purple-300' };
    }
    return { status: item.privateRecord ? 'device protected' : 'authorized on download', color: 'text-purple-300' };
  };

  return (
      <div className="bg-gradient-to-br from-[#0a3747]/95 to-[#0a1f29]/95 min-h-screen p-4 sm:p-6">
      
      {/* Network Status Notification */}
      {showNetworkNotification && (
        <div className={`mb-4 p-4 rounded-lg flex items-center gap-3 ${
          isOnline && connectionQuality !== 'offline' && connectionQuality !== 'poor'
            ? 'bg-green-500/10 border border-green-500/30'
            : 'bg-red-500/10 border border-red-500/30'
        }`}>
          {isOnline && connectionQuality !== 'offline' && connectionQuality !== 'poor' ? (
            <>
              <Wifi className="w-5 h-5 text-green-400" />
              <span className="text-sm text-green-300">
                Internet connection restored. All features are now available.
              </span>
            </>
          ) : (
            <>
              <WifiOff className="w-5 h-5 text-red-400" />
              <span className="text-sm text-red-300">
                You're offline or have a poor connection. Switched to offline mode.
              </span>
            </>
          )}
        </div>
      )}
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
              <Download className="w-6 h-6 sm:w-8 sm:h-8 text-purple-300" />
              My Downloads
            </h1>
            <p className="text-sm sm:text-base text-gray-400">Access your offline music library</p>
          </div>
          
          {/* Device & Storage Info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <HardDrive className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <span className="text-xs sm:text-sm text-gray-300">
                {formatFileSize(storageUsage.used)} / {formatFileSize(storageUsage.total)}
              </span>
            </div>
            <div className="w-full sm:w-32 h-2 bg-[#0a3747] rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-violet-500 rounded-full" 
                style={{ width: `${calculateStoragePercentage()}%` }}
              />
            </div>
            <button 
              onClick={() => setIsOfflineMode(!isOfflineMode)}
              className={`px-3 py-1 sm:px-4 sm:py-2 rounded-lg flex items-center gap-2 text-sm sm:text-base w-full sm:w-auto justify-center transition-colors ${
                isOfflineMode 
                  ? 'bg-purple-500 text-white' 
                  : 'bg-[#0a3747] text-gray-300'
              }`}
              title={!isOnline || connectionQuality === 'offline' ? 'You are offline' : 'Toggle offline mode'}
            >
              {!isOnline || connectionQuality === 'offline' || connectionQuality === 'poor' ? (
                <>
                  <WifiOff className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="text-xs">
                    {connectionQuality === 'offline' ? 'No Connection' : 'Poor Connection'}
                  </span>
                </>
              ) : (
                <>
                  <Wifi className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="text-xs">{isOfflineMode ? 'Offline Mode' : 'Online'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {!user && (
          <div className="mb-6 rounded-lg border border-purple-400/30 bg-purple-500/10 p-4 text-sm text-purple-100">
            Create a Fwaya listener account to save tracks privately for offline playback.{' '}
            <a href="/auth/user/signup" className="font-semibold underline">Create account</a>
          </div>
        )}

        <div className="mb-6 rounded-lg bg-[#0a3747]/50 p-3 text-xs text-gray-300">
          <Shield className="mr-2 inline h-4 w-4 text-purple-300" />
          Downloads stay in this browser’s private Fwaya storage. Protected files are encrypted for this browser; they are not exported to the phone’s public Music or Downloads folder.
          {downloadedFiles.length > 0 && (
            <span className="ml-2 text-purple-200">{downloadedFiles.filter((item) => item.isDRMProtected).length} protected downloads</span>
          )}
        </div>

        {/* Tabs */}
        <div className="relative mb-6">
          <div className="flex overflow-x-auto pb-2 scrollbar-hide">
            <div className="flex space-x-1">
              {(['all', 'downloaded', 'suggested', 'free', 'premium'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-2 text-sm sm:text-base font-medium whitespace-nowrap ${
                    activeTab === tab
                      ? 'text-purple-300 border-b-2 border-purple-500'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  {tab === 'all' && 'All Content'}
                  {tab === 'downloaded' && 'Downloaded'}
                  {tab === 'suggested' && 'Suggested'}
                  {tab === 'free' && 'Free'}
                  {tab === 'premium' && 'Premium'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-3">
          {getFilteredDownloads().length > 0 ? (
            getFilteredDownloads().map(item => {
              const drmStatus = getDRMStatus(item);
              
              return (
                <div 
                  key={item.id} 
                  className="flex overflow-hidden rounded-xl bg-[#0a3747]/70 shadow-sm transition-all hover:shadow-md"
                >
                  <div className="relative w-24 shrink-0 group sm:w-32">
                    <Image
                      src={item.coverArt} 
                      alt={item.title} 
                      width={200}
                      height={200}
                      className="h-full min-h-28 w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/default-cover.jpg';
                      }}
                    />
                    <div className={`absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all ${
                      String(currentTrack?.id) === String(item.id) && isPlaying ? 'bg-opacity-30' : ''
                    }`}>
                      <div className="flex gap-2 sm:gap-3">
                        <button 
                          onClick={() => handlePlay(item)}
                          className={`transform transition-all ${String(currentTrack?.id) === String(item.id) && isPlaying ? 'opacity-100 translate-y-0' : 'opacity-0 group-hover:opacity-100 group-hover:translate-y-0'}`}
                          disabled={item.isDRMProtected && !drmStatus}
                        >
                          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-lg ${
                            item.isDRMProtected && !drmStatus 
                              ? 'bg-gray-600 cursor-not-allowed' 
                              : 'bg-purple-500'
                          }`}>
                            {String(currentTrack?.id) === String(item.id) && isPlaying ? (
                              <Waveform playing className="h-5 w-5" />
                            ) : (
                              <Play className="w-4 h-4 sm:h-5 sm:w-5 text-white" />
                            )}
                          </div>
                        </button>
                        {item.downloadStatus === 'pending' && (
                          <button 
                            onClick={() => handleDownload(item)}
                            className="opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all"
                          >
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#0a3747] border-2 border-purple-500 flex items-center justify-center shadow-lg">
                              <ArrowDown className="w-4 h-4 sm:w-5 sm:h-5 text-purple-300" />
                            </div>
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Quality badge */}
                    <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${
                      item.quality === 'Lossless' ? 'bg-purple-600 text-white' :
                      item.quality === 'HD' ? 'bg-blue-600 text-white' :
                      'bg-gray-600 text-gray-300'
                    }`}>
                      {item.quality}
                    </div>
                    
                    {/* Premium badge */}
                    {item.accessType === 'PREMIUM' && (
                      <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-purple-600 text-white text-xs font-medium flex items-center gap-1">
                        <Crown className="w-3 h-3" />
                        Premium
                      </div>
                    )}

                    {/* DRM badge */}
                    {item.isDRMProtected && (
                      <div className="absolute bottom-2 left-2 px-2 py-1 rounded-full bg-blue-600 text-white text-xs font-medium flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        DRM
                      </div>
                    )}
                  </div>
                  
                  <div className="min-w-0 flex-1 p-3 sm:p-4">
                    <ScrollingTrackTitle isPlaying={String(currentTrack?.id) === String(item.id) && isPlaying} className="text-sm font-medium text-white sm:text-base">{item.title}</ScrollingTrackTitle>
                    <p className="text-xs sm:text-sm text-gray-400 truncate">{item.artist}</p>
                    
                    {/* DRM Status */}
                    {item.isDRMProtected && drmStatus && (
                      <div className="mt-1 flex items-center gap-1">
                        <Shield className={`w-3 h-3 ${drmStatus.color}`} />
                        <span className={`text-xs ${drmStatus.color}`}>
                          {drmStatus.status === 'unlicensed' && 'License Required'}
                          {drmStatus.status === 'expired' && 'License Expired'}
                          {drmStatus.status === 'strict' && 'Device Locked'}
                          {drmStatus.status === 'encrypted' && 'Fully Encrypted'}
                        </span>
                      </div>
                    )}
                    
                    <div className="mt-2 sm:mt-3 flex justify-between items-center">
                      <div className="flex items-center gap-1 sm:gap-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {formatDuration(item.duration)}
                      </div>
                      
                      <div className="flex gap-1 sm:gap-2 items-center">
                        <button
                          type="button"
                          onClick={() => handlePlay(item)}
                          disabled={item.isDRMProtected && !drmStatus}
                          className="inline-flex items-center gap-1 rounded-md bg-purple-600 px-2 py-1 text-xs font-medium text-white hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label={`Play ${item.title}`}
                        >
                          <Play className="h-3 w-3" />
                          Play
                        </button>
                        {item.downloadStatus === 'completed' ? (
                          <>
                            <span className="text-xs text-purple-300 flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              <span className="hidden sm:inline">Downloaded</span>
                            </span>
                            <button 
                              onClick={() => handleDelete(item.id)}
                              className="text-xs text-gray-400 hover:text-purple-100"
                            >
                              Delete
                            </button>
                          </>
                        ) : item.downloadStatus === 'downloading' ? (
                          <div className="w-16 sm:w-20 bg-[#0a3747] rounded-full h-1.5">
                            <div 
                              className="bg-gradient-to-r from-purple-500 to-violet-500 h-1.5 rounded-full" 
                              style={{ width: `${item.progress || 0}%` }}
                            />
                          </div>
                        ) : (
                          <button 
                            onClick={() => handleDownload(item)}
                            disabled={!isOnline || connectionQuality === 'offline' || isOfflineMode}
                            className={`text-xs flex items-center gap-1 ${
                              !isOnline || connectionQuality === 'offline' || isOfflineMode
                                ? 'text-gray-600 cursor-not-allowed'
                                : 'text-purple-300 hover:text-purple-200'
                            }`}
                          >
                            <ArrowDown className="w-3 h-3" />
                            <span className="hidden sm:inline">Download</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full p-6 sm:p-8 text-center text-gray-400">
              <div className="text-lg mb-2 flex justify-center">
                <Music className="w-6 h-6" />
              </div>
              <p className="text-sm sm:text-base">
                {activeTab === 'downloaded' 
                  ? 'You have no downloaded songs yet' 
                  : activeTab === 'suggested' 
                    ? 'No suggestions available' 
                    : activeTab === 'free' 
                      ? 'No free downloads available' 
                      : 'No premium content available'}
              </p>
              {activeTab === 'downloaded' && (
                <button 
                  onClick={() => setActiveTab('suggested')}
                  className="mt-2 sm:mt-3 text-purple-300 hover:text-purple-200 text-xs sm:text-sm flex items-center justify-center gap-1 mx-auto"
                >
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-purple-300" />
                  View suggestions
                </button>
              )}
            </div>
          )}
        </div>

        {/* Smart Recommendations */}
        {(activeTab === 'all' || activeTab === 'suggested') && suggestions.length > 0 && (
          <div className="mt-8 sm:mt-12">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-purple-300" />
                Smart Recommendations
              </h2>
              <button className="text-xs sm:text-sm text-purple-300 hover:text-purple-200">
                View all
              </button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {suggestions.slice(0, 5).map(item => (
                <div key={item.id} className="bg-[#0a3747]/50 rounded-lg p-2 sm:p-3 hover:bg-[#0a3747]/70 transition-colors">
                  <div className="relative mb-2 sm:mb-3">
                    <Image
                      src={item.coverArt} 
                      alt={item.title} 
                      width={150}
                      height={150}
                      className="w-full aspect-square object-cover rounded-lg"
                    />
                    <button 
                      onClick={() => handleDownload(item)}
                      className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 w-6 h-6 sm:w-8 sm:h-8 bg-purple-500 rounded-full flex items-center justify-center shadow-lg hover:bg-purple-400 transition-colors"
                    >
                      <ArrowDown className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                    </button>
                  </div>
                  <h3 className="font-medium text-white truncate text-xs sm:text-sm">{item.title}</h3>
                  <p className="text-xs text-gray-400 truncate">{item.artist}</p>
                  <div className="mt-1 sm:mt-2 flex justify-between items-center text-xs text-gray-500">
                    <span>{formatDuration(item.duration)}</span>
                    <span>{formatFileSize(item.fileSize)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Download Queue */}
        {downloads.filter(d => d.downloadStatus === 'downloading').length > 0 && (
          <div className="mt-8 sm:mt-12 bg-[#0a3747]/70 rounded-xl p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
              <ArrowDown className="w-4 h-4 sm:w-5 sm:h-5 text-purple-300" />
              Download Queue
            </h2>
            <div className="space-y-2 sm:space-y-3">
              {downloads.filter(d => d.downloadStatus === 'downloading').map(item => (
                <div key={item.id} className="flex items-center gap-3 sm:gap-4 p-2 sm:p-3 bg-[#0a3747] rounded-lg">
                  <Image
                    src={item.coverArt} 
                    alt={item.title} 
                    width={48}
                    height={48}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white truncate text-sm sm:text-base">{item.title}</h3>
                    <p className="text-xs sm:text-sm text-gray-400 truncate">{item.artist}</p>
                    <div className="w-full bg-[#0a1f29] rounded-full h-1 sm:h-1.5 mt-1 sm:mt-2">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-violet-500 h-full rounded-full" 
                        style={{ width: `${item.progress || 0}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs sm:text-sm text-gray-400">{item.progress}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DRM Information */}
        {downloads.some(d => d.isDRMProtected) && (
          <div className="mt-8 sm:mt-12 bg-[#0a3747]/70 rounded-xl p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
              DRM Protection Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-400">
              <div>
                <p className="font-medium text-white mb-2">What is DRM?</p>
                <p>Digital Rights Management protects your purchased content from unauthorized copying and sharing.</p>
              </div>
              <div>
                <p className="font-medium text-white mb-2">Device Restrictions</p>
                <p>DRM protected content is tied to your device and cannot be transferred to other devices.</p>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
  );
}
