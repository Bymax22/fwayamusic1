import { NextResponse } from 'next/server';

function getBackendBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://localhost:3001';
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const baseUrl = getBackendBaseUrl();
    const url = new URL(request.url);
    const search = url.search || '';
    const start = Date.now();
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (authHeader) headers.Authorization = authHeader;
    const res = await fetch(`${baseUrl}/api/v1/playlist${search}`, { headers });
    const upstreamMs = Date.now() - start;
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error('Backend playlist request failed:', res.status, text);
      return NextResponse.json({ error: text || 'Upstream error' }, { status: res.status || 502, headers: { 'x-upstream-ms': String(upstreamMs) } });
    }
    const data = await res.json();
    return NextResponse.json(data, { headers: { 'x-upstream-ms': String(upstreamMs) } });
  } catch (err) {
    console.error('Failed to fetch playlist:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
