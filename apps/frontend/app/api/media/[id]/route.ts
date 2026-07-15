import { NextResponse } from 'next/server';

function getBackendBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://localhost:3001';
}

export async function GET(request: Request, context: any) {
  try {
    const baseUrl = getBackendBaseUrl();
    const id = context?.params?.id;
    if (!id) return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
    // Proxy the backend media endpoint. Capture and return backend errors
    // as a 502 so crawlers/in-app browsers don't see an internal server error.
    const res = await fetch(`${baseUrl}/api/v1/media/${id}`, {
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      console.warn(`[api/media/[id]] backend returned ${res.status} for id=${id} baseUrl=${baseUrl} message=${errorText}`);
      return NextResponse.json({ error: 'Upstream service error', details: errorText }, { status: Math.max(502, res.status) });
    }

    const media = await res.json();
    return NextResponse.json(media);
  } catch (error) {
    // Log contextual info to help debug requests that fail for specific UAs
    try {
      const id = context?.params?.id;
      console.error(`[api/media/[id]] fetch failed for id=${id} backend=${getBackendBaseUrl()} error=`, error);
    } catch (e) {
      console.error('[api/media/[id]] fetch failed, unable to log context', e);
    }
    return NextResponse.json({ error: 'Upstream fetch failed' }, { status: 502 });
  }
}
