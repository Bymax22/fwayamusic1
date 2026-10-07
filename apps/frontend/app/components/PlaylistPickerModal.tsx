"use client";

import { useEffect, useState } from 'react';
import { ListMusic, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { compressCoverImage } from '@/lib/compressCoverImage';

interface PlaylistItem {
  id: number;
  name: string;
  mediaCount?: number;
  coverUrl?: string;
}

interface PlaylistPickerModalProps {
  open: boolean;
  mediaId: number;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function PlaylistPickerModal({ open, mediaId, onClose, onSuccess }: PlaylistPickerModalProps) {
  const { user, getToken } = useAuth();
  const router = useRouter();
  const [playlists, setPlaylists] = useState<PlaylistItem[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCover, setNewCover] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showSuccess = (message: string, playlistId: number) => {
    onSuccess?.();
    onClose();
    toast.custom((toastItem) => (
      <div role="status" className="flex items-center gap-4 rounded-xl bg-background px-4 py-3 text-sm text-white shadow-xl ring-1 ring-white/10">
        <span>{message}</span>
        <button
          type="button"
          onClick={() => {
            toast.dismiss(toastItem.id);
            router.push(`/playlist/${playlistId}`);
          }}
          className="shrink-0 font-medium text-purple/45 transition hover:text-purple/30"
        >
          View playlist
        </button>
      </div>
    ), { duration: 6000 });
  };

  useEffect(() => {
    if (!open) return;

    const loadPlaylists = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = await getToken();
        if (!token) {
          throw new Error('Please sign in to manage playlists.');
        }

        const response = await fetch('/api/user/me/playlists', {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Unable to load playlists.');
        }

        const result = await response.json();
        const items = Array.isArray(result)
          ? result
          : Array.isArray(result.playlists)
          ? result.playlists
          : [];

        setPlaylists(
          items.map((playlist: any) => ({
            id: Number(playlist.id),
            name: playlist.name || playlist.title || 'Untitled Playlist',
            mediaCount: Array.isArray(playlist.entries)
              ? playlist.entries.length
              : playlist.mediaCount ?? playlist._count?.entries ?? playlist._count?.media ?? 0,
            coverUrl: playlist.coverUrl || playlist.coverImage || '/playlists/default.jpg',
          })),
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load playlists');
      } finally {
        setLoading(false);
      }
    };

    void loadPlaylists();
  }, [open, getToken]);

  const addMediaToPlaylist = async (playlistId: number, token: string) => {
    if (!user) throw new Error('Please sign in before adding media to a playlist.');

    const response = await fetch(`/api/playlists/${playlistId}/media`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ mediaId, userId: user.id }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || 'Failed to add item to playlist.');
    }
  };

  const handleAddToPlaylist = async (playlistId: number) => {
    if (!user) {
      setError('Please sign in before adding media to a playlist.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) throw new Error('Session expired. Please sign in again.');
      await addMediaToPlaylist(playlistId, token);
      const playlistName = playlists.find((playlist) => playlist.id === playlistId)?.name;
      showSuccess(playlistName ? `Added to ${playlistName}` : 'Added to playlist', playlistId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add to playlist.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreatePlaylist = async () => {
    if (!user) {
      setError('Sign in to create playlists.');
      return;
    }

    if (!newName.trim()) {
      setError('Please enter a playlist name.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Session expired');

      let coverUrl: string | undefined;
      if (newCover) {
        const compressedCover = await compressCoverImage(newCover);
        const cloudinaryFormData = new FormData();
        cloudinaryFormData.append('file', compressedCover);
        cloudinaryFormData.append('upload_preset', 'bymaxdev1');
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dayn5vifn';
        const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: 'POST',
          body: cloudinaryFormData,
        });
        const uploadData = await uploadResponse.json().catch(() => null);
        if (!uploadResponse.ok || !uploadData?.secure_url) {
          throw new Error(uploadData?.error?.message || 'Failed to upload playlist cover.');
        }
        coverUrl = uploadData.secure_url;
      }

      const response = await fetch('/api/playlists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newName.trim(),
          isPublic: false,
          ...(coverUrl ? { coverUrl } : {}),
        }),
      });

      if (!response.ok) {
        let message = 'Failed to create playlist';
        try {
          const data = await response.json();
          message = data?.message || JSON.stringify(data) || message;
        } catch (e) {
          try { const txt = await response.text(); if (txt) message = txt; } catch (_) {}
        }
        throw new Error(message);
      }

      const created = await response.json();
      const item = {
        id: Number(created.id || created.playlistId || created.data?.id),
        name: created.name || created.title || newName.trim(),
        mediaCount: 0,
        coverUrl: created.coverUrl || created.cover || '/playlists/default.jpg',
      } as PlaylistItem;

      setPlaylists((prev) => [item, ...prev]);
      setShowCreate(false);
      setNewName('');
      setNewCover(null);

      let mediaAdded = false;
      try {
        await addMediaToPlaylist(item.id, token);
        mediaAdded = true;
      } catch {
        // The playlist was created even if adding the selected media failed.
      }

      showSuccess(
        mediaAdded ? 'Playlist created and track added' : 'Playlist created, but the track could not be added',
        item.id,
      );
      // Broadcast update so other open pages can refresh
      try {
        if (typeof BroadcastChannel !== 'undefined') {
          const bc = new BroadcastChannel('fwaya');
          bc.postMessage({ type: 'playlists-updated', playlist: item });
          bc.close();
        }
      } catch (e) {}
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('fwaya:message', JSON.stringify({ type: 'playlists-updated', playlist: item, ts: Date.now() }));
        }
      } catch (e) {}
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create playlist');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/65 p-4">
      <div className="w-full max-w-md rounded-3xl bg-background p-6 shadow-2xl shadow-black/40">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Add to Playlist</h2>
            <p className="text-sm text-white/60">Choose one of your playlists to save this item.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white/90 transition hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="rounded-3xl bg-background p-8 text-center text-sm text-white/60">Loading playlists...</div>
        ) : error ? (
          <div className="rounded-3xl bg-background p-4 text-sm text-purple/45">{error}</div>
        ) : (
          <div className="space-y-3 max-h-72 overflow-y-auto">
            {/* Always offer create UI */}
            <div>
              <button
                type="button"
                onClick={() => setShowCreate((s) => !s)}
                className="w-full flex items-center gap-3 rounded-2xl bg-white/5 p-3 text-left transition hover:bg-white/10"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple/85 text-white">+</div>
                <div className="min-w-0">
                  <p className="font-medium text-white">Create new playlist</p>
                  <p className="text-sm text-white/60">Create a playlist and add this item</p>
                </div>
              </button>

              {showCreate && (
                <div className="mt-3 space-y-2">
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Playlist name"
                    className="w-full rounded-lg bg-background px-3 py-2 text-white"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setNewCover(e.target.files ? e.target.files[0] : null)}
                    className="w-full text-sm text-white/90"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleCreatePlaylist}
                      disabled={submitting}
                      className="flex-1 rounded-full bg-purple/85 px-4 py-2 text-white"
                    >
                      {submitting ? 'Creating...' : 'Create and add'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowCreate(false); setNewName(''); setNewCover(null); }}
                      className="rounded-full bg-white/5 px-4 py-2 text-white"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {playlists.length === 0 && (
              <div className="rounded-3xl bg-background p-6 text-center text-sm text-white/60">
                You don't have any playlists yet. Use the form above to create one.
              </div>
            )}

            {playlists.map((playlist) => (
              <button
                key={playlist.id}
                type="button"
                onClick={() => handleAddToPlaylist(playlist.id)}
                disabled={submitting}
                className="w-full flex items-center gap-3 rounded-2xl bg-white/5 p-3 text-left transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple/85 text-white">
                  <ListMusic className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-white truncate">{playlist.name}</p>
                  <p className="text-sm text-white/60">{playlist.mediaCount ?? 0} tracks</p>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="mt-5 text-right">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
