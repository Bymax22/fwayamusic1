interface TrackMeta {
  id: number;
  title: string;
  artist: string;
  description?: string;
  coverArt?: string;
  genre?: string;
}

export default async function Head({ params }: { params: { id: string } }) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://fwayamusic.com';
  const trackUrl = `${baseUrl}/track/${params.id}`;
  const defaultImage = 'https://res.cloudinary.com/dayn5vifn/image/upload/v1777067980/fwaya-01_eeob6c.png';

  let track: TrackMeta | null = null;

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/media/${params.id}`, {
      next: { revalidate: 60 },
    });
    if (response.ok) {
      track = await response.json();
    }
  } catch (error) {
    console.error('Failed to fetch track metadata for head:', error);
  }

  const title = track?.title ? `${track.title} • ${track.artist}` : 'Fwaya Music';
  const description = track?.description
    ? track.description
    : track?.title
    ? `Listen to ${track.title} by ${track.artist} on Fwaya Music.`
    : 'Stream music on Fwaya Music.';
  const image = track?.coverArt || defaultImage;

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:type" content="music.song" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:alt" content={`${track?.title || 'Track'} cover art`} />
      <meta property="og:url" content={trackUrl} />
      <meta property="og:site_name" content="Fwaya Music" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:site" content="@fwayamusic" />
      <meta name="twitter:creator" content="@fwayamusic" />
    </>
  );
}
