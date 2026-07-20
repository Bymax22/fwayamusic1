import { NextRequest, NextResponse } from 'next/server';

function getBackendBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://localhost:3001';
}

export async function GET(
  request: NextRequest,
  context: any
) {
  try {
    const baseUrl = getBackendBaseUrl();
    const playlistId = context?.params?.id;
    const token = request.headers.get('Authorization');

    if (!playlistId) {
      return NextResponse.json({ error: 'Missing playlist id' }, { status: 400 });
    }

    const res = await fetch(`${baseUrl}/api/v1/playlist/${playlistId}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: token } : {}),
      },
    });

    const data = await res.json().catch(async () => {
      const text = await res.text();
      return { error: text || 'Failed to fetch playlist' };
    });

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('[api/playlists/[id]] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch playlist', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: any
) {
  try {
    const baseUrl = getBackendBaseUrl();
    const playlistId = context?.params?.id;
    const token = request.headers.get('Authorization');

    if (!playlistId) {
      return NextResponse.json({ error: 'Missing playlist id' }, { status: 400 });
    }

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));

    const res = await fetch(`${baseUrl}/api/v1/playlist/${playlistId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: token,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      console.warn(`[api/playlists/[id]] backend error: ${res.status} - ${errorText}`);
      return NextResponse.json(
        { error: 'Failed to update playlist', details: errorText },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[api/playlists/[id]] error:', error);
    return NextResponse.json(
      { error: 'Failed to update playlist', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: any
) {
  try {
    const baseUrl = getBackendBaseUrl();
    const playlistId = context?.params?.id;
    const token = request.headers.get('Authorization');

    if (!playlistId) {
      return NextResponse.json({ error: 'Missing playlist id' }, { status: 400 });
    }

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const res = await fetch(`${baseUrl}/api/v1/playlist/${playlistId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: token,
      },
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      console.warn(`[api/playlists/[id]] backend error: ${res.status} - ${errorText}`);
      return NextResponse.json(
        { error: 'Failed to delete playlist', details: errorText },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[api/playlists/[id]] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete playlist', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
