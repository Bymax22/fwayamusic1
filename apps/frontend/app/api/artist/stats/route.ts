import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization');
    
    // For now, return basic stats structure
    // This would be extended to fetch from backend when stats endpoint is created
    const stats = {
      totalPlays: 0,
      totalDownloads: 0,
      totalEarnings: 0,
      totalFollowers: 0,
      thisMonthPlays: 0,
      thisMonthEarnings: 0,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Failed to fetch artist stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
