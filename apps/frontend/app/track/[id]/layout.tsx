import { headers } from "next/headers";
import type { Metadata } from "next";
import { extractMediaIdFromSlug, resolveMediaUrl } from '@/lib/utils';

interface TrackMeta {
  id: number;
  title: string;
  description?: string;
  coverArt?: string;
  coverUrl?: string;
  artCoverUrl?: string;
  thumbnailUrl?: string;
  previewVideoUrl?: string;
  duration?: number;
  album?: string;
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

  // Prefer the real cover art as the primary social preview image for music tracks.
  // Keep the generated OG image route as a fallback only when the track has no usable cover.
  const rawCoverUrl = track?.coverArt ||
    (track as any)?.coverUrl ||
    track?.artCoverUrl ||
    track?.thumbnailUrl;
  const previewImage = rawCoverUrl
    ? resolveMediaUrl(rawCoverUrl, baseUrl) ?? ogImage
    : ogImage;

  const trackUrl = `${baseUrl}/track/${id}`;
  const imageType = previewImage.toLowerCase().includes('.png') ? 'image/png' : 'image/jpeg';

  // eslint-disable-next-line no-console
  console.log("[track-layout] Metadata:", { mediaId, title, description, previewImage, ogImage, previewVideoUrl });

  return {
    title,
    description,
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: trackUrl,
    },
    openGraph: {
      type: "music.song",
      title,
      description,
      url: trackUrl,
      siteName: "Fwaya",
      images: [
        {
          url: previewImage,
          secureUrl: previewImage,
          alt: `${track?.title || "Track"} cover art`,
          width: 1200,
          height: 1200,
          type: imageType,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [previewImage],
      site: "@fwayamusic",
      creator: "@fwayamusic",
    },
    other: {
      'music:musician': artistName,
      ...(typeof track?.duration === 'number' ? { 'music:duration': String(track.duration) } : {}),
      ...(track?.album ? { 'music:album': track.album } : {}),
    },
  };
}

export default function TrackIdLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
