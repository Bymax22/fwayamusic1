import { ImageResponse } from '@vercel/og';

export const runtime = 'edge';

const DEFAULT_IMAGE = 'https://res.cloudinary.com/dayn5vifn/image/upload/v1777067980/fwaya-01_eeob6c.png';

function toAbsoluteUrl(url: string | undefined, base: string) {
  if (!url) return null;
  return /^https?:\/\//i.test(url) ? url : `${base}${url.startsWith('/') ? '' : '/'}${url}`;
}

function normalizeCoverUrl(url: string) {
  if (/res\.cloudinary\.com\/dayn5vifn\/image\/upload\//.test(url)) {
    return url.replace('/upload/', '/upload/f_auto,q_auto,w_1200/');
  }
  return url;
}

async function fetchImageDataUrl(url: string) {
  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      console.error(`Failed to fetch OG cover image: ${response.status} ${response.statusText}`);
      return null;
    }

    const contentType = response.headers.get('content-type') || 'image/png';
    const arrayBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    const chunkSize = 0x8000;

    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }

    return `data:${contentType};base64,${btoa(binary)}`;
  } catch (error) {
    console.error('Failed to fetch OG cover image:', error);
    return null;
  }
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
  const rawCoverUrl = toAbsoluteUrl(
    track?.coverArt || track?.artCoverUrl || track?.thumbnailUrl || (track as any)?.coverUrl,
    baseUrl,
  ) || DEFAULT_IMAGE;
  const coverUrl = normalizeCoverUrl(rawCoverUrl);
  const coverImageUrl = (await fetchImageDataUrl(coverUrl)) || coverUrl;

  return new ImageResponse(
    (
      <div style={{
        width: '1200px',
        height: '630px',
        position: 'relative',
        backgroundColor: '#000',
        fontFamily: 'Inter, sans-serif',
      }}>
        <img src={coverImageUrl} alt="cover" style={{
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
          background: 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 100%)',
        }} />
        <div style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: '260px',
          background: 'linear-gradient(0deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0) 100%)',
          pointerEvents: 'none',
        }} />

        <div style={{
          position: 'absolute',
          top: '50px',
          right: '50px',
          zIndex: 2,
          width: '240px',
          minHeight: '240px',
          borderRadius: '40px',
          background: 'rgba(255,255,255,0.16)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.14)',
          padding: '26px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '18px',
        }}>
          <div style={{
            width: '140px',
            height: '140px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.96)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{
              width: 0,
              height: 0,
              borderTop: '26px solid transparent',
              borderBottom: '26px solid transparent',
              borderLeft: '44px solid #111827',
            }} />
          </div>
          <span style={{ color: '#E5E7EB', fontSize: '22px', fontWeight: 700, letterSpacing: '0.02em' }}>Play</span>
        </div>

        <div style={{
          position: 'absolute',
          left: '50px',
          bottom: '50px',
          zIndex: 2,
          maxWidth: '60%',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}>
          <p style={{ margin: 0, color: '#A78BFA', fontSize: '28px', letterSpacing: '0.32em', textTransform: 'uppercase' }}>FWAYA</p>
          <h1 style={{ margin: 0, color: '#fff', fontSize: '88px', lineHeight: 0.95, fontWeight: 800, maxWidth: '100%' }}>
            {title}
          </h1>
          <p style={{ margin: 0, color: '#E5E7EB', fontSize: '36px', lineHeight: 1.1 }}>
            {artist}
          </p>
          <p style={{ margin: 0, color: '#D1D5DB', fontSize: '24px', lineHeight: 1.4, maxWidth: '720px' }}>
            {description}
          </p>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
