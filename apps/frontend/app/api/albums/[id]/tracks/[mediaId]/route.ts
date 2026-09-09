import { NextRequest, NextResponse } from 'next/server';

function getBackendBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://localhost:3001';
}

async function proxy(request: NextRequest, context: { params: Promise<{ id: string; mediaId: string }> }, method: 'POST' | 'DELETE') {
  try {
    const { id, mediaId } = await context.params;
    const token = request.headers.get('authorization');
    const response = await fetch(`${getBackendBaseUrl()}/api/v1/albums/${id}/tracks/${mediaId}`, {
      method,
      headers: { Accept: 'application/json', ...(token ? { Authorization: token } : {}) },
    });
    const text = await response.text();
    let data: unknown = {};
    try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Album track operation failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string; mediaId: string }> }) {
  return proxy(request, context, 'POST');
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string; mediaId: string }> }) {
  return proxy(request, context, 'DELETE');
}