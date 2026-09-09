import { NextRequest, NextResponse } from 'next/server';

function getBackendBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://localhost:3001';
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const token = request.headers.get('authorization');
    const body = await request.json();
    const response = await fetch(`${getBackendBaseUrl()}/api/v1/albums/${id}/tracks/order`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(token ? { Authorization: token } : {}) },
      body: JSON.stringify(body),
    });
    const text = await response.text();
    let data: unknown = {};
    try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Failed to reorder tracks' }, { status: 500 });
  }
}