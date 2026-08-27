"use client";

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Pause, Heart, Share2, Plus } from 'lucide-react';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import PlaylistPickerModal from '@/components/PlaylistPickerModal';

interface AlbumDetailClientProps {
  album: any;
}

export default function AlbumDetailClient({ album }: AlbumDetailClientProps) {
  const { setQueue, togglePlay, isPlaying, currentTrack } = useAudioPlayer();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedMediaId, setSelectedMediaId] = useState<number>(0);
  const [albumLiked, setAlbumLiked] = useState<boolean>(Boolean(album?.isLiked));
  const trackLikesInit = useMemo(() => {
    const map: Record<string | number, boolean> = {};
    (album?.media || []).forEach((t: any) => { map[t.id] = Boolean(t.isLiked); });
    return map;
  }, [album]);
  const [trackLikes, setTrackLikes] = useState<Record<string | number, boolean>>(trackLikesInit);

  const openPickerFor = (mediaId: number) => {
    setSelectedMediaId(mediaId);
    setPickerOpen(true);
  };

  const releaseTracks = () => (Array.isArray(album?.media) ? album.media : []).map((track: any) => ({
    id: track.id,
    title: track.title || '',
    artist: track.user?.displayName || track.user?.username || '',
    imageUrl: track.artCoverUrl || track.coverArt || track.thumbnailUrl,
    audioUrl: track.audioUrl || track.url,
    videoUrl: track.videoUrl,
    duration: track.duration,
    type: track.type,
    isDRMProtected: track.isDRMProtected,
    accessType: track.accessType,
    price: track.price,
    currency: track.currency,
  }));

  const handlePlayAll = () => {
    const tracks = releaseTracks();
    if (tracks.length > 0) setQueue(tracks, 0, true);
  };

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (navigator.share) {
      try {
        await navigator.share({ title: album.title, text: album.description || '', url });
      } catch (_) {}
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      alert('Link copied to clipboard');
    } catch (_) {
      // ignore
    }
  };

  return (
    <div className="min-h-screen text-white overflow-x-hidden px-2 py-6 lg:px-0">
      <div className="max-w-7xl mx-auto space-y-6 overflow-hidden">
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="rounded-3xl overflow-hidden bg-[#08111f] shadow-2xl shadow-black/30">
            <div className="relative w-full overflow-hidden bg-black aspect-square sm:aspect-[4/5] lg:h-96">
              <Image
                src={album.coverUrl || album.artCoverUrl || album.thumbnailUrl || '/default-cover.jpg'}
                alt={album.title || 'Album cover'}
                fill
                className="object-cover"
              />
            </div>
            <div className="p-4 space-y-3">
              <p className="text-xs uppercase tracking-[0.3em] text-purple-300">Album</p>
              <h1 className="text-2xl font-semibold">{album.title || 'Untitled Album'}</h1>
              <p className="text-sm text-slate-400">
                <Link href={`/artists/${album.user?.id}`} className="text-white underline-offset-2 hover:underline">
                  {album.user?.displayName || album.user?.username || 'Unknown Artist'}
                </Link>
              </p>
              <div className="flex items-center gap-2 mt-3">
                <button
                  type="button"
                  onClick={handlePlayAll}
                  className="inline-flex items-center gap-2 rounded-full bg-purple-600 px-4 py-2 text-sm font-medium text-white transition hover:opacity-95"
                >
                  <Play className="h-4 w-4" />
                  Play
                </button>

                <button
                  type="button"
                  onClick={() => setAlbumLiked((v) => !v)}
                  className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  <Heart className={`h-4 w-4 ${albumLiked ? 'text-pink-400' : 'text-white'}`} />
                  {albumLiked ? 'Liked' : 'Like'}
                </button>

                <button
                  type="button"
                  onClick={() => openPickerFor(album?.media?.[0]?.id ?? 0)}
                  className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  <Plus className="h-4 w-4" />
                  Add to playlist
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl bg-[#08111f] p-6 shadow-2xl shadow-black/30">
              <h3 className="text-sm text-slate-400">About</h3>
              <p className="mt-2 text-sm leading-7 text-slate-300">{album.description || 'No description provided yet.'}</p>
            </div>

            <div className="rounded-3xl bg-[#08111f] p-4 shadow-2xl shadow-black/30">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-purple-300">Tracklist</p>
                  <h2 className="text-xl font-semibold">{album.media?.length ?? 0} tracks</h2>
                </div>
              </div>

              {Array.isArray(album.media) && album.media.length > 0 ? (
                <div className="divide-y divide-slate-800">
                  {album.media.map((track: any, idx: number) => {
                    const isCurrent = Boolean(currentTrack && String(currentTrack.id) === String(track.id));
                    return (
                      <div key={track.id ?? idx} className="flex items-center justify-between gap-4 py-3 px-2">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-900">
                            {track.artCoverUrl || track.coverArt || track.thumbnailUrl ? (
                              <Image src={track.artCoverUrl || track.coverArt || track.thumbnailUrl} alt={track.title || ''} fill className="object-cover" />
                            ) : (
                              <div className="h-full w-full bg-gradient-to-br from-purple-600 to-fuchsia-500" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white truncate">{track.title || `Track ${idx + 1}`}</p>
                            <p className="text-xs text-slate-400 truncate">{track.user?.displayName || track.user?.username || ''}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-xs text-slate-400 text-right mr-2">
                            <div>{track.duration ? `${Math.floor(track.duration / 60)}:${String(track.duration % 60).padStart(2, '0')}` : '0:00'}</div>
                            <div className="capitalize">{(track.type || 'audio').toString().toLowerCase()}</div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              if (isCurrent && isPlaying) {
                                togglePlay();
                                return;
                              }
                              setQueue(releaseTracks(), idx, true);
                            }}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white transition hover:bg-white/10"
                          >
                            {isCurrent && isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => setTrackLikes((prev) => ({ ...prev, [track.id]: !prev[track.id] }))}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white transition hover:bg-white/10"
                          >
                            <Heart className={`h-4 w-4 ${trackLikes[track.id] ? 'text-pink-400' : 'text-white'}`} />
                          </button>

                          <button
                            type="button"
                            onClick={() => openPickerFor(track.id)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white transition hover:bg-white/10"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-400">This album has no released tracks yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <PlaylistPickerModal open={pickerOpen} mediaId={Number(selectedMediaId ?? 0)} onClose={() => setPickerOpen(false)} onSuccess={() => setPickerOpen(false)} />
    </div>
  );
}
