"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Heart, Plus, Download, Disc, ListMusic, History, Folder, Trash2, Edit2, MoreVertical, Share2, ListPlus } from 'lucide-react';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import Waveform from '@/components/Waveform';
import ScrollingTrackTitle from '@/components/ScrollingTrackTitle';
import { createMediaSlug, formatDuration } from '@/lib/utils';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import ShareModal from '@/components/ShareModal';
import {
  listPrivateDownloads,
  readPrivateDownload,
  updatePrivateDownloadMetadata,
  type PrivateDownload,
} from '@/lib/privateDownloads';

let activeLibraryDownloadUrl: string | null = null;

interface MediaFile {
  id: number | string;
  title: string;
  artist: string;
  url: string;
  duration: number;
  coverArt: string;
  views: number;
  playCount?: number;
  shareCount?: number;
  likes: number;
  genre?: string;
  liked?: boolean;
  privateRecord?: PrivateDownload;
}

interface Playlist {
  id: number;
  name: string;
  description: string;
  coverArt: string;
  trackCount: number;
  duration: number;
}

function mapMedia(item: any): MediaFile {
  return {
    id: item.id,
    title: item.title || 'Untitled',
    artist: item.artist || 'Unknown Artist',
    url: item.url || item.audioUrl || '',
    duration: item.duration || 0,
    coverArt: item.coverArt || item.artCoverUrl || item.thumbnailUrl || '/default-cover.jpg',
    views: item.views || item.playCount || 0,
    playCount: item.playCount || item.views || 0,
    shareCount: item.shareCount || 0,
    likes: item.likes || 0,
    genre: item.genre || 'Other',
    liked: Boolean(item.liked),
  };
}

function mapPlaylist(item: any): Playlist {
  return {
    id: item.id,
    name: item.name || 'Untitled Playlist',
    description: item.description || 'Your playlist',
    coverArt: item.coverUrl || '/playlists/default.jpg',
    trackCount: Array.isArray(item.entries) ? item.entries.length : 0,
    duration: Array.isArray(item.entries)
      ? item.entries.reduce((sum: number, entry: any) => sum + (entry.media?.duration || 0), 0)
      : 0,
  };
}

export default function LibraryPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [likedSongs, setLikedSongs] = useState<MediaFile[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<MediaFile[]>([]);
  const [downloadedSongs, setDownloadedSongs] = useState<MediaFile[]>([]);
  const [db, setDb] = useState<IDBDatabase | null>(null);
  const [activeTab, setActiveTab] = useState<'playlists' | 'liked' | 'recent' | 'downloaded'>('playlists');
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [shareItem, setShareItem] = useState<MediaFile | null>(null);
  const [createName, setCreateName] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createCover, setCreateCover] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);
  const { currentTrack, isPlaying, togglePlay, playTrack } = useAudioPlayer();
  const { getToken, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await getToken();
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const mediaResponse = await fetch('/api/media', { credentials: 'include' });
        const mediaJson = await mediaResponse.json();
        const mediaArray: any[] = Array.isArray(mediaJson)
          ? mediaJson
          : Array.isArray(mediaJson.data)
          ? mediaJson.data
          : [];
        const formattedData: MediaFile[] = mediaArray.map(mapMedia);

        if (token) {
          try {
            const [playlistRes, likedRes, recentRes] = await Promise.all([
              fetch('/api/user/me/playlists', { headers }),
              fetch('/api/user/me/liked', { headers }),
              fetch('/api/user/me/recent', { headers }),
            ]);

            const [playlistJson, likedJson, recentJson] = await Promise.all([
              playlistRes.ok ? playlistRes.json() : Promise.resolve([]),
              likedRes.ok ? likedRes.json() : Promise.resolve([]),
              recentRes.ok ? recentRes.json() : Promise.resolve([]),
            ]);

            setPlaylists(Array.isArray(playlistJson) ? playlistJson.map(mapPlaylist) : []);
            setLikedSongs(
              Array.isArray(likedJson)
                ? likedJson.map((item: any) => mapMedia(item.media))
                : []
            );
            setRecentlyPlayed(
              Array.isArray(recentJson)
                ? recentJson.map((item: any) => mapMedia(item.media))
                : []
            );
          } catch (innerErr) {
            console.warn('Could not fetch user-specific library data:', innerErr);
          }
        }

        if (!token) {
          setPlaylists([]);
          setLikedSongs(formattedData.filter((item: MediaFile) => item.liked).slice(0, 8));
          setRecentlyPlayed([...formattedData].sort((a, b) => b.views - a.views).slice(0, 8));
        }
      } catch (err) {
        console.error('Fetch error:', err);
      }
    };

    fetchData();
    initDB();
  }, [getToken]);

  useEffect(() => {
    if (!db) return;
    const refresh = () => void loadDownloadedFiles(db);
    refresh();
    const channel = 'BroadcastChannel' in window ? new BroadcastChannel('fwaya') : null;
    if (channel) {
      channel.onmessage = (event) => {
        if (event.data?.type === 'media-downloaded' || event.data?.type === 'media-removed') refresh();
      };
    }
    window.addEventListener('focus', refresh);
    return () => {
      channel?.close();
      window.removeEventListener('focus', refresh);
    };
  }, [db, user?.id]);

  const getKey = async (deviceId: string): Promise<CryptoKey> => {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(deviceId),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode('fwaya-salt'),
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  };

  const initDB = () => {
    const request = indexedDB.open('fwayaMusic', 2);
    request.onupgradeneeded = (e: IDBVersionChangeEvent) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('downloads')) {
        db.createObjectStore('downloads');
      }
      if (!db.objectStoreNames.contains('downloadMetadata')) {
        const store = db.createObjectStore('downloadMetadata', { keyPath: 'id' });
        store.createIndex('title', 'title', { unique: false });
        store.createIndex('artist', 'artist', { unique: false });
      }
    };
    request.onsuccess = (e: Event) => {
      setDb((e.target as IDBOpenDBRequest).result);
      loadDownloadedFiles((e.target as IDBOpenDBRequest).result);
    };
  };

  const loadDownloadedFiles = async (database: IDBDatabase) => {
    const transaction = database.transaction(['downloadMetadata'], 'readonly');
    const store = transaction.objectStore('downloadMetadata');
    const request = store.getAll();
    request.onsuccess = () => {
      const files = request.result as MediaFile[];
      void listPrivateDownloads(user?.id ?? -1).then((privateDownloads) => {
        const privateFiles: MediaFile[] = privateDownloads.map((record) => ({
          id: Number(record.mediaId) || record.mediaId,
          title: record.title,
          artist: record.artist,
          url: '',
          duration: record.duration,
          coverArt: record.coverArt,
          views: record.playCount || 0,
          playCount: record.playCount || 0,
          likes: record.likes || 0,
          shareCount: record.shareCount || 0,
          liked: Boolean(record.liked),
          privateRecord: record,
        }));
        const privateIds = new Set(privateFiles.map((file) => String(file.id)));
        const legacyFiles = files.filter((file) => !privateIds.has(String(file.id)));
        setDownloadedSongs([...privateFiles, ...legacyFiles]);
      }).catch((error) => {
        console.error('Could not load Fwaya private downloads into the library:', error);
        setDownloadedSongs(files);
      });
    };
  };

  const handlePlay = async (file: MediaFile) => {
    if (String(currentTrack?.id) === String(file.privateRecord?.mediaId || file.id)) {
      togglePlay();
      return;
    }

    if (file.privateRecord) {
      try {
        const audio = await readPrivateDownload(file.privateRecord);
        if (activeLibraryDownloadUrl) URL.revokeObjectURL(activeLibraryDownloadUrl);
        const audioUrl = URL.createObjectURL(audio);
        activeLibraryDownloadUrl = audioUrl;
        playTrack({
          id: file.privateRecord.mediaId,
          title: file.title,
          artist: file.artist,
          audioUrl,
          imageUrl: file.coverArt,
          duration: file.duration,
          type: 'AUDIO',
          accessType: 'FREE',
        });
      } catch (error) {
        console.error('Could not play private library download:', error);
        alert(error instanceof Error ? error.message : 'This download could not be played.');
      }
      return;
    }

    if (!db) {
      playTrack({
        id: file.id,
        title: file.title,
        artist: file.artist,
        audioUrl: file.url,
        url: file.url,
        coverArt: file.coverArt,
        duration: file.duration,
      });
      return;
    }

    const transaction = db.transaction(['downloads'], 'readonly');
    const store = transaction.objectStore('downloads');
    const request = store.get(file.id);

    request.onsuccess = async (e: Event) => {
      const result = (e.target as IDBRequest).result;
      if (!result) {
        playTrack({
          id: file.id,
          title: file.title,
          artist: file.artist,
          audioUrl: file.url,
          url: file.url,
          coverArt: file.coverArt,
          duration: file.duration,
        });
        return;
      }

      const { encrypted, iv } = result;
      const deviceId = localStorage.getItem('deviceId') || 'web-browser';
      const key = await getKey(deviceId);

      try {
        const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted);
        const decryptedBlob = new Blob([decrypted], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(decryptedBlob);
        playTrack({
          id: file.id,
          title: file.title,
          artist: file.artist,
          audioUrl: url,
          url,
          coverArt: file.coverArt,
          duration: file.duration,
        });
      } catch (error) {
        console.error('Decryption failed', error);
        playTrack({
          id: file.id,
          title: file.title,
          artist: file.artist,
          audioUrl: file.url,
          url: file.url,
          coverArt: file.coverArt,
          duration: file.duration,
        });
      }
    };
  };

  const handleDownloadedLike = async (file: MediaFile) => {
    try {
      const token = await getToken();
      if (!token) {
        router.push('/auth/user/signin');
        return;
      }
      const response = await fetch(`/api/media/${encodeURIComponent(file.privateRecord?.mediaId || file.id)}/interact/like`, {
        method: 'POST',
        credentials: 'include',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message || payload.error || 'Could not update your like.');
      }
      const payload = await response.json().catch(() => ({}));
      const liked = typeof payload.liked === 'boolean' ? payload.liked : !file.liked;
      const likes = typeof payload.likes === 'number'
        ? payload.likes
        : Math.max(0, file.likes + (liked ? 1 : -1));
      if (file.privateRecord) {
        await updatePrivateDownloadMetadata(file.privateRecord.id, {
          likes,
          liked,
          playCount: file.playCount || 0,
          shareCount: file.shareCount || 0,
        });
      }
      setDownloadedSongs((items) => items.map((item) =>
        String(item.id) === String(file.id) ? { ...item, liked, likes } : item
      ));
    } catch (error) {
      console.error('Could not like downloaded library track:', error);
      alert(error instanceof Error ? error.message : 'Could not update your like.');
    }
  };

  const handleAddDownloadedToPlaylist = (file: MediaFile) => {
    if (!user) {
      router.push('/auth/user/signin');
      return;
    }
    window.dispatchEvent(new CustomEvent('fwaya:open-playlist-picker', {
      detail: { mediaId: Number(file.privateRecord?.mediaId || file.id) },
    }));
  };

  const handleShareDownloaded = async () => {
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
    setDownloadedSongs((items) => items.map((item) =>
      String(item.id) === String(shareItem.id) ? { ...item, shareCount } : item
    ));
    setShareItem((item) => item ? { ...item, shareCount } : null);
  };

  const handleCreatePlaylist = async () => {
    setShowCreateModal(true);
  };

  const submitCreatePlaylist = async () => {
    if (!createName.trim()) return alert('Enter a name');
    const token = await getToken();
    if (!token) return alert('Please sign in to create a playlist.');

    setCreating(true);
    try {
      let response: Response;
      if (createCover) {
        const fd = new FormData();
        fd.append('name', createName.trim());
        fd.append('description', createDescription || '');
        fd.append('isPublic', 'false');
        fd.append('cover', createCover);

        response = await fetch('/api/playlists', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
      } else {
        response = await fetch('/api/playlists', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ name: createName.trim(), description: createDescription || '', isPublic: false }),
        });
      }

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.message || 'Failed to create playlist');
      }

      const data = await response.json();
      setPlaylists((prev) => [mapPlaylist(data), ...prev]);
      setShowCreateModal(false);
      setCreateName('');
      setCreateDescription('');
      setCreateCover(null);
    } catch (err) {
      console.error('Playlist creation failed', err);
      alert('Could not create playlist. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeletePlaylist = async (playlistId: number) => {
    if (!window.confirm('Are you sure you want to delete this playlist?')) return;

    const token = await getToken();
    if (!token) {
      alert('Please sign in to delete playlists.');
      return;
    }

    try {
      const response = await fetch(`/api/playlists/${playlistId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to delete playlist' }));
        throw new Error(error.message || 'Failed to delete playlist');
      }

      setPlaylists((prev) => prev.filter((p) => p.id !== playlistId));
    } catch (err) {
      console.error('Playlist deletion failed', err);
      alert('Could not delete playlist. Please try again.');
    }
  };

  const handleRenamePlaylist = (playlist: Playlist) => {
    setEditingPlaylist(playlist);
    setEditName(playlist.name);
    setEditDescription(playlist.description);
    setShowEditModal(true);
  };

  const handleSavePlaylistEdit = async () => {
    if (!editingPlaylist || !editName.trim()) return;

    const token = await getToken();
    if (!token) {
      alert('Please sign in to edit playlists.');
      return;
    }

    try {
      const response = await fetch(`/api/playlists/${editingPlaylist.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: editName, description: editDescription }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to update playlist' }));
        throw new Error(error.message || 'Failed to update playlist');
      }

      const data = await response.json();
      setPlaylists((prev) =>
        prev.map((p) => (p.id === editingPlaylist.id ? mapPlaylist(data) : p))
      );
      setShowEditModal(false);
      setEditingPlaylist(null);
    } catch (err) {
      console.error('Playlist update failed', err);
      alert('Could not update playlist. Please try again.');
    }
  };

  const getContent = () => {
    switch (activeTab) {
      case 'playlists':
        return playlists;
      case 'liked':
        return likedSongs;
      case 'recent':
        return recentlyPlayed;
      case 'downloaded':
        return downloadedSongs;
      default:
        return [];
    }
  };

  const getTitle = () => {
    switch (activeTab) {
      case 'playlists':
        return 'Playlists';
      case 'liked':
        return 'Liked Songs';
      case 'recent':
        return 'Recently Played';
      case 'downloaded':
        return 'Downloads';
      default:
        return 'Library';
    }
  };

  const getIcon = () => {
    switch (activeTab) {
      case 'playlists':
        return <ListMusic className="w-6 h-6" />;
      case 'liked':
        return <Heart className="w-6 h-6" />;
      case 'recent':
        return <History className="w-6 h-6" />;
      case 'downloaded':
        return <Download className="w-6 h-6" />;
      default:
        return <Folder className="w-6 h-6" />;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="relative overflow-hidden">
        <div className="relative p-6 max-w-7xl mx-auto pb-32">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between mb-10">
            <div className="space-y-3">
              <p className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-1 text-xs uppercase tracking-[0.24em] text-purple-300">Library</p>
              <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">Organize your tracks, playlists, and downloads.</h1>
              <p className="max-w-2xl text-gray-400">We are glad to have you on board.</p>
            </div>
            <button
              onClick={handleCreatePlaylist}
              className="inline-flex items-center gap-2 rounded-full bg-purple-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition hover:bg-purple-400"
            >
              <Plus className="w-4 h-4" />
              New Playlist
            </button>
          </div>

          <div className="flex flex-wrap gap-3 mb-10">
            {[
              { id: 'playlists', label: 'Playlists', icon: <ListMusic className="w-4 h-4" /> },
              { id: 'liked', label: 'Liked Songs', icon: <Heart className="w-4 h-4" /> },
              { id: 'recent', label: 'Recently Played', icon: <History className="w-4 h-4" /> },
              { id: 'downloaded', label: 'Downloads', icon: <Download className="w-4 h-4" /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'playlists' | 'liked' | 'recent' | 'downloaded')}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeTab === tab.id
                    ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/15'
                    : 'bg-white/10 text-gray-300 hover:bg-white/15'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          <div className="grid gap-6">
            <div className="flex items-center gap-3 text-sm text-gray-400 mb-4">
              <span className="inline-flex h-2 w-2 rounded-full bg-purple-400" />
              <span>{getTitle()}</span>
              <span className="text-white/70">({getContent().length})</span>
            </div>

            {activeTab === 'playlists' ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {(getContent() as Playlist[]).map((playlist) => (
                  <div
                    key={playlist.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => router.push(`/playlist/${playlist.id}`)}
                    className="group overflow-hidden rounded-[32px] bg-black transition hover:bg-white/5 flex flex-col cursor-pointer"
                  >
                    <div className="relative overflow-hidden flex-1">
                      <Image
                        src={playlist.coverArt}
                        alt={playlist.name}
                        width={480}
                        height={320}
                        className="h-44 w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/default-cover.jpg';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                      <div className="absolute inset-0 flex items-center justify-between p-4 opacity-0 transition group-hover:opacity-100">
                        <button
                          className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-purple-600 text-white shadow-lg shadow-purple-500/30 hover:bg-purple-500 transition"
                          onClick={(e) => { e.stopPropagation(); playTrack({
                            id: playlist.id,
                            title: playlist.name,
                            artist: playlist.description,
                            audioUrl: playlist.coverArt,
                            url: playlist.coverArt,
                            coverArt: playlist.coverArt,
                            duration: playlist.duration,
                          }); }}
                        >
                          <Play className="w-5 h-5" />
                        </button>
                        <div className="flex gap-2">
                          <button
                            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-purple-600/80 text-white hover:bg-purple-500 transition"
                            onClick={(e) => { e.stopPropagation(); handleRenamePlaylist(playlist); }}
                            title="Edit playlist"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-red-600/80 text-white hover:bg-red-500 transition"
                            onClick={(e) => { e.stopPropagation(); handleDeletePlaylist(playlist.id); }}
                            title="Delete playlist"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 p-5">
                      <div className="text-xs uppercase tracking-[0.24em] text-purple-300">Playlist</div>
                      <h3 className="text-lg font-semibold text-white truncate">{playlist.name}</h3>
                      <p className="text-sm text-gray-400 line-clamp-2">{playlist.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500 pt-3">
                        <span>{playlist.trackCount} tracks</span>
                        <span>{formatDuration(playlist.duration)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {(getContent() as MediaFile[]).map((file) => (
                  <div key={file.id} className="grid gap-4 rounded-[32px] bg-black p-5 transition hover:bg-white/5">
                    <div className="relative overflow-hidden rounded-3xl bg-[#0d0c14]">
                      <Image
                        src={file.coverArt}
                        alt={file.title}
                        width={640}
                        height={400}
                        className="h-44 w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/default-cover.jpg';
                        }}
                      />
                      <button
                        onClick={() => handlePlay(file)}
                        className="absolute right-4 bottom-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-purple-600 text-white shadow-lg shadow-purple-500/25 transition hover:bg-purple-500"
                      >
                        {String(currentTrack?.id) === String(file.privateRecord?.mediaId || file.id) && isPlaying ? (
                          <Waveform playing className="h-5 w-5" />
                        ) : (
                          <Play className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <ScrollingTrackTitle isPlaying={String(currentTrack?.id) === String(file.privateRecord?.mediaId || file.id) && isPlaying} className="text-lg font-semibold text-white">{file.title}</ScrollingTrackTitle>
                          <p className="text-sm text-gray-400 truncate">{file.artist}</p>
                        </div>
                        {activeTab === 'downloaded' && (
                          <button
                            onClick={() => void handleDownloadedLike(file)}
                            aria-label={`${file.liked ? 'Unlike' : 'Like'} ${file.title}`}
                            className={`rounded-full bg-[#15121f] px-3 py-2 text-sm transition hover:bg-purple-600/20 ${file.liked ? 'text-purple-400' : 'text-white/70'}`}
                          >
                            <Heart className="w-4 h-4" fill={file.liked ? 'currentColor' : 'none'} />
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                        <span>{formatDuration(file.duration)}</span>
                        <span className="inline-flex items-center gap-2 rounded-full bg-[#15121f] px-3 py-1 text-xs text-white/80">
                          <Disc className="w-4 h-4 text-purple-300" />
                          {file.genre || 'Genre'}
                        </span>
                        {activeTab === 'downloaded' && (
                          <>
                            <span>{file.playCount || file.views || 0} plays</span>
                            <span>{file.likes} likes</span>
                            <span>{file.shareCount || 0} shares</span>
                          </>
                        )}
                      </div>
                      {activeTab === 'downloaded' && (
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => handleAddDownloadedToPlaylist(file)}
                            className="inline-flex items-center gap-2 rounded-full bg-purple-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-purple-500"
                          >
                            <ListPlus className="h-4 w-4" />
                            Add to playlist
                          </button>
                          <button
                            onClick={() => setShareItem(file)}
                            className="inline-flex items-center gap-2 rounded-full bg-[#15121f] px-3 py-2 text-xs font-semibold text-white transition hover:bg-purple-600/30"
                          >
                            <Share2 className="h-4 w-4" />
                            Share
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {getContent().length === 0 && (
              <div className="rounded-[32px] bg-black p-10 text-center text-gray-400">
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-purple-500 text-white shadow-lg shadow-purple-500/20 mx-auto">
                  {getIcon()}
                </div>
                <h3 className="text-2xl font-semibold text-white mb-2">No {getTitle().toLowerCase()} yet</h3>
                <p className="max-w-xl mx-auto text-sm text-gray-400">
                  {activeTab === 'liked' && 'Like some songs to see them here.'}
                  {activeTab === 'recent' && 'Play some music to build your history.'}
                  {activeTab === 'downloaded' && 'Download songs for offline listening.'}
                  {activeTab === 'playlists' && 'Create your first playlist to get started.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Playlist Modal */}
      <AnimatePresence>
        {showEditModal && editingPlaylist && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-black rounded-2xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-semibold text-white mb-6">Edit Playlist</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Playlist Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-4 py-2 bg-[#262626] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter playlist name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full px-4 py-2 bg-[#262626] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none h-24"
                    placeholder="Enter playlist description"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePlaylistEdit}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors font-medium"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
        {/* Create Playlist Modal */}
        <AnimatePresence>
          {showCreateModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowCreateModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-[#0a0a0d] rounded-2xl p-6 w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-2xl font-semibold text-white mb-4">Create Playlist</h2>
                <div className="space-y-3">
                  <input
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder="Playlist name"
                    className="w-full px-4 py-2 bg-[#15121f] border border-white/10 rounded-lg text-white placeholder-gray-500"
                  />
                  <textarea
                    value={createDescription}
                    onChange={(e) => setCreateDescription(e.target.value)}
                    placeholder="Description (optional)"
                    className="w-full px-4 py-2 bg-[#15121f] border border-white/10 rounded-lg text-white placeholder-gray-500 resize-none h-24"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCreateCover(e.target.files ? e.target.files[0] : null)}
                    className="w-full text-sm text-slate-300"
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitCreatePlaylist}
                    disabled={creating}
                    className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg"
                  >
                    {creating ? 'Creating...' : 'Create Playlist'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        {shareItem && (
          <ShareModal
            open
            onClose={() => setShareItem(null)}
            title={shareItem.title}
            artist={shareItem.artist}
            coverUrl={shareItem.coverArt}
            url={`${window.location.origin}/track/${createMediaSlug(shareItem.title, shareItem.privateRecord?.mediaId || shareItem.id)}`}
            onShare={() => void handleShareDownloaded()}
          />
        )}
    </div>
  );
}
