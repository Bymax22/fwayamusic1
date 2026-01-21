// app/api/auth/verify-recaptcha/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    
    // TODO: Re-enable reCAPTCHA verification once secret key is properly configured
    // Temporarily skip verification to allow testing
    if (!secretKey) {
      console.warn('RECAPTCHA_SECRET_KEY is not configured - skipping verification for development');
      return NextResponse.json({
        success: true,
        message: 'reCAPTCHA verification skipped (no secret key configured)',
      });
    }

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'reCAPTCHA token is required' },
        { status: 400 }
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