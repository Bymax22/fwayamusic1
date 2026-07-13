import { headers } from 'next/headers';
import type { Metadata } from 'next';

interface VideoMeta {
  id: number;
  title?: string;
  description?: string;
  thumbnail?: string;
  artCoverUrl?: string;
  coverArt?: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  user?: { displayName?: string; username?: string };
}

async function fetchVideoMeta(id: string): Promise<VideoMeta | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/media/${id}`, {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch video metadata in layout:', error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const requestHeaders = await headers();
  const host = requestHeaders.get('x-forwarded-host') || requestHeaders.get('host') || 'fwaya.net';
  const protocol = requestHeaders.get('x-forwarded-proto') || requestHeaders.get('x-forwarded-protocol') || 'https';
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;

  const video = await fetchVideoMeta(id);
  const title = video?.title ? `${video.title} • ${video.user?.displayName || video.user?.username || 'Fwaya'}` : 'Fwaya Video';
  const description = video?.description || 'Watch this video on Fwaya';
  
  // Ensure image URL is absolute
  const rawImageUrl = video?.thumbnail || video?.artCoverUrl || video?.coverArt || video?.thumbnailUrl;
  const image = (rawImageUrl && /^https?:\/\//i.test(rawImageUrl)) 
    ? rawImageUrl 
    : (rawImageUrl ? `${baseUrl}${rawImageUrl.startsWith('/') ? '' : '/'}${rawImageUrl}` : `${baseUrl}/api/og/video/${id}`);
  
  const videoUrl = video?.videoUrl || `${baseUrl}/videos/${id}`;

  return {
    title,
    description,
    openGraph: {
      type: 'video.other',
      title,
      description,
      url: `${baseUrl}/videos/${id}`,
      siteName: 'Fwaya',
      images: [
        {
          url: image,
          alt: `${video?.title || 'Video'} cover art`,
          width: 1200,
          height: 630,
          type: 'image/png',
        },
      ],
      videos: [
        {
          url: videoUrl,
          secureUrl: videoUrl,
          type: 'video/mp4',
          width: 1280,
          height: 720,
        },
      ],
    },
    twitter: {
      card: 'player',
      title,
      description,
      images: [image],
      site: '@fwayamusic',
      creator: '@fwayamusic',
    },
  };
}

export default function VideoIdLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
