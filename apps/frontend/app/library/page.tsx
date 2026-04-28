"use client";
import { useEffect, useState } from 'react';
import { Play, Heart, Plus, Download, Disc, ListMusic, History, Folder } from 'lucide-react';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { formatDuration } from '@/lib/utils';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';

interface MediaFile {
  id: number;
  title: string;
  artist: string;
  url: string;
  duration: number;
  coverArt: string;
  views: number;
  likes: number;
  genre?: string;
  liked?: boolean;
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
    url: item.url,
    duration: item.duration || 0,
    coverArt: item.coverArt || '/default-cover.jpg',
    views: item.views || 0,
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
  const { currentTrack, togglePlay, playTrack } = useAudioPlayer();
  const { getToken } = useAuth();

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

  const loadDownloadedFiles = (database: IDBDatabase) => {
    const transaction = database.transaction(['downloadMetadata'], 'readonly');
    const store = transaction.objectStore('downloadMetadata');
    const request = store.getAll();
    request.onsuccess = () => {
      const files = request.result as MediaFile[];
      setDownloadedSongs(files);
    };
  };

  const handlePlay = async (file: MediaFile) => {
    if (currentTrack?.id === file.id) {
      togglePlay();
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

  const handleCreatePlaylist = async () => {
    const name = prompt('Enter playlist name:');
    if (!name) return;

    const description = prompt('Enter playlist description:') || 'Created from your library';
    const token = await getToken();
    if (!token) {
      alert('Please sign in to create a playlist.');
      return;
    }

    try {
      const response = await fetch('/api/playlists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, description, isPublic: false }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to create playlist' }));
        throw new Error(error.message || 'Failed to create playlist');
      }

      const data = await response.json();
      setPlaylists((prev) => [mapPlaylist(data), ...prev]);
    } catch (err) {
      console.error('Playlist creation failed', err);
      alert('Could not create playlist. Please try again.');
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
    <div className="min-h-screen bg-[#020206] text-white">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(120,63,255,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(94,43,255,0.14),_transparent_30%)] pointer-events-none" />
        <div className="relative p-6 max-w-7xl mx-auto pb-32">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between mb-10">
            <div className="space-y-3">
              <p className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-1 text-xs uppercase tracking-[0.24em] text-purple-300">Library</p>
              <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">Organize your tracks, playlists, and downloads.</h1>
              <p className="max-w-2xl text-gray-400">A polished library view with soft purple light, real backend playlists, and no sharp borders in the library experience.</p>
            </div>
            <button
              onClick={handleCreatePlaylist}
              className="inline-flex items-center gap-2 rounded-full bg-purple-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition hover:bg-purple-500"
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
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/15'
                    : 'bg-[#11101d] text-gray-300 hover:bg-[#1f173d]'
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
                  <div key={playlist.id} className="group overflow-hidden rounded-[32px] bg-[#09080f]/85 shadow-[0_25px_80px_-40px_rgba(118,86,255,0.45)] transition hover:bg-[#12101d]/95">
                    <div className="relative overflow-hidden">
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
                      <button
                        className="absolute bottom-4 right-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-purple-600 text-white shadow-lg shadow-purple-500/30 opacity-0 transition group-hover:opacity-100"
                        onClick={() =>
                          playTrack({
                            id: playlist.id,
                            title: playlist.name,
                            artist: playlist.description,
                            audioUrl: playlist.coverArt,
                            url: playlist.coverArt,
                            coverArt: playlist.coverArt,
                            duration: playlist.duration,
                          })
                        }
                      >
                        <Play className="w-5 h-5" />
                      </button>
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
                  <div key={file.id} className="grid gap-4 rounded-[32px] bg-[#09080f]/85 p-5 shadow-[0_25px_80px_-40px_rgba(118,86,255,0.45)] transition hover:bg-[#12101d]/95">
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
                        <Play className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <h3 className="text-lg font-semibold text-white truncate">{file.title}</h3>
                          <p className="text-sm text-gray-400 truncate">{file.artist}</p>
                        </div>
                        <button className="rounded-full bg-[#15121f] px-3 py-2 text-sm text-white/90 transition hover:bg-purple-600/20">
                          <Heart className="w-4 h-4 text-purple-300" />
                        </button>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                        <span>{formatDuration(file.duration)}</span>
                        <span className="inline-flex items-center gap-2 rounded-full bg-[#15121f] px-3 py-1 text-xs text-white/80">
                          <Disc className="w-4 h-4 text-purple-300" />
                          {file.genre || 'Genre'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {getContent().length === 0 && (
              <div className="rounded-[32px] bg-[#09080f]/85 p-10 text-center text-gray-400 shadow-[0_25px_80px_-40px_rgba(118,86,255,0.35)]">
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-purple-600 text-white shadow-lg shadow-purple-500/30 mx-auto">
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
    </div>
  );
}
