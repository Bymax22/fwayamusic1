// app/api/auth/verify-recaptcha/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'reCAPTCHA token is required' },
        { status: 400 }
      );
    }

    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    if (!secretKey) {
      console.error('RECAPTCHA_SECRET_KEY is not configured');
      return NextResponse.json(
        { success: false, message: 'Server configuration error' },
        { status: 500 }
      );
    }

    const verificationUrl = 'https://www.google.com/recaptcha/api/siteverify';
    const params = new URLSearchParams();
    params.append('secret', secretKey);
    params.append('response', token);

    const resp = await fetch(verificationUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const data = await resp.json();

    // Accept v2 (no score) or v3 with score threshold
    const scoreOk = data.score === undefined ? true : data.score >= 0.5;

    if (data.success && scoreOk) {
      return NextResponse.json({
        success: true,
        score: data.score,
        message: 'reCAPTCHA verification successful',
      });
    }

    console.error('reCAPTCHA verification failed:', data);
    return NextResponse.json(
      {
        success: false,
        message: 'reCAPTCHA verification failed',
        errorCodes: data['error-codes'] || null,
        raw: data,
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}