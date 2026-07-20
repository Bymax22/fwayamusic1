import { NextRequest, NextResponse } from 'next/server';

function getBackendBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://localhost:3001';
}

export async function GET(request: NextRequest) {
  try {
    const baseUrl = getBackendBaseUrl();
    const token = request.headers.get('Authorization');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const res = await fetch(`${baseUrl}/api/v1/users/me/playlists`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': token,
      },
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      console.warn(`[api/user/me/playlists] backend error: ${res.status} - ${errorText}`);
      return NextResponse.json(
        { error: 'Failed to fetch playlists', details: errorText },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[api/user/me/playlists] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch playlists', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
