import { NextResponse } from 'next/server';

function getBackendBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://localhost:3001';
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const authorization = request.headers.get('authorization');
  if (!authorization) {
    return NextResponse.json({ message: 'Sign in to play this track.' }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    if (!/^\d+$/.test(id)) {
      return NextResponse.json({ message: 'A valid media ID is required.' }, { status: 400 });
    }

    const response = await fetch(
      `${getBackendBaseUrl()}/api/v1/media/${id}/playback`,
      {
        headers: { Authorization: authorization, Accept: 'application/json' },
        cache: 'no-store',
      }
    );
    const payload = await response.json().catch(() => ({}));
    return NextResponse.json(payload, {
      status: response.status,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('Failed to authorize protected media playback:', error);
    return NextResponse.json(
      { message: 'Could not authorize playback. Please try again.' },
      { status: 502 }
    );
  }
}
