"use client";

import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createMediaSlug } from '@/lib/utils';
import { FaHeadphones, FaRegHeart } from 'react-icons/fa';

interface AlbumItem {
  id: number;
  title: string;
  artist: string;
  coverArt: string;
  releaseDate?: string;
  trackCount: number;
  playCount: number;
  likeCount: number;
}

function normalizeAlbum(item: any): AlbumItem {
  return {
    id: item.id,
    title: item.title || item.name || 'Untitled Album',
    artist: item.user?.displayName || item.user?.username || item.artist || 'Unknown Artist',
    coverArt: item.artCoverUrl || item.coverArt || item.thumbnailUrl || '/default-cover.jpg',
    releaseDate: item.releaseDate || item.createdAt || item.publishedAt || item.created_at || '',
    trackCount: typeof item.mediasCount === 'number'
      ? item.mediasCount
      : typeof item.trackCount === 'number'
        ? item.trackCount
        : typeof item.tracksCount === 'number'
          ? item.tracksCount
          : Array.isArray(item.tracks)
            ? item.tracks.length
            : 0,
    playCount: item.playCount || item.views || 0,
    likeCount: item.likeCount || 0,
  };
}

export default function AlbumsPage() {
  const [albums, setAlbums] = useState<AlbumItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/media', { credentials: 'include' });
        if (!response.ok) throw new Error('Failed to load albums');
        const data = await response.json();
        const items = Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : [];
        const albumItems = items
          .filter((item: any) => item.type?.toString().toUpperCase() === 'ALBUM')
          .map(normalizeAlbum);

        setAlbums(albumItems);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to fetch albums');
      } finally {
        setLoading(false);
      }
    };

    void fetchAlbums();
  }, []);

  const featuredAlbums = useMemo(
    () => albums.slice().sort((a, b) => b.playCount - a.playCount).slice(0, 8),
    [albums]
  );

  return (
    <div className="min-h-screen px-4 pb-24 pt-6 lg:px-10">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Albums</p>
            <h1 className="text-3xl font-semibold text-white">Browse albums</h1>
            <p className="mt-2 text-sm text-slate-400">Explore featured and newly released albums from top artists.</p>
          </div>
          <div className="rounded-full bg-white/5 px-4 py-2 text-sm text-slate-300">{albums.length} albums available</div>
        </div>

        {error ? (
          <div className="rounded-3xl bg-slate-950 p-6 text-sm text-red-300">{error}</div>
        ) : loading ? (
          <div className="space-y-4">
            <div className="h-24 rounded-3xl bg-slate-900 animate-pulse" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="h-72 rounded-3xl bg-slate-900 animate-pulse" />
              ))}
            </div>
          </div>
        ) : (
          <>
            <section className="mb-10">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Featured</p>
                  <h2 className="text-2xl font-semibold text-white">Top albums</h2>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {featuredAlbums.slice(0, 8).map((album) => (
                  <Link
                    key={album.id}
                    href={`/albums/${createMediaSlug(album.title, album.id)}`}
                    className="rounded-3xl overflow-hidden bg-[#041021] shadow-lg shadow-black/20 transition hover:-translate-y-1"
                  >
                    <div className="relative h-64 bg-black">
                      <Image
                        src={album.coverArt}
                        alt={album.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <p className="text-sm font-semibold text-white truncate mb-1">{album.title}</p>
                      <p className="text-xs text-slate-400 truncate mb-3">{album.artist}</p>
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>{album.trackCount} tracks</span>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1">
                            <FaHeadphones className="h-3.5 w-3.5" />
                            {album.playCount.toLocaleString()}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <FaRegHeart className="h-3.5 w-3.5" />
                            {album.likeCount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            <section>
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500">All Albums</p>
                  <h2 className="text-2xl font-semibold text-white">Browse the full collection</h2>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {albums.map((album) => (
                  <Link
                    key={album.id}
                    href={`/albums/${createMediaSlug(album.title, album.id)}`}
                    className="rounded-3xl overflow-hidden bg-[#041021] shadow-lg shadow-black/20 transition hover:-translate-y-1"
                  >
                    <div className="relative h-56 bg-black">
                      <Image
                        src={album.coverArt}
                        alt={album.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <p className="text-sm font-semibold text-white truncate mb-1">{album.title}</p>
                      <p className="text-xs text-slate-400 truncate mb-3">{album.artist}</p>
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>{album.trackCount} tracks</span>
                        <span>{album.releaseDate ? new Date(album.releaseDate).toLocaleDateString() : 'Unknown date'}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
