import { NextResponse } from 'next/server';

function getBackendBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://localhost:3001';
}

export async function GET(request: Request, context: any) {
  try {
    const baseUrl = getBackendBaseUrl();
    const id = context?.params?.id;
    if (!id) {
      return NextResponse.json({ error: 'Missing media id' }, { status: 400 });
    }

    const res = await fetch(`${baseUrl}/api/v1/media/${id}/comments`, {
      headers: { Accept: 'application/json' },
    });

    const data = await res.text();
    if (!res.ok) {
      return NextResponse.json({ error: data || 'Failed to load comments' }, { status: res.status });
    }

    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    console.error('Failed to fetch media comments:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request, context: any) {
  try {
    const baseUrl = getBackendBaseUrl();
    const id = context?.params?.id;
    if (!id) {
      return NextResponse.json({ error: 'Missing media id' }, { status: 400 });
    }

    const body = await request.json();
    const authHeader = request.headers.get('authorization');

    const res = await fetch(`${baseUrl}/api/v1/media/${id}/comments`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify(body),
    });

    const data = await res.text();
    if (!res.ok) {
      return NextResponse.json({ error: data || 'Failed to post comment' }, { status: res.status });
    }

    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    console.error('Failed to post media comment:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
