import { headers } from "next/headers";
import type { Metadata } from "next";
import { extractMediaIdFromSlug } from '@/lib/utils';

interface TrackMeta {
  id: number;
  title: string;
  description?: string;
  coverArt?: string;
  coverUrl?: string;
  artCoverUrl?: string;
  thumbnailUrl?: string;
  previewVideoUrl?: string;
  user?: { id: number; username?: string; displayName?: string };
}

async function fetchTrackMeta(id: string): Promise<TrackMeta | null> {
  try {
    const { extractMediaIdFromSlug } = await import('@/lib/utils');
    const mediaId = extractMediaIdFromSlug(id);
    
    if (!mediaId) {
      console.warn("Could not extract media ID from slug:", id);
      return null;
    }
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const response = await fetch(`${apiUrl}/api/v1/media/${mediaId}`, {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      console.warn("Failed to fetch track metadata:", response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to fetch track metadata in layout:", error);
    return null;
  }
}

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { params } = props;
  const { id } = await params;
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "fwaya.net";
  const protocol = requestHeaders.get("x-forwarded-proto") || requestHeaders.get("x-forwarded-protocol") || "https";
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;

  const track = await fetchTrackMeta(id);
  const artistName = track?.user?.displayName || track?.user?.username || "Fwaya";
  const title = track?.title ? `${track.title} • ${artistName}` : "Fwaya";
  const mediaId = track?.id || extractMediaIdFromSlug(id);
  const description = track?.description || `Listen to ${track?.title || 'this track'} by ${artistName} on Fwaya`;
  const ogImage = `${baseUrl}/api/og/track/${mediaId}`;
  // Preview video URL (if a short MP4 preview is available). Falls back to a generated preview route.
  const previewVideoUrl =
    (track as any)?.previewVideoUrl || `${baseUrl}/api/og/track/${mediaId}/video`;
  
  // Ensure cover URL is absolute
  const rawCoverUrl = track?.coverArt ||
    (track as any)?.coverUrl ||
    track?.artCoverUrl ||
    track?.thumbnailUrl;
  const fallbackImage = rawCoverUrl && /^https?:\/\//i.test(rawCoverUrl) 
    ? rawCoverUrl 
    : (rawCoverUrl ? `${baseUrl}${rawCoverUrl.startsWith('/') ? '' : '/'}${rawCoverUrl}` : ogImage);
  
  const trackUrl = `${baseUrl}/track/${id}`;

  // eslint-disable-next-line no-console
  console.log("[track-layout] Metadata:", { mediaId, title, description, fallbackImage, ogImage });

  return {
    title,
    description,
    openGraph: {
      type: "music.song",
      title,
      description,
      url: trackUrl,
      siteName: "Fwaya",
      images: [
        {
          url: fallbackImage,
          alt: `${track?.title || "Track"} cover art`,
          width: 1200,
          height: 630,
          type: "image/png",
        },
        {
          url: ogImage,
          alt: `${track?.title || "Track"} cover art`,
          width: 1200,
          height: 630,
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [fallbackImage, ogImage],
      site: "@fwayamusic",
      creator: "@fwayamusic",
    },
  };
}

export default function TrackIdLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
