// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('authToken')?.value;
  const { pathname } = request.nextUrl;

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
  ],
};