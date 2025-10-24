
import type { NextRequest } from 'next/server';

export const GET = async (req: NextRequest) => {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  try {
    // Proxy the request to the backend
    const backendRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/playlists`, {
      method: 'GET',
      headers: { 'Authorization': authHeader },
    });
    const data = await backendRes.json();
    if (!backendRes.ok) {
      return new Response(JSON.stringify(data), { status: backendRes.status });
    }
    return new Response(JSON.stringify(data), { status: 200 });
  } catch (_error) {
    console.error(_error);
    return new Response(JSON.stringify({ error: 'Failed to fetch playlists' }), { status: 500 });
  }
};