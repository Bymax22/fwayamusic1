import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createMediaSlug, extractMediaIdFromSlug } from '@/lib/utils';
import AlbumDetailClient from './AlbumDetailClient';

function getBackendBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://localhost:3001';
}

async function fetchAlbum(albumId: string) {
  const res = await fetch(`${getBackendBaseUrl()}/api/v1/albums/${albumId}`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    return null;
  }

  return res.json();
}

export default async function AlbumDetailPage(props: any) {
  const { params } = props ?? {};
  const rawId = params?.id;
  const albumId = extractMediaIdFromSlug(rawId) ?? rawId;
  const album = await fetchAlbum(String(albumId));
  if (!album) {
    notFound();
  }

  const artistName = album.user?.displayName || album.user?.username || 'Unknown Artist';
  const releaseDate = album.releaseDate ? new Date(album.releaseDate).toLocaleDateString() : 'Unknown';

  return <AlbumDetailClient album={album} />;
}
