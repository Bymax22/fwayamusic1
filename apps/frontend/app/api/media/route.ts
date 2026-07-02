import { NextResponse } from 'next/server';

function getBackendBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://localhost:3001';
}

export async function GET() {
  try {
    const baseUrl = getBackendBaseUrl();
    const start = Date.now();
    const res = await fetch(`${baseUrl}/api/v1/media`, {
      headers: { Accept: 'application/json' },
    });

    const upstreamMs = Date.now() - start;

    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      console.error('Backend media request failed:', res.status, errorText);
      // Surface upstream error to make debugging easier instead of returning silent empty arrays
      return NextResponse.json({ error: errorText || 'Upstream error' }, { status: res.status || 502, headers: { 'x-upstream-ms': String(upstreamMs) } });
    }

    const media = await res.json();
    return NextResponse.json(media, { headers: { 'x-upstream-ms': String(upstreamMs) } });
  } catch (error) {
    console.error('Failed to fetch media:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const baseUrl = getBackendBaseUrl();

    // Forward the file to the backend upload-avatar endpoint
    const backendFormData = new FormData();
    backendFormData.append('file', file);

    const uploadResponse = await fetch(`${baseUrl}/api/v1/media/upload-avatar`, {
      method: 'POST',
      body: backendFormData,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Backend upload error:', errorText);
      return NextResponse.json({ error: 'Upload failed' }, { status: uploadResponse.status });
    }

    const uploadData = await uploadResponse.json();
    return NextResponse.json(uploadData);
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}