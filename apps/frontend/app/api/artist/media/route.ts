import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization');
    
    // Get the current user's media from backend
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/media/user/me`, {
      headers: {
        'Authorization': token || '',
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch media: ${res.statusText}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch artist media:', error);
    return NextResponse.json(
      { error: 'Failed to fetch media' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization');
    const formData = await request.formData();

    // Upload media to backend
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/media/upload`, {
      method: 'POST',
      headers: {
        'Authorization': token || '',
      },
      body: formData,
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Upload failed: ${res.statusText}`, errorText);
      throw new Error(`Failed to upload media: ${res.statusText}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to upload media:', error);
    return NextResponse.json(
      { error: 'Failed to upload media' },
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
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/media/${mediaId}`, {
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
