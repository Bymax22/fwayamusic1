import { headers } from 'next/headers';
import { extractMediaIdFromSlug, resolveMediaUrl } from '@/lib/utils';

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
    const { extractMediaIdFromSlug } = await import('@/lib/utils');
    const mediaId = extractMediaIdFromSlug(id);
    if (!mediaId) return null;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/api/v1/media/${mediaId}`, {
      next: { revalidate: 60 },
    });

    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('[video-head] fetchVideoMeta failed', error);
    return null;
  }
}

export default async function Head({ params }: { params: { id: string } }) {
  const { id } = params;
  const requestHeaders = await headers();
  const host = requestHeaders.get('x-forwarded-host') || requestHeaders.get('host') || 'fwaya.net';
  const protocol = requestHeaders.get('x-forwarded-proto') || requestHeaders.get('x-forwarded-protocol') || 'https';
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;

  const video = await fetchVideoMeta(id);
  const videoId = video?.id || extractMediaIdFromSlug(id);
  const title = video?.title ? `${video.title} • ${video.user?.displayName || video.user?.username || 'Fwaya'}` : 'Fwaya Video';
  const description = video?.description || `Watch ${video?.title || 'this video'} on Fwaya`;
  const rawImageUrl = video?.thumbnail || video?.artCoverUrl || video?.coverArt || video?.thumbnailUrl;
  const imageUrl = rawImageUrl ? resolveMediaUrl(rawImageUrl, baseUrl) : undefined;
  const image = imageUrl || (videoId ? `${baseUrl}/api/og/video/${videoId}` : `${baseUrl}/default-cover.jpg`);
  const pageUrl = `${baseUrl}/videos/${id}`;
  const videoUrl = resolveMediaUrl(video?.videoUrl, baseUrl);

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:type" content="video.other" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:image" content={image} />
      <meta property="og:image:alt" content={`${video?.title || 'Video'} cover art`} />
      <meta property="og:site_name" content="Fwaya" />
      {videoUrl && <meta property="og:video" content={videoUrl} />}
      {videoUrl && <meta property="og:video:secure_url" content={videoUrl} />}
      {videoUrl && <meta property="og:video:type" content="video/mp4" />}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:site" content="@fwayamusic" />
      <meta name="twitter:creator" content="@fwayamusic" />
    </>
  );
}
