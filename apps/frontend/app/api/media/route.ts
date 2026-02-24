
import { NextResponse } from 'next/server';

export async function GET() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/media`);
  if (!res.ok) throw new Error('Failed to fetch media');
  const media = await res.json();
  return NextResponse.json(media);
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Forward the file to the backend upload-avatar endpoint
    const backendFormData = new FormData();
    backendFormData.append('file', file);

    const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/media/upload-avatar`, {
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