import { NextRequest, NextResponse } from 'next/server';

function getBackendBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://localhost:3001';
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const field = params.get('field');
  const value = params.get('value');

  if (!field || !value || !['email', 'username'].includes(field)) {
    return NextResponse.json({ available: false }, { status: 400 });
  }

  try {
    const response = await fetch(
      `${getBackendBaseUrl()}/api/v1/auth/check-availability?field=${field}&value=${encodeURIComponent(value)}`,
      { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(8000) },
    );

    if (!response.ok) {
      return NextResponse.json({ available: false }, { status: response.status });
    }

    return NextResponse.json(await response.json());
  } catch (error) {
    console.error('Availability proxy failed:', error);
    return NextResponse.json({ available: false }, { status: 502 });
  }
}
