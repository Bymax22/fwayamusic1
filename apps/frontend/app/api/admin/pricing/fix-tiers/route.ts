import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
  try {
    const response = await fetch(`${API_URL}/admin/pricing/price-tiers/fix-expired`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      console.error(`Backend returned ${response.status}:`, await response.text());
      return NextResponse.json(
        { error: `Failed to fix price tiers: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fixing price tiers:', error);
    return NextResponse.json(
      { error: 'Failed to fix price tiers from backend' },
      { status: 500 }
    );
  }
}
