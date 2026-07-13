import { ImageResponse } from '@vercel/og';

export const runtime = 'edge';

const DEFAULT_IMAGE = 'https://res.cloudinary.com/dayn5vifn/image/upload/v1777067980/fwaya-01_eeob6c.png';

export async function GET(req: Request, context: any) {
  const trackSlug = context?.params?.id;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const requestUrl = new URL(req.url);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || requestUrl.origin;
  let track: { title?: string; description?: string; coverArt?: string; artCoverUrl?: string; thumbnailUrl?: string; user?: { id?: number; username?: string; displayName?: string }; genre?: string } | null = null;

  // Extract numeric ID from slug
  const extractMediaIdFromSlug = (slug?: string) => {
    if (!slug) return undefined;
    const matches = slug.match(/-(\d+)(?:$|\/)/);
    if (matches?.[1]) {
      const parsed = Number(matches[1]);
      return Number.isFinite(parsed) ? parsed : undefined;
    }
    const numeric = Number(slug);
    return Number.isFinite(numeric) ? numeric : undefined;
  };
  
  const trackId = extractMediaIdFromSlug(trackSlug);

  const backendUrls = Array.from(new Set([
    apiUrl,
    'https://fwayamusic1-backend.vercel.app',
  ].filter(Boolean)));

  if (trackId && backendUrls.length > 0) {
    for (const backendUrl of backendUrls) {
      try {
        const response = await fetch(`${backendUrl}/api/v1/media/${trackId}`, {
          next: { revalidate: 60 },
        });
        if (response.ok) {
          track = await response.json();
          break;
        }
      } catch (error) {
        console.error(`OG image fetch error for ${backendUrl}:`, error);
      }
    }
  }

  const title = track?.title || 'Fwaya';
  const artist = track?.user?.displayName || track?.user?.username || 'Fwaya';
  const description = track?.description || `Listen to ${title} on Fwaya.`;
  const coverUrl = (track?.coverArt || track?.artCoverUrl || track?.thumbnailUrl || (track as any)?.coverUrl) || DEFAULT_IMAGE;
  const absoluteCoverUrl = /^https?:\/\//i.test(coverUrl) ? coverUrl : `${baseUrl}${coverUrl}`;

  console.log('[og-track] Generating image:', { trackId, title, artist, coverUrl, absoluteCoverUrl, hasTrack: !!track });

  return new ImageResponse(
    (
      <div style={{
        width: '1200px',
        height: '630px',
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'center',
        backgroundColor: '#000',
        position: 'relative',
        fontFamily: 'Inter, sans-serif',
      }}>
        <img src={absoluteCoverUrl} alt="cover" style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          filter: 'brightness(0.55)',
        }} />
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.7) 100%)',
        }} />
        <div style={{
          zIndex: 2,
          width: '100%',
          padding: '50px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: '100%',
        }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start', gap: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: '300px', minHeight: '300px', borderRadius: '32px', background: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(22px)' }}>
              <div style={{
                width: '180px',
                height: '180px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.95)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <svg width="96" height="96" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <polygon points="28,16 28,80 72,48" fill="#111827" />
                </svg>
              </div>
              <span style={{ marginTop: '22px', color: '#E5E7EB', fontSize: '24px', fontWeight: 700 }}>Play</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '68%' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <p style={{ margin: 0, color: '#A78BFA', fontSize: '28px', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Fwaya</p>
                <h1 style={{ margin: '4px 0 0 0', color: '#fff', fontSize: '80px', lineHeight: '0.95', fontWeight: 800 }}>
                  {title}
                </h1>
                <p style={{ margin: '16px 0 0 0', color: '#E5E7EB', fontSize: '36px', lineHeight: 1.1 }}>
                  {artist}
                </p>
              </div>
              <p style={{ margin: '24px 0 0 0', color: '#D1D5DB', fontSize: '26px', lineHeight: 1.4, maxHeight: '144px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {description}
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
              <span style={{ color: '#A78BFA', fontSize: '20px', fontWeight: 700 }}>Track</span>
              <span style={{ color: '#fff', fontSize: '46px', fontWeight: 800 }}>Tap to play</span>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
