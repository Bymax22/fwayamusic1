import { headers } from "next/headers";
import type { Metadata } from "next";

interface TrackMeta {
  id: number;
  title: string;
  description?: string;
  artCoverUrl?: string;
  thumbnailUrl?: string;
  user?: { id: number; username?: string; displayName?: string };
}

async function fetchTrackMeta(id: string): Promise<TrackMeta | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/media/${id}`, {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to fetch track metadata in layout:", error);
    return null;
  }
}

export async function generateMetadata(props: any): Promise<Metadata> {
  const { params } = props as { params: { id: string } };
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "fwaya.net";
  const protocol = requestHeaders.get("x-forwarded-proto") || requestHeaders.get("x-forwarded-protocol") || "https";
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;

  const track = await fetchTrackMeta(params.id);
  const artistName = track?.user?.displayName || track?.user?.username || "Fwaya";
  const title = track?.title ? `${track.title} • ${artistName}` : "Fwaya";
  const ogImage = `${baseUrl}/api/og/track/${params.id}`;
  const fallbackImage = track?.artCoverUrl || track?.thumbnailUrl || ogImage;
  const trackUrl = `${baseUrl}/track/${params.id}`;

  // eslint-disable-next-line no-console
  console.log("[layout] generateMetadata for track id=", params.id);

  return {
    title,
    description: '',
    openGraph: {
      type: "music.song",
      title,
      description: '',
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
      description: '',
      images: [fallbackImage, ogImage],
      site: "@fwayamusic",
      creator: "@fwayamusic",
    },
  };
}

export default function TrackIdLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
