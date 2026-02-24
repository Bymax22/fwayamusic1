import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const metadata = await request.json();
    const authHeader = request.headers.get('Authorization');

    if (!metadata.url || !metadata.title || !metadata.type) {
      return NextResponse.json(
        { error: 'Missing required fields: url, title, type' },
        { status: 400 }
      );
    }

    // Forward to backend
    const backendResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/v1/media/save-metadata`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader && { Authorization: authHeader }),
        },
        body: JSON.stringify(metadata),
      }
    );

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json();
      return NextResponse.json(
        { error: errorData.message || 'Failed to save metadata' },
        { status: backendResponse.status }
      );
    }

    const result = await backendResponse.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Save metadata error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
