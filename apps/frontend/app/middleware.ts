// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function escapeHtml(s: string) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function middleware(request: NextRequest) {
  // Detect social crawler UAs and serve pre-rendered OG HTML for video pages.
  const ua = (request.headers.get('user-agent') || '').toLowerCase();
  const isSocialCrawler = ['facebookexternalhit', 'facebot', 'whatsapp', 'twitterbot', 'linkedinbot'].some(k => ua.includes(k));
  const pathname = request.nextUrl.pathname;

  if (isSocialCrawler && pathname.startsWith('/videos/')) {
    // Extract slug/id from path
    const slug = pathname.replace('/videos/', '').replace(/\/$/, '');

    const extractMediaIdFromSlug = (s?: string) => {
      if (!s) return undefined;
      const m = s.match(/-(\d+)(?:$|\/)/);
      if (m?.[1]) return Number(m[1]);
      const n = Number(s);
      return Number.isFinite(n) ? n : undefined;
    };

    const videoId = extractMediaIdFromSlug(slug);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    const backendCandidates = Array.from(new Set([apiUrl, 'https://fwayamusic1-backend.vercel.app'].filter(Boolean)));

    let video: any = null;
    if (videoId && backendCandidates.length) {
      for (const b of backendCandidates) {
        try {
          const res = await fetch(`${b}/api/v1/media/${videoId}`);
          if (res.ok) {
            video = await res.json();
            break;
          }
        } catch (e) {
          // ignore and try next
        }
      }
    }

    const title = video?.title ? `${video.title} • ${video.user?.displayName || video.user?.username || 'Fwaya'}` : 'Fwaya Video';
    const description = video?.description || `Watch ${video?.title || 'this video'} on Fwaya`;
    const rawImage = video?.thumbnail || video?.coverArt || video?.artCoverUrl || video?.thumbnailUrl;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || `${request.nextUrl.protocol || 'https'}://${request.nextUrl.host}`;
    const image = rawImage ? (rawImage.startsWith('http') ? rawImage : `${baseUrl}${rawImage.startsWith('/') ? '' : '/'}${rawImage}`) : (videoId ? `${baseUrl}/api/og/video/${videoId}` : `${baseUrl}/default-cover.jpg`);
    const pageUrl = `${baseUrl}${pathname}`;

    const html = `<!doctype html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}" /><meta property="og:type" content="video.other" /><meta property="og:title" content="${escapeHtml(title)}" /><meta property="og:description" content="${escapeHtml(description)}" /><meta property="og:url" content="${escapeHtml(pageUrl)}" /><meta property="og:image" content="${escapeHtml(image)}" /><meta property="og:site_name" content="Fwaya" /><meta name="twitter:card" content="summary_large_image" /><meta name="twitter:title" content="${escapeHtml(title)}" /><meta name="twitter:description" content="${escapeHtml(description)}" /><meta name="twitter:image" content="${escapeHtml(image)}" /><link rel="canonical" href="${escapeHtml(pageUrl)}" /></head><body><p>Redirecting...</p></body></html>`;

      return new NextResponse(html, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } });
  }
  const token = request.cookies.get('authToken')?.value;

  // Define role-based route patterns
  const userRoutes = ['/dashboard', '/library', '/playlists'];
  const artistRoutes = ['/for-artists', '/upload', '/artist-dashboard'];
  const resellerRoutes = ['/reseller-dashboard', '/reseller/links', '/commissions'];
  const adminRoutes = ['/admin', '/moderation'];

  // Check if the route requires authentication
  const requiresAuth = [...userRoutes, ...artistRoutes, ...resellerRoutes, ...adminRoutes]
    .some(route => pathname.startsWith(route));

  if (requiresAuth && !token) {
    const signInUrl = new URL('/auth/user/signin', request.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // If user has token, verify role access
  if (token) {
    // In a real app, you'd verify the token and get user role from it
    // For now, we'll rely on the client-side protection
    // You can add server-side role verification here
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/for-artists/:path*',
    '/reseller-dashboard/:path*',
    '/admin/:path*',
    '/videos/:path*',
  ],
};