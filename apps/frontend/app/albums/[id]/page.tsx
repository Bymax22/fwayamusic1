import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createMediaSlug, extractMediaIdFromSlug } from '@/lib/utils';
import AlbumDetailClient from './AlbumDetailClient';

function getBackendBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://localhost:3001';
}

async function fetchAlbum(albumId: string) {
  try {
    const res = await fetch(`${getBackendBaseUrl()}/api/v1/albums/${albumId}`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return null;
    }

    return res.json();
  } catch (error) {
    console.error('Album fetch failed:', error);
    return null;
  }
}

export default async function AlbumDetailPage(props: any) {
  const { params } = props ?? {};
  const resolvedParams = params instanceof Promise ? await params : params;
  const rawId = resolvedParams?.id;
  const albumId = extractMediaIdFromSlug(rawId) ?? rawId;
  if (!albumId) {
    notFound();
  }

  const album = await fetchAlbum(String(albumId));
  if (!album) {
    notFound();
  }

  return <AlbumDetailClient album={album} />;
}
