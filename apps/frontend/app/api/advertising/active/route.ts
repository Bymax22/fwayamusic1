import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://localhost:3001';
    const response = await fetch(`${baseUrl}/api/v1/advertising/active`, { cache: 'no-store' });
    if (!response.ok) return NextResponse.json({ campaigns: [] }, { status: response.status });
    return NextResponse.json(await response.json());
  } catch {
    return NextResponse.json({ campaigns: [] }, { status: 503 });
  }
}
