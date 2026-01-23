import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization');
    
    // Get the current user's followers from backend
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/followers/my-followers`, {
      headers: {
        'Authorization': token || '',
      },
    });

    if (!res.ok) {
      // If endpoint doesn't exist, return empty array
      if (res.status === 404) {
        return NextResponse.json([]);
      }
      throw new Error(`Failed to fetch followers: ${res.statusText}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch artist followers:', error);
    // Return empty array instead of error to avoid breaking the dashboard
    return NextResponse.json([]);
  }
}
