import { NextResponse } from 'next/server';

function getBackendBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://localhost:3001';
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
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
