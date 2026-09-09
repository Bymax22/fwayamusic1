import { NextRequest, NextResponse } from 'next/server';

function getBackendBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://localhost:3001';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const source = body.source || 'website-help-support';
    const fallbackType = body.type || 'GENERAL';
    const subject = body.metadata?.subject || body.subject || body.reason || 'General enquiry';
    const payload = {
      name: body.name || 'Guest',
      email: body.email,
      message: body.message,
      source,
      type: fallbackType,
      metadata: {
        ...(body.metadata || {}),
        subject,
        source,
        channel: body.channel || 'web',
        contactType: body.contactType || body.type || 'GENERAL',
        path: body.path || request.nextUrl.pathname,
        company: body.company || null,
        requestOrigin: body.requestOrigin || 'frontend-support-proxy',
      },
    };

    if (!payload.email || !payload.message) {
      return NextResponse.json({ message: 'email and message are required' }, { status: 400 });
    }

    const backendRes = await fetch(`${getBackendBaseUrl()}/v1/support`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const text = await backendRes.text();
    let data: unknown = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { message: text || 'Support request submitted' };
    }

    return NextResponse.json(data, { status: backendRes.status });
  } catch (error) {
    console.error('Failed to proxy support request:', error);
    return NextResponse.json({ message: 'Failed to submit support request.' }, { status: 502 });
  }
}
