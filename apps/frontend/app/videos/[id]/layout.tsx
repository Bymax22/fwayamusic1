import { headers } from 'next/headers';
import type { Metadata } from 'next';
import { extractMediaIdFromSlug, resolveMediaUrl } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

interface VideoMeta {
  id: number;
  title?: string;
  description?: string;
  thumbnail?: string;
  artCoverUrl?: string;
  coverArt?: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  url?: string;
  audioUrl?: string;
  mediaUrl?: string;
  fileUrl?: string;
  user?: { displayName?: string; username?: string };
}

async function fetchVideoMeta(id: string): Promise<VideoMeta | null> {
  try {
    const { extractMediaIdFromSlug } = await import('@/lib/utils');
    const mediaId = extractMediaIdFromSlug(id);
    
    if (!mediaId) {
      console.warn('Could not extract media ID from slug:', id);
      return null;
    }
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/api/v1/media/${mediaId}`, {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      console.warn('Failed to fetch video metadata:', response.status);
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
  const videoId = video?.id || extractMediaIdFromSlug(id);
  const title = video?.title ? `${video.title} • ${video.user?.displayName || video.user?.username || 'Fwaya'}` : 'Fwaya Video';
  const description = video?.description || `Watch ${video?.title || 'this video'} on Fwaya`;
  
  // Ensure image URL is absolute and always available for share previews.
  const rawImageUrl = video?.thumbnail || video?.artCoverUrl || video?.coverArt || video?.thumbnailUrl;
  const imageUrl = rawImageUrl ? resolveMediaUrl(rawImageUrl, baseUrl) : undefined;
  const image = imageUrl || (videoId ? `${baseUrl}/api/og/video/${videoId}` : `${baseUrl}/default-cover.jpg`);
  
  const pageUrl = `${baseUrl}/videos/${id}`;
  const rawVideoUrl = video?.videoUrl || video?.url || video?.audioUrl || video?.mediaUrl || video?.fileUrl;
  const videoUrl = resolveMediaUrl(rawVideoUrl, baseUrl);

  console.log('[video-layout] Metadata:', {
    videoId,
    title,
    description,
    image,
    rawVideoUrl,
    videoUrl,
  });

  return {
    title,
    description,
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      type: 'video.other',
      title,
      description,
      url: pageUrl,
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
      ...(videoUrl
        ? {
            videos: [
              {
                url: videoUrl,
                secureUrl: videoUrl,
                type: 'video/mp4',
                width: 1280,
                height: 720,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: 'summary_large_image',
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
