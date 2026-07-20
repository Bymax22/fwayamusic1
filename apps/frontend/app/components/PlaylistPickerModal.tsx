"use client";

import { useEffect, useState } from 'react';
import { ListMusic, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

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
  const [playlists, setPlaylists] = useState<PlaylistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
            mediaCount: playlist.mediaCount ?? playlist._count?.media ?? 0,
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

  const handleAddToPlaylist = async (playlistId: number) => {
    if (!user) {
      setError('Please sign in before adding media to a playlist.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Session expired. Please sign in again.');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/playlists/${playlistId}/media`, {
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

      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add to playlist.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#08090f] p-6 shadow-2xl shadow-black/40">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Add to Playlist</h2>
            <p className="text-sm text-slate-400">Choose one of your playlists to save this item.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-slate-300 transition hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="rounded-3xl bg-[#0d1120] p-8 text-center text-sm text-slate-400">Loading playlists...</div>
        ) : error ? (
          <div className="rounded-3xl bg-[#0d1120] p-4 text-sm text-red-300">{error}</div>
        ) : playlists.length === 0 ? (
          <div className="rounded-3xl bg-[#0d1120] p-8 text-center text-sm text-slate-400">
            No playlists found. Create one first on the library page.
          </div>
        ) : (
          <div className="space-y-3 max-h-72 overflow-y-auto">
            {playlists.map((playlist) => (
              <button
                key={playlist.id}
                type="button"
                onClick={() => handleAddToPlaylist(playlist.id)}
                disabled={submitting}
                className="w-full flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-left transition hover:border-purple-500/40 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-600 text-white">
                  <ListMusic className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-white truncate">{playlist.name}</p>
                  <p className="text-sm text-slate-400">{playlist.mediaCount ?? 0} tracks</p>
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
