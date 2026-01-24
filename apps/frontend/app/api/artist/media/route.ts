import { NextRequest, NextResponse } from 'next/server';

// Configure for App Router
export const config = {
  maxDuration: 60,
};

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization');
    
    // Get the current user's media from backend
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/media/user/me`, {
      headers: {
        'Authorization': token || '',
      },
    });

    if (!res.ok) {
      // If backend endpoint doesn't exist or fails, return empty array
      console.warn(`Backend media endpoint returned ${res.status}: ${res.statusText}`);
      return NextResponse.json([]);
    }

    const data = await res.json();
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Failed to fetch artist media:', error);
    // Return empty array instead of error so dashboard doesn't crash
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[API Route] Media upload request received');
    const token = request.headers.get('authorization');
    const formData = await request.formData();
    
    console.log('[API Route] FormData received, forwarding to backend');

    // Upload media to backend
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/media/upload`, {
      method: 'POST',
      headers: {
        'Authorization': token || '',
      },
      body: formData,
    });

    console.log(`[API Route] Backend response: ${res.status} ${res.statusText}`);

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[API Route] Upload failed: ${res.statusText}`, errorText);
      throw new Error(`Failed to upload media: ${res.statusText} - ${errorText}`);
    }

    const data = await res.json();
    console.log('[API Route] Upload successful, returning data');
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API Route] Error:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload media' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get('authorization');
    const { searchParams } = new URL(request.url);
    const mediaId = searchParams.get('id');

    if (!mediaId) {
      return NextResponse.json(
        { error: 'Media ID is required' },
        { status: 400 }
      );
    }

    // Delete media from backend
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/media/${mediaId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': token || '',
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to delete media: ${res.statusText}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete media:', error);
    return NextResponse.json(
      { error: 'Failed to delete media' },
      { status: 500 }
    );
  }
}
