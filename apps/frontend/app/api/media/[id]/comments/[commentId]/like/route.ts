import { NextResponse } from 'next/server';

function getBackendBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://localhost:3001';
}

export async function GET(request: Request, context: any) {
  return proxyLikeRequest(request, context, 'GET');
}

export async function POST(request: Request, context: any) {
  return proxyLikeRequest(request, context, 'POST');
}

export async function DELETE(request: Request, context: any) {
  return proxyLikeRequest(request, context, 'DELETE');
}

async function proxyLikeRequest(request: Request, context: any, method: 'GET' | 'POST' | 'DELETE') {
  try {
    const baseUrl = getBackendBaseUrl();
    const id = context?.params?.id;
    const commentId = context?.params?.commentId;
    if (!id || !commentId) {
      return NextResponse.json({ error: 'Missing media id or comment id' }, { status: 400 });
    }

    const authHeader = request.headers.get('authorization');

    const res = await fetch(`${baseUrl}/api/v1/media/${id}/comments/${commentId}/like`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
    });

    const data = await res.text();
    if (!res.ok) {
      return NextResponse.json({ error: data || 'Failed to update comment like' }, { status: res.status });
    }

    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    console.error('Failed to proxy comment like:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
