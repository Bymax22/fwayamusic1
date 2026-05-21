import { ImageResponse } from '@vercel/og';

export const runtime = 'edge';

const DEFAULT_IMAGE = 'https://res.cloudinary.com/dayn5vifn/image/upload/v1777067980/fwaya-01_eeob6c.png';

function toAbsoluteUrl(url: string | undefined, base: string) {
  if (!url) return null;
  return /^https?:\/\//i.test(url) ? url : `${base}${url.startsWith('/') ? '' : '/'}${url}`;
}

export async function GET(req: Request, context: any) {
  const trackId = context?.params?.id;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const requestUrl = new URL(req.url);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || requestUrl.origin;
  let track: { title?: string; description?: string; coverArt?: string; artCoverUrl?: string; thumbnailUrl?: string; user?: { id?: number; username?: string; displayName?: string }; genre?: string } | null = null;

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
        console.error(`OG image media fetch failed for ${backendUrl}:`, response.status, response.statusText);
      } catch (error) {
        console.error(`OG image fetch error for ${backendUrl}:`, error);
      }
    }
  }

  const title = track?.title || 'Fwaya';
  const artist = track?.user?.displayName || track?.user?.username || 'Fwaya';
  const description = track?.description || `Listen to ${title} on Fwaya.`;
  const coverUrl = toAbsoluteUrl(
    track?.coverArt || track?.artCoverUrl || track?.thumbnailUrl || (track as any)?.coverUrl,
    baseUrl,
  ) || DEFAULT_IMAGE;

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
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${coverUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '65%' }}>
              <p style={{ margin: 0, color: '#A78BFA', fontSize: '24px', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Fwaya</p>
              <h1 style={{ margin: '18px 0 0 0', color: '#fff', fontSize: '72px', lineHeight: '0.95', fontWeight: 800 }}>
                {title}
              </h1>
              <p style={{ margin: '20px 0 0 0', color: '#E5E7EB', fontSize: '32px', lineHeight: 1.1 }}>
                {artist}
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: '160px', minHeight: '160px', borderRadius: '32px', background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(20px)' }}>
              <div style={{
                width: '96px',
                height: '96px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.95)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <div style={{
                  width: 0,
                  height: 0,
                  borderTop: '16px solid transparent',
                  borderBottom: '16px solid transparent',
                  borderLeft: '24px solid #111827',
                }} />
              </div>
              <span style={{ marginTop: '16px', color: '#E5E7EB', fontSize: '18px', fontWeight: 700 }}>Play</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '68%' }}>
              <p style={{ margin: 0, color: '#D1D5DB', fontSize: '24px', lineHeight: 1.4, maxHeight: '144px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {description}
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
              <span style={{ color: '#A78BFA', fontSize: '18px', fontWeight: 700 }}>Track</span>
              <span style={{ color: '#fff', fontSize: '42px', fontWeight: 800 }}>Tap to play</span>
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
