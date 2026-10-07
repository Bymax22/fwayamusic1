'use client';
import { useState, useEffect } from 'react';
import { Download, Music, HardDrive, ArrowDown, Clock, Sparkles, Play, Shield, Wifi, WifiOff, Heart, Share2, ListPlus, ArrowLeft } from 'lucide-react';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { useRouter } from 'next/navigation';
import Waveform from '@/components/Waveform';
import ScrollingTrackTitle from '@/components/ScrollingTrackTitle';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { formatFileSize, formatDuration } from '@/lib/utils';
import Image from "next/image";
import { useAuth } from '@/context/AuthContext';
import ShareModal from '@/components/ShareModal';
import DownloadStatusToast from '@/components/DownloadStatusToast';
import { createMediaSlug } from '@/lib/utils';
import {
  deletePrivateDownload,
  downloadTrackToPrivateStorage,
  listPrivateDownloads,
  readPrivateDownload,
  updatePrivateDownloadMetadata,
  type PrivateDownload,
} from '@/lib/privateDownloads';

let activePrivateDownloadUrl: string | null = null;

interface DownloadItem {
  id: string;
  mediaId?: string;
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
  likes?: number;
  playCount?: number;
  shareCount?: number;
  liked?: boolean;
}

export default function DownloadPage() {
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [suggestions, setSuggestions] = useState<DownloadItem[]>([]);
  const [freeDownloads, setFreeDownloads] = useState<DownloadItem[]>([]);
  const [premiumDownloads, setPremiumDownloads] = useState<DownloadItem[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'downloaded' | 'suggested' | 'free' | 'premium'>('downloaded');
  const [storageUsage, setStorageUsage] = useState({ used: 0, total: 10 * 1024 * 1024 * 1024 });
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [downloadedFiles, setDownloadedFiles] = useState<DownloadItem[]>([]);
  const [showNetworkNotification, setShowNetworkNotification] = useState(false);
  const [shareItem, setShareItem] = useState<DownloadItem | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<{ title: string; status: 'downloading' | 'complete' } | null>(null);
  const { currentTrack, isPlaying, playTrack } = useAudioPlayer();
  const router = useRouter();
  const { getToken, user } = useAuth();
  const { isOnline, connectionQuality } = useNetworkStatus();
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
            mediaId: record.mediaId,
            title: record.title,
            artist: record.artist,
            coverArt: record.coverArt,
            duration: record.duration,
            fileSize: record.data.size,
            quality: 'HD',
            downloadDate: record.downloadedAt,
            accessType: record.accessType,
            likes: record.likes ?? 0,
            playCount: record.playCount ?? 0,
            liked: record.liked ?? false,
            shareCount: record.shareCount ?? 0,
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
  setDownloadStatus({ title: item.title, status: 'downloading' });
  try {
    const record = await downloadTrackToPrivateStorage(
      { ...item, url: item.url },
      user.id,
      token
    );
    const completed: DownloadItem = {
      ...item,
      id: record.id,
      mediaId: record.mediaId,
      coverArt: record.coverArt,
      duration: record.duration,
      fileSize: record.data.size,
      downloadDate: record.downloadedAt,
      accessType: record.accessType,
      downloadStatus: 'completed',
      progress: 100,
      isDRMProtected: record.encrypted,
      likes: record.likes ?? item.likes ?? 0,
      playCount: record.playCount ?? item.playCount ?? 0,
      liked: record.liked ?? item.liked ?? false,
      shareCount: record.shareCount ?? item.shareCount ?? 0,
      expiresAt: record.expiresAt ?? undefined,
      privateRecord: record,
    };
    setDownloadedFiles((existing) => [
      ...existing.filter((download) => download.id !== completed.id),
      completed,
    ]);
    setDownloads((existing) => existing.filter((download) => download.id !== item.id));
    setDownloadStatus({ title: item.title, status: 'complete' });
  } catch (error) {
    console.error('Private download failed:', error);
    setDownloads((existing) => existing.filter((download) => download.id !== item.id));
    setDownloadStatus(null);
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

  const handleLike = async (item: DownloadItem) => {
    if (!user) {
      window.location.assign('/auth/user/signin');
      return;
    }
    try {
      const token = await getToken();
      if (!token) throw new Error('Please sign in to like tracks.');
      const response = await fetch(`/api/media/${encodeURIComponent(item.privateRecord?.mediaId || item.mediaId || item.id)}/interact/like`, {
        method: 'POST',
        credentials: 'include',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message || payload.error || 'Could not update your like.');
      }
      const payload = await response.json().catch(() => ({}));
      const liked = typeof payload.liked === 'boolean' ? payload.liked : !item.liked;
      const likes = typeof payload.likes === 'number'
        ? payload.likes
        : Math.max(0, (item.likes || 0) + (liked ? 1 : -1));
      if (item.privateRecord) {
        await updatePrivateDownloadMetadata(item.privateRecord.id, {
          likes,
          liked,
          playCount: item.playCount || 0,
          shareCount: item.shareCount || 0,
        });
      }
      setDownloadedFiles((existing) => existing.map((download) => {
        if (download.id !== item.id) return download;
        return { ...download, liked, likes };
      }));
    } catch (error) {
      console.error('Could not like downloaded track:', error);
      alert(error instanceof Error ? error.message : 'Could not update your like.');
    }
  };

  const handleAddToPlaylist = (item: DownloadItem) => {
    if (!user) {
      window.location.assign('/auth/user/signin');
      return;
    }
    window.dispatchEvent(new CustomEvent('fwaya:open-playlist-picker', {
      detail: { mediaId: Number(item.privateRecord?.mediaId || item.mediaId || item.id) },
    }));
  };

  const handleShare = async () => {
    if (!shareItem) return;
    const shareCount = (shareItem.shareCount || 0) + 1;
    if (shareItem.privateRecord) {
      await updatePrivateDownloadMetadata(shareItem.privateRecord.id, {
        likes: shareItem.likes || 0,
        liked: Boolean(shareItem.liked),
        playCount: shareItem.playCount || 0,
        shareCount,
      });
    }
    setDownloadedFiles((existing) => existing.map((item) =>
      item.id === shareItem.id ? { ...item, shareCount } : item
    ));
    setShareItem((item) => item ? { ...item, shareCount } : null);
  };

  const calculateStoragePercentage = () => {
    return Math.min(100, Math.max(0, (storageUsage.used / storageUsage.total) * 100));
  };

  const handlePlay = async (item: DownloadItem) => {
    try {
      if (item.privateRecord) {
        const audio = await readPrivateDownload(item.privateRecord);
        const objectUrl = URL.createObjectURL(audio);
        if (activePrivateDownloadUrl) URL.revokeObjectURL(activePrivateDownloadUrl);
        activePrivateDownloadUrl = objectUrl;
        playTrack({
          id: item.privateRecord.mediaId,
          title: item.title,
          artist: item.artist,
          imageUrl: item.coverArt,
          audioUrl: objectUrl,
          type: 'AUDIO',
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
      return { status: 'expired', color: 'text-purple/45' };
    }
    return { status: item.privateRecord ? 'device protected' : 'authorized on download', color: 'text-purple/45' };
  };

  return (
      <>
      <div className="min-h-screen bg-black p-4 text-white sm:p-6">
      
      {/* Network Status Notification */}
      {showNetworkNotification && (
        <div className={`mb-4 p-4 rounded-lg flex items-center gap-3 ${
          isOnline && connectionQuality !== 'offline' && connectionQuality !== 'poor'
            ? 'bg-purple/10'
            : 'bg-purple/10'
        }`}>
          {isOnline && connectionQuality !== 'offline' && connectionQuality !== 'poor' ? (
            <>
              <Wifi className="w-5 h-5 text-purple/60" />
              <span className="text-sm text-purple/45">
                Internet connection restored. All features are now available.
              </span>
            </>
          ) : (
            <>
              <WifiOff className="w-5 h-5 text-purple/60" />
              <span className="text-sm text-purple/45">
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
            <div className="mb-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (window.history.length > 1) router.back();
                  else router.push('/browse');
                }}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#000000] text-white/75 transition hover:bg-purple/85 hover:text-white"
                aria-label="Go back"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
              <Download className="w-6 h-6 sm:w-8 sm:h-8 text-purple/45" />
              My Downloads
              </h1>
            </div>
            <p className="text-sm sm:text-base text-white/60">Access your offline music library</p>
          </div>
          
          {/* Device & Storage Info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <HardDrive className="w-4 h-4 sm:w-5 sm:h-5 text-white/60" />
              <span className="text-xs sm:text-sm text-white/90">
                {formatFileSize(storageUsage.used)} / {formatFileSize(storageUsage.total)}
              </span>
            </div>
            <div className="w-full sm:w-32 h-2 bg-[#000000] rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple/75 to-purple/75 rounded-full"
                style={{ width: `${calculateStoragePercentage()}%` }}
              />
            </div>
            <button 
              onClick={() => setIsOfflineMode(!isOfflineMode)}
              className={`px-3 py-1 sm:px-4 sm:py-2 rounded-lg flex items-center gap-2 text-sm sm:text-base w-full sm:w-auto justify-center transition-colors ${
                isOfflineMode 
                  ? 'bg-purple/75 text-white'
                  : 'bg-[#000000] text-white/90'
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
          <div className="mb-6 rounded-lg bg-purple/10 p-4 text-sm text-purple/20">
            Create a Fwaya listener account to save tracks privately for offline playback.{' '}
            <a href="/auth/user/signup" className="font-semibold underline">Create account</a>
          </div>
        )}

        <div className="mb-6 rounded-lg bg-[#000000] p-3 text-xs text-white/90">
          <Shield className="mr-2 inline h-4 w-4 text-purple/45" />
          Downloads stay in this browser’s private Fwaya storage. Protected files are encrypted for this browser; they are not exported to the phone’s public Music or Downloads folder.
          {downloadedFiles.length > 0 && (
            <span className="ml-2 text-purple/30">{downloadedFiles.filter((item) => item.isDRMProtected).length} protected downloads</span>
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
                      ? 'rounded-full bg-purple/85 text-white'
                      : 'rounded-full text-white/60 hover:bg-white/5 hover:text-white/90'
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
                  className="flex items-center gap-3 rounded-xl bg-[#000000] p-2 transition-colors hover:bg-[#000000]"
                >
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md sm:h-16 sm:w-16">
                    <Image
                      src={item.coverArt} 
                      alt={item.title} 
                      width={200}
                      height={200}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/default-cover.jpg';
                      }}
                    />
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <ScrollingTrackTitle isPlaying={String(currentTrack?.id) === String(item.privateRecord?.mediaId || item.id) && isPlaying} className="text-sm font-medium text-white sm:text-base">{item.title}</ScrollingTrackTitle>
                    <p className="text-xs sm:text-sm text-white/60 truncate">{item.artist}</p>
                    
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
                      <div className="flex items-center gap-1 sm:gap-2 text-xs text-white/60">
                        <Clock className="w-3 h-3" />
                        {formatDuration(item.duration)}
                        <span className="ml-2 text-white/45">{item.playCount || 0} plays</span>
                      </div>
                      
                      <div className="flex gap-1 sm:gap-2 items-center">
                        {item.downloadStatus === 'completed' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleLike(item)}
                              className={`inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-purple/20 ${item.liked ? 'text-purple/60' : 'text-white/65'}`}
                              aria-label={`${item.liked ? 'Unlike' : 'Like'} ${item.title} (${item.likes || 0} likes)`}
                            >
                              <Heart className="h-4 w-4" fill={item.liked ? 'currentColor' : 'none'} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAddToPlaylist(item)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white/65 hover:bg-purple/20 hover:text-purple/45"
                              aria-label={`Add ${item.title} to a playlist`}
                            >
                              <ListPlus className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setShareItem(item)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white/65 hover:bg-purple/20 hover:text-purple/45"
                              aria-label={`Share ${item.title}`}
                            >
                              <Share2 className="h-4 w-4" />
                            </button>
                            <span className="mr-1 text-[11px] text-white/50">{item.likes || 0}</span>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => handlePlay(item)}
                          disabled={item.isDRMProtected && !drmStatus}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-purple/85 text-white hover:bg-purple/75 disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label={`Play ${item.title}`}
                        >
                          {String(currentTrack?.id) === String(item.privateRecord?.mediaId || item.id) && isPlaying
                            ? <Waveform playing className="h-4 w-4" />
                            : <Play className="h-4 w-4" />}
                        </button>
                        {item.downloadStatus === 'completed' ? (
                          <>
                            <button 
                              onClick={() => handleDelete(item.id)}
                              className="text-xs text-white/60 hover:text-purple/20"
                              aria-label={`Delete ${item.title} from downloads`}
                            >
                              Delete
                            </button>
                          </>
                        ) : item.downloadStatus === 'downloading' ? (
                          <div className="w-16 sm:w-20 bg-[#000000] rounded-full h-1.5">
                            <div 
                              className="bg-gradient-to-r from-purple/75 to-purple/75 h-1.5 rounded-full"
                              style={{ width: `${item.progress || 0}%` }}
                            />
                          </div>
                        ) : (
                          <button 
                            onClick={() => handleDownload(item)}
                            disabled={!isOnline || connectionQuality === 'offline' || isOfflineMode}
                            className={`text-xs flex items-center gap-1 ${
                              !isOnline || connectionQuality === 'offline' || isOfflineMode
                                ? 'text-white/60 cursor-not-allowed'
                                : 'text-purple/45 hover:text-purple/30'
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
            <div className="col-span-full p-6 sm:p-8 text-center text-white/60">
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
                  className="mt-2 sm:mt-3 text-purple/45 hover:text-purple/30 text-xs sm:text-sm flex items-center justify-center gap-1 mx-auto"
                >
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-purple/45" />
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
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-purple/45" />
                Smart Recommendations
              </h2>
              <button className="text-xs sm:text-sm text-purple/45 hover:text-purple/30">
                View all
              </button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {suggestions.slice(0, 5).map(item => (
                <div key={item.id} className="bg-[#000000] rounded-lg p-2 sm:p-3 hover:bg-[#000000] transition-colors">
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
                      className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 w-6 h-6 sm:w-8 sm:h-8 bg-purple/75 rounded-full flex items-center justify-center shadow-lg hover:bg-purple/60 transition-colors"
                    >
                      <ArrowDown className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                    </button>
                  </div>
                  <h3 className="font-medium text-white truncate text-xs sm:text-sm">{item.title}</h3>
                  <p className="text-xs text-white/60 truncate">{item.artist}</p>
                  <div className="mt-1 sm:mt-2 flex justify-between items-center text-xs text-white/60">
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
          <div className="mt-8 sm:mt-12 bg-[#000000] rounded-xl p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
              <ArrowDown className="w-4 h-4 sm:w-5 sm:h-5 text-purple/45" />
              Download Queue
            </h2>
            <div className="space-y-2 sm:space-y-3">
              {downloads.filter(d => d.downloadStatus === 'downloading').map(item => (
                <div key={item.id} className="flex items-center gap-3 sm:gap-4 p-2 sm:p-3 bg-[#000000] rounded-lg">
                  <Image
                    src={item.coverArt} 
                    alt={item.title} 
                    width={48}
                    height={48}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white truncate text-sm sm:text-base">{item.title}</h3>
                    <p className="text-xs sm:text-sm text-white/60 truncate">{item.artist}</p>
                    <div className="w-full bg-black rounded-full h-1 sm:h-1.5 mt-1 sm:mt-2">
                      <div 
                        className="bg-gradient-to-r from-purple/75 to-purple/75 h-full rounded-full"
                        style={{ width: `${item.progress || 0}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs sm:text-sm text-white/60">{item.progress}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DRM Information */}
        {downloads.some(d => d.isDRMProtected) && (
          <div className="mt-8 sm:mt-12 bg-[#000000] rounded-xl p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-purple/60" />
              DRM Protection Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-white/60">
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
      {shareItem && (
        <ShareModal
          open
          onClose={() => setShareItem(null)}
          title={shareItem.title}
          artist={shareItem.artist}
          coverUrl={shareItem.coverArt}
          url={`${window.location.origin}/track/${createMediaSlug(shareItem.title, shareItem.privateRecord?.mediaId || shareItem.mediaId || shareItem.id)}`}
          onShare={() => setShareItem((item) => item ? { ...item, shareCount: (item.shareCount || 0) + 1 } : null)}
        />
      )}
      {downloadStatus && (
        <DownloadStatusToast
          title={downloadStatus.title}
          status={downloadStatus.status}
          onClose={() => setDownloadStatus(null)}
          onView={() => {
            setActiveTab('downloaded');
            setDownloadStatus(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}
      </>
  );
}
