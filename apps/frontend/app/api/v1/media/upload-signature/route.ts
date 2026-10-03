import { NextResponse } from 'next/server';

function getBackendBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://localhost:3001';
}

export async function POST(request: Request) {
  const authorization = request.headers.get('authorization');
  if (!authorization) {
    return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const response = await fetch(`${getBackendBaseUrl()}/api/v1/media/upload-signature`, {
      method: 'POST',
      headers: {
        Authorization: authorization,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => ({}));
    return NextResponse.json(payload, { status: response.status });
  } catch (error) {
    console.error('Failed to request Cloudinary upload signature:', error);
    return NextResponse.json(
      { message: 'Could not prepare the media upload.' },
      { status: 502 }
    );
  }
}
