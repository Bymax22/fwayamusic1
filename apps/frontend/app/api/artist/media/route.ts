import { NextRequest, NextResponse } from 'next/server';

// Configure for App Router - 55 seconds timeout (Vercel limit is 60s)
export const config = {
  maxDuration: 55,
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
    console.log('[API Route] Media metadata save request received');
    const token = request.headers.get('authorization');
    const formData = await request.formData();
    
    // Extract metadata (file has already been uploaded to Cloudinary)
    const title = formData.get('title');
    const type = formData.get('type');
    const url = formData.get('url');
    const cloudinaryPublicId = formData.get('cloudinaryPublicId');
    const duration = formData.get('duration');
    const format = formData.get('format');
    const resourceType = formData.get('resourceType');
    
    console.log('[API Route] Received metadata:', { title, type, url, cloudinaryPublicId });

    // Check if this is a file upload (old way) or metadata-only (new way)
    const file = formData.get('file');
    
    if (file && file instanceof File) {
      // Old way: File upload - shouldn't happen anymore but keep for compatibility
      console.log('[API Route] File upload detected, forwarding to backend');
      
      const controller = new AbortController();
      const timeout = setTimeout(() => {
        console.error('[API Route] Request timeout after 50 seconds');
        controller.abort();
      }, 50000);

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/media/upload`, {
          method: 'POST',
          headers: {
            'Authorization': token || '',
          },
          body: formData,
          signal: controller.signal,
        });

        clearTimeout(timeout);
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error(`[API Route] Upload failed: ${res.statusText}`, errorText);
          throw new Error(`Failed to upload media: ${res.statusText} - ${errorText}`);
        }

        const data = await res.json();
        console.log('[API Route] Upload successful');
        return NextResponse.json(data);
      } catch (fetchError) {
        clearTimeout(timeout);
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          console.error('[API Route] Request aborted - timeout or other abort');
          return NextResponse.json(
            { error: 'Upload request timed out - file may be too large' },
            { status: 504 }
          );
        }
        throw fetchError;
      }
    } else {
      // New way: Metadata-only (file already uploaded to Cloudinary client-side)
      console.log('[API Route] Metadata-only request, saving to database');
      
      if (!url || !title || !type) {
        return NextResponse.json(
          { error: 'Missing required fields: title, type, and url' },
          { status: 400 }
        );
      }

      // Create metadata object for database
      const metadata = {
        title,
        type,
        url,
        cloudinaryPublicId,
        duration: duration ? parseInt(duration as string) : 0,
        format,
        resourceType,
      };

      // Send to backend to save metadata only (no file upload)
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/media/save-metadata`, {
        method: 'POST',
        headers: {
          'Authorization': token || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metadata),
      });

      console.log(`[API Route] Backend metadata save response: ${res.status} ${res.statusText}`);

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`[API Route] Metadata save failed: ${res.statusText}`, errorText);
        throw new Error(`Failed to save media metadata: ${res.statusText} - ${errorText}`);
      }

      const data = await res.json();
      console.log('[API Route] Metadata save successful');
      return NextResponse.json(data);
    }
  } catch (error) {
    console.error('[API Route] Error:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process media request' },
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
