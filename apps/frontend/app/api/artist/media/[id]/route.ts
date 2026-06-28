import { NextRequest, NextResponse } from 'next/server';

interface Params {
  id: string;
}

function getBackendBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://localhost:3001';
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { id } = await params;
    const token = request.headers.get('authorization');
    const baseUrl = getBackendBaseUrl();

    // Delete media from backend
    const res = await fetch(`${baseUrl}/api/v1/media/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': token || '',
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to delete media: ${res.status} ${res.statusText}${errorText ? ` - ${errorText}` : ''}`);
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
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { id } = await params;
    const token = request.headers.get('authorization');
    const body = await request.json();
    const baseUrl = getBackendBaseUrl();

    // Update media on backend
    const res = await fetch(`${baseUrl}/api/v1/media/${id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': token || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to update media: ${res.status} ${res.statusText}${errorText ? ` - ${errorText}` : ''}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to update media:', error);
    return NextResponse.json(
      { error: 'Failed to update media' },
      { status: 500 }
    );
  }
}