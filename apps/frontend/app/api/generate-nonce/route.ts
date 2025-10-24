import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  const nonce = uuidv4(); // Generate a unique nonce
  return NextResponse.json({ nonce });
}