import { NextResponse } from 'next/server';

function getBackendBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://localhost:3001';
}

export async function GET() {
  try {
    const baseUrl = getBackendBaseUrl();
    const start = Date.now();
    const res = await fetch(`${baseUrl}/api/v1/users`, { headers: { Accept: 'application/json' } });
    const upstreamMs = Date.now() - start;

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error('Backend users request failed:', res.status, text);
      return NextResponse.json(
        { error: text || 'Upstream error' },
        { status: res.status || 502, headers: { 'x-upstream-ms': String(upstreamMs) } }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, { headers: { 'x-upstream-ms': String(upstreamMs) } });
  } catch (err) {
    console.error('Failed to fetch users:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
