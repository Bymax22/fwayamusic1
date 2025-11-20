'use client';
import { useState, useEffect } from 'react';
import { Download, Music, Headphones, HardDrive, ArrowDown, Check, Crown, Clock, Sparkles, Play, Shield, Lock } from 'lucide-react';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { formatFileSize, formatDuration } from '@/lib/utils';
import Image from "next/image";
import Protected from '@/components/Protected';
import { useAuth } from '@/context/AuthContext';

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
}

interface DeviceLicense {
  id: number;
  deviceId: string;
  licenseKey: string;
  mediaId: number;
  expiresAt: string | null;
  isActive: boolean;
  restrictionLevel: 'NONE' | 'BASIC' | 'STRICT' | 'ENCRYPTED';
}

export default function DownloadPage() {
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [suggestions, setSuggestions] = useState<DownloadItem[]>([]);
  const [freeDownloads, setFreeDownloads] = useState<DownloadItem[]>([]);
  const [premiumDownloads, setPremiumDownloads] = useState<DownloadItem[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'downloaded' | 'suggested' | 'free' | 'premium'>('all');
  const [storageUsage, setStorageUsage] = useState({ used: 0, total: 10000 });
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [deviceLicenses, setDeviceLicenses] = useState<DeviceLicense[]>([]);
  const [currentDeviceId, setCurrentDeviceId] = useState<string>('');
  const { currentTrack, setCurrentTrack } = useAudioPlayer();
  const { getToken } = useAuth();

useEffect(() => {
  const generateDeviceId = () => {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('deviceId', deviceId);
    }
    setCurrentDeviceId(deviceId);
  };

  const fetchDownloadData = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const [downloadsRes, suggestionsRes, licensesRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/users/me/downloads`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/media/suggestions?type=downloadable`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/users/me/device-licenses`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (downloadsRes.ok) {
        const d = await downloadsRes.json();
        setDownloads(Array.isArray(d) ? d : (d.data ?? d));
      }
      if (suggestionsRes.ok) {
        const suggested = await suggestionsRes.json();
        const s = Array.isArray(suggested) ? suggested : (suggested.data ?? suggested);
        setSuggestions(s);
        setFreeDownloads(s.filter((item: DownloadItem) => item.accessType === 'FREE'));
        setPremiumDownloads(s.filter((item: DownloadItem) => item.accessType === 'PREMIUM'));
      }
      if (licensesRes.ok) {
        const lic = await licensesRes.json();
        setDeviceLicenses(Array.isArray(lic) ? lic : (lic.data ?? lic));
      }

    } catch (error) {
      console.error('Error fetching download data:', error);
    }
  };

  fetchDownloadData();
  generateDeviceId();
}, []);

// Add this effect for storage usage calculation
useEffect(() => {
  const used = downloads.reduce((sum, item) => sum + item.fileSize, 0);
  setStorageUsage(prev => ({ ...prev, used }));
}, [downloads]);

  const handleDownload = async (item: DownloadItem) => {
    try {
      // For DRM protected content, generate license first
      if (item.isDRMProtected) {
        const licenseResponse = await fetch('/api/drm/license', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            mediaId: item.id,
            deviceId: currentDeviceId,
            deviceInfo: {
              deviceId: currentDeviceId,
              deviceName: 'Web Browser',
              deviceType: 'desktop',
              os: navigator.platform,
              fingerprint: currentDeviceId
            }
          }),
        });

        if (!licenseResponse.ok) {
          throw new Error('Failed to generate license');
        }

        const license = await licenseResponse.json();
        item.licenseKey = license.licenseKey;
        item.deviceId = currentDeviceId;
      }

      // Start download
      setDownloads(prev => [...prev, { 
        ...item, 
        downloadStatus: 'downloading', 
        progress: 0,
        deviceId: currentDeviceId
      }]);

      // Simulate download progress
      const interval = setInterval(() => {
        setDownloads(prev => prev.map(dl => {
          if (dl.id === item.id && dl.downloadStatus === 'downloading') {
            const newProgress = (dl.progress || 0) + 10;
            if (newProgress >= 100) {
              clearInterval(interval);
              return { 
                ...dl, 
                progress: 100, 
                downloadStatus: 'completed', 
                downloadDate: new Date().toISOString() 
              };
            }
            return { ...dl, progress: newProgress };
          }
          return dl;
        }));
      }, 300);

    } catch (error) {
      console.error('Download failed:', error);
      setDownloads(prev => prev.map(dl => 
        dl.id === item.id ? { ...dl, downloadStatus: 'failed' } : dl
      ));
    }
  };

  const handlePlay = async (item: DownloadItem) => {
    // For DRM protected content, validate license
    if (item.isDRMProtected && item.licenseKey) {
      const isValid = await validateLicense(item.id, item.licenseKey);
      if (!isValid) {
        alert('This content cannot be played on this device. License validation failed.');
        return;
      }
    }

    setCurrentTrack({
      id: item.id,
      title: item.title,
      artist: item.artist,
      url: `/api/media/stream/${item.id}?deviceId=${currentDeviceId}&licenseKey=${item.licenseKey || ''}`,
      coverArt: item.coverArt,
      duration: item.duration,
      isDRMProtected: item.isDRMProtected
    });
  };

  const validateLicense = async (mediaId: string, licenseKey: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/drm/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mediaId,
          licenseKey,
          deviceId: currentDeviceId
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('License validation failed:', error);
      return false;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/user/downloads/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setDownloads(prev => {
          const updated = prev.filter(item => item.id !== id);
          const used = updated.reduce((sum, item) => sum + item.fileSize, 0);
          setStorageUsage(prev => ({ ...prev, used }));
          return updated;
        });
      }
    } catch (error) {
      console.error('Error deleting download:', error);
    }
  };

  const calculateStoragePercentage = () => {
    return Math.min(100, Math.max(0, (storageUsage.used / storageUsage.total) * 100));
  };

  const getFilteredDownloads = () => {
    switch (activeTab) {
      case 'downloaded': return downloads.filter(d => d.downloadStatus === 'completed');
      case 'suggested': return suggestions;
      case 'free': return freeDownloads;
      case 'premium': return premiumDownloads;
      default: return [...downloads, ...suggestions, ...freeDownloads];
    }
  };

  const getDRMStatus = (item: DownloadItem) => {
    if (!item.isDRMProtected) return null;
    
    const license = deviceLicenses.find(lic => 
      lic.mediaId === parseInt(item.id) && lic.deviceId === currentDeviceId && lic.isActive
    );

    if (!license) {
      return { status: 'unlicensed', color: 'text-red-400' };
    }

    if (license.expiresAt && new Date(license.expiresAt) < new Date()) {
      return { status: 'expired', color: 'text-yellow-400' };
    }

    return { 
      status: license.restrictionLevel.toLowerCase(), 
      color: 'text-green-400' 
    };
  };

  return (
    <Protected>
      <div className="bg-gradient-to-br from-[#0a3747]/95 to-[#0a1f29]/95 min-h-screen p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
              <Download className="w-6 h-6 sm:w-8 sm:h-8 text-[#e51f48]" />
              My Downloads
            </h1>
            <p className="text-sm sm:text-base text-gray-400">Access your offline music library</p>
          </div>
          
          {/* Device & Storage Info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <HardDrive className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <span className="text-xs sm:text-sm text-gray-300">
                {formatFileSize(storageUsage.used * 1024)} / {formatFileSize(storageUsage.total * 1024)}
              </span>
            </div>
            <div className="w-full sm:w-32 h-2 bg-[#0a3747] rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#e51f48] to-[#ff4d6d] rounded-full" 
                style={{ width: `${calculateStoragePercentage()}%` }}
              />
            </div>
            <button 
              onClick={() => setIsOfflineMode(!isOfflineMode)}
              className={`px-3 py-1 sm:px-4 sm:py-2 rounded-lg flex items-center gap-2 text-sm sm:text-base w-full sm:w-auto justify-center ${
                isOfflineMode 
                  ? 'bg-[#e51f48] text-white' 
                  : 'bg-[#0a3747] text-gray-300'
              }`}
            >
              <Headphones className="w-3 h-3 sm:w-4 sm:h-4" />
              {isOfflineMode ? 'Offline' : 'Online'}
            </button>
          </div>
        </div>

        {/* Device ID & DRM Status */}
        <div className="bg-[#0a3747]/50 rounded-lg p-3 sm:p-4 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-400" />
              <span className="text-xs sm:text-sm text-gray-300">
                Device: {currentDeviceId.substring(0, 8)}...
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span>Active Licenses: {deviceLicenses.filter(l => l.isActive).length}</span>
              <span>DRM Protected: {downloads.filter(d => d.isDRMProtected).length}</span>
            </div>
          </div>
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
                      ? 'text-[#e51f48] border-b-2 border-[#e51f48]'
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
          {getFilteredDownloads().length > 0 ? (
            getFilteredDownloads().map(item => {
              const drmStatus = getDRMStatus(item);
              
              return (
                <div 
                  key={item.id} 
                  className="bg-[#0a3747]/70 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all"
                >
                  <div className="relative group">
                    <Image
                      src={item.coverArt} 
                      alt={item.title} 
                      width={200}
                      height={200}
                      className="w-full h-40 sm:h-48 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/default-cover.jpg';
                      }}
                    />
                    <div className={`absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all ${
                      currentTrack?.id === item.id ? 'bg-opacity-30' : ''
                    }`}>
                      <div className="flex gap-2 sm:gap-3">
                        <button 
                          onClick={() => handlePlay(item)}
                          className="opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all"
                          disabled={item.isDRMProtected && !drmStatus}
                        >
                          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-lg ${
                            item.isDRMProtected && !drmStatus 
                              ? 'bg-gray-600 cursor-not-allowed' 
                              : 'bg-[#e51f48]'
                          }`}>
                            <Play className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                          </div>
                        </button>
                        {item.downloadStatus === 'pending' && (
                          <button 
                            onClick={() => handleDownload(item)}
                            className="opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all"
                          >
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#0a3747] border-2 border-[#e51f48] flex items-center justify-center shadow-lg">
                              <ArrowDown className="w-4 h-4 sm:w-5 sm:h-5 text-[#e51f48]" />
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
                      <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-amber-500 text-white text-xs font-medium flex items-center gap-1">
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
                  
                  <div className="p-3 sm:p-4">
                    <h3 className="font-medium text-white truncate text-sm sm:text-base">{item.title}</h3>
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
                        {item.downloadStatus === 'completed' ? (
                          <>
                            <span className="text-xs text-green-500 flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              <span className="hidden sm:inline">Downloaded</span>
                            </span>
                            <button 
                              onClick={() => handleDelete(item.id)}
                              className="text-xs text-gray-400 hover:text-[#e51f48]"
                            >
                              Delete
                            </button>
                          </>
                        ) : item.downloadStatus === 'downloading' ? (
                          <div className="w-16 sm:w-20 bg-[#0a3747] rounded-full h-1.5">
                            <div 
                              className="bg-gradient-to-r from-[#e51f48] to-[#ff4d6d] h-1.5 rounded-full" 
                              style={{ width: `${item.progress || 0}%` }}
                            />
                          </div>
                        ) : (
                          <button 
                            onClick={() => handleDownload(item)}
                            className="text-xs text-[#e51f48] hover:text-[#ff4d6d] flex items-center gap-1"
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
                  className="mt-2 sm:mt-3 text-[#e51f48] hover:text-[#ff4d6d] text-xs sm:text-sm flex items-center justify-center gap-1 mx-auto"
                >
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
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
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-[#e51f48]" />
                Smart Recommendations
              </h2>
              <button className="text-xs sm:text-sm text-[#e51f48] hover:text-[#ff4d6d]">
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
                      className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 w-6 h-6 sm:w-8 sm:h-8 bg-[#e51f48] rounded-full flex items-center justify-center shadow-lg hover:bg-[#ff4d6d] transition-colors"
                    >
                      <ArrowDown className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                    </button>
                  </div>
                  <h3 className="font-medium text-white truncate text-xs sm:text-sm">{item.title}</h3>
                  <p className="text-xs text-gray-400 truncate">{item.artist}</p>
                  <div className="mt-1 sm:mt-2 flex justify-between items-center text-xs text-gray-500">
                    <span>{formatDuration(item.duration)}</span>
                    <span>{formatFileSize(item.fileSize * 1024)}</span>
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
              <ArrowDown className="w-4 h-4 sm:w-5 sm:h-5 text-[#e51f48]" />
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
                        className="bg-gradient-to-r from-[#e51f48] to-[#ff4d6d] h-full rounded-full" 
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
    </Protected>
  );
}