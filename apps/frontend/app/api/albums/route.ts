import { NextRequest, NextResponse } from 'next/server';

function getBackendBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://localhost:3001';
}

export async function GET() {
  try {
    const response = await fetch(`${getBackendBaseUrl()}/api/v1/albums`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 30 },
    });

    const text = await response.text();
    let data: unknown = [];
    try {
      data = text ? JSON.parse(text) : [];
    } catch {
      data = { message: text };
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Failed to proxy public albums:', error);
    return NextResponse.json({ message: 'Failed to load releases.' }, { status: 502 });
  }
}

export const config = {
  maxDuration: 55,
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const token = request.headers.get('authorization');
    const backendRes = await fetch(`${getBackendBaseUrl()}/api/v1/albums`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(token ? { Authorization: token } : {}),
      },
      body: JSON.stringify(body),
    });

    const text = await backendRes.text();
    let data: unknown = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { message: text };
    }

    return NextResponse.json(data, { status: backendRes.status });
  } catch (error) {
    console.error('Failed to proxy album creation:', error);
    return NextResponse.json({ message: 'Failed to create release.' }, { status: 502 });
  }
}
