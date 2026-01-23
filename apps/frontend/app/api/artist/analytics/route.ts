import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // For now, return basic analytics structure
    // This would be extended to fetch from backend when analytics endpoint is created
    const analytics = {
      chartData: [
        { month: 'Jan', plays: 0, downloads: 0 },
        { month: 'Feb', plays: 0, downloads: 0 },
        { month: 'Mar', plays: 0, downloads: 0 },
        { month: 'Apr', plays: 0, downloads: 0 },
        { month: 'May', plays: 0, downloads: 0 },
        { month: 'Jun', plays: 0, downloads: 0 },
      ],
      topTracks: [],
      topCountries: [],
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Failed to fetch artist analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
