import { NextResponse } from 'next/server';

function getBackendBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://localhost:3001';
}

export async function GET() {
  try {
    const baseUrl = getBackendBaseUrl();
    const start = Date.now();
    const res = await fetch(`${baseUrl}/api/v1/media/homepage-sections`, {
      headers: { Accept: 'application/json' },
    });

    const upstreamMs = Date.now() - start;

    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      console.error('Backend homepage-sections request failed:', res.status, errorText);
      return NextResponse.json({ error: errorText || 'Upstream error' }, { status: res.status || 502, headers: { 'x-upstream-ms': String(upstreamMs) } });
    }

    const data = await res.json();
    return NextResponse.json(data, { headers: { 'x-upstream-ms': String(upstreamMs) } });
  } catch (error) {
    console.error('Failed to fetch homepage-sections:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
