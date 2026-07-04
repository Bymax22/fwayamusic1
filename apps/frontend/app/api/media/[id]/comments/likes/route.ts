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

    const authHeader = request.headers.get('authorization');

    const res = await fetch(`${baseUrl}/api/v1/media/${id}/comments/likes`, {
      headers: {
        Accept: 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
    });

    const data = await res.text();
    if (!res.ok) {
      return NextResponse.json({ error: data || 'Failed to fetch liked comments' }, { status: res.status });
    }

    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    console.error('Failed to proxy liked comments:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
