import { NextResponse } from 'next/server';
import { getFeaturedContentData } from '@/lib/featuredContent';

export async function GET() {
  const data = await getFeaturedContentData();
  return NextResponse.json(data);
}