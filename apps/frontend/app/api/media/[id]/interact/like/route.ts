import { NextRequest, NextResponse } from 'next/server';

function getBackendBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://localhost:3001';
}

export async function POST(
  request: NextRequest,
  context: any
) {
  try {
    const baseUrl = getBackendBaseUrl();
    const id = context?.params?.id;
    const token = request.headers.get('Authorization');

    if (!id) {
      return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));

    const res = await fetch(`${baseUrl}/api/v1/media/${id}/interact/like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(token ? { Authorization: token } : {}),
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      console.warn(`[api/media/[id]/interact/like] backend error: ${res.status} - ${errorText}`);
      return NextResponse.json(
        { error: 'Failed to like media', details: errorText },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[api/media/[id]/interact/like] error:', error);
    return NextResponse.json(
      { error: 'Failed to like media', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
