import { NextResponse } from 'next/server';

function getBackendBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://localhost:3001';
}

export async function GET(request: Request) {
  try {
    const baseUrl = getBackendBaseUrl();
    const res = await fetch(`${baseUrl}/api/v1/media`, {
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      return NextResponse.json({ error: errorText }, { status: res.status });
    }

    const media = await res.json();
    return NextResponse.json(media);
  } catch (error) {
    console.error('Failed to proxy videos:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
