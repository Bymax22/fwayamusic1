
import { NextResponse } from 'next/server';

export async function GET() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/media`);
  if (!res.ok) throw new Error('Failed to fetch media');
  const media = await res.json();
  return NextResponse.json({ media });
}