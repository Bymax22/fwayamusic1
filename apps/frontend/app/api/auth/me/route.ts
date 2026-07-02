import { NextResponse } from 'next/server';

function getBackendBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://localhost:3001';
}

function getCookieValue(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(';').map((cookie) => cookie.trim());
  const match = cookies.find((cookie) => cookie.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split('=')[1] || '') : null;
}

export async function GET(request: Request) {
  try {
    let authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    if (!authHeader) {
      const cookieToken = getCookieValue(request, 'authToken');
      if (cookieToken) {
        authHeader = `Bearer ${cookieToken}`;
      }
    }

    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const baseUrl = getBackendBaseUrl();
    const start = Date.now();
    const backendRes = await fetch(`${baseUrl}/api/v1/auth/me`, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
        Accept: 'application/json',
      },
    });
    const upstreamMs = Date.now() - start;

    const data = await backendRes.json().catch(() => ({}));
    if (!backendRes.ok) {
      return NextResponse.json(data, { status: backendRes.status, headers: { 'x-upstream-ms': String(upstreamMs) } });
    }

    return NextResponse.json(data, { headers: { 'x-upstream-ms': String(upstreamMs) } });
  } catch (err) {
    console.error('Failed to proxy /auth/me:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
