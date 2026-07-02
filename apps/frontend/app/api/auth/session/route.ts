import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = body?.token;

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Auth token is required to establish the session cookie.' },
        { status: 400 }
      );
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set({
      name: 'authToken',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60, // 1 hour, aligned with Firebase ID token expiry
    });

    return response;
  } catch (error) {
    console.error('Failed to set auth session cookie:', error);
    return NextResponse.json(
      { error: 'Failed to create auth session.' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const response = NextResponse.json({ success: true });
    response.cookies.delete('authToken', { path: '/' });
    return response;
  } catch (error) {
    console.error('Failed to clear auth session cookie:', error);
    return NextResponse.json(
      { error: 'Failed to clear auth session.' },
      { status: 500 }
    );
  }
}
