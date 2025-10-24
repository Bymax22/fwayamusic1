
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/artists`);
    if (!res.ok) throw new Error('Failed to fetch artists');
    const artists = await res.json();
    return NextResponse.json({ artists });
  } catch (error) {
    console.error('Failed to fetch artists:', error);
    return NextResponse.json({ error: 'Failed to fetch artists' }, { status: 500 });
  }
}