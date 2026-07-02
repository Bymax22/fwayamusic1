import { NextResponse } from 'next/server';

function getBackendBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://localhost:3001';
}

export async function GET(request: Request, context: any) {
  try {
    const baseUrl = getBackendBaseUrl();
    const id = context?.params?.id;
    if (!id) return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });

    const res = await fetch(`${baseUrl}/api/v1/media/${id}`, {
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      return NextResponse.json({ error: errorText }, { status: res.status });
    }

    const media = await res.json();
    return NextResponse.json(media);
  } catch (error) {
    console.error('Failed to fetch media by ID:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
