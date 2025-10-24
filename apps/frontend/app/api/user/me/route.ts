
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Proxy the request to the backend
    const backendRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/me`, {
      method: 'GET',
      headers: { 'Authorization': authHeader },
    });
    const data = await backendRes.json();
    if (!backendRes.ok) {
      return NextResponse.json(data, { status: backendRes.status });
    }
    return NextResponse.json(data);
  } catch (_error) {
    console.error(_error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}