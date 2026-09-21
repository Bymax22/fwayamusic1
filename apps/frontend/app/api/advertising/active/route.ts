import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://localhost:3001';
    const placement = new URL(request.url).searchParams.get('placement');
    const query = placement ? `?placement=${encodeURIComponent(placement)}` : '';
    const response = await fetch(`${baseUrl}/api/v1/advertising/active${query}`, { cache: 'no-store' });
    if (!response.ok) return NextResponse.json({ campaigns: [] }, { status: response.status });
    return NextResponse.json(await response.json());
  } catch {
    return NextResponse.json({ campaigns: [] }, { status: 503 });
  }
}
