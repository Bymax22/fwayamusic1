import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization');
    
    // Get the current user's commissions from backend
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/commission`, {
      headers: {
        'Authorization': token || '',
      },
    });

    if (!res.ok) {
      // If endpoint doesn't exist, return empty array
      if (res.status === 404) {
        return NextResponse.json([]);
      }
      throw new Error(`Failed to fetch commissions: ${res.statusText}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch artist commissions:', error);
    // Return empty array instead of error to avoid breaking the dashboard
    return NextResponse.json([]);
  }
}
