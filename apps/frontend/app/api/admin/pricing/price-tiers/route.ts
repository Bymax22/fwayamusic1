import { NextRequest, NextResponse } from 'next/server';

function getBackendBaseUrl() {
  return (process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://localhost:3001').replace(/\/+$/, '');
}

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${getBackendBaseUrl()}/api/admin/pricing/price-tiers`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      console.error(`Backend returned ${response.status}:`, await response.text());
      return NextResponse.json([], { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching price tiers from backend:', error);
    return NextResponse.json([], { status: 500 });
  }
}
