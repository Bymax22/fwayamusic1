// app/api/auth/verify-recaptcha/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    console.debug('reCAPTCHA verification request received:', {
      hasToken: !!token,
      tokenLength: token ? String(token).length : 0,
      requestBody: body,
    });

    if (!token || typeof token !== 'string' || token.trim() === '') {
      console.error('Invalid reCAPTCHA token:', { token, type: typeof token });
      return NextResponse.json(
        { success: false, message: 'reCAPTCHA token is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    
    if (!secretKey) {
      console.error('RECAPTCHA_SECRET_KEY is not configured');
      return NextResponse.json(
        { success: false, message: 'Server configuration error - reCAPTCHA secret key not set' },
        { status: 500 }
      );
    }

    const verificationUrl = 'https://www.google.com/recaptcha/api/siteverify';
    const params = new URLSearchParams();
    params.append('secret', secretKey);
    params.append('response', token);

    console.debug('Sending verification request to Google:', {
      url: verificationUrl,
      tokenLength: token.length,
    });

    const resp = await fetch(verificationUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!resp.ok) {
      console.error('Google reCAPTCHA API returned non-200 status:', resp.status, resp.statusText);
      const text = await resp.text();
      console.error('Google reCAPTCHA API response:', text);
      return NextResponse.json(
        { success: false, message: 'reCAPTCHA verification service error' },
        { status: 400 }
      );
    }

    const data = await resp.json();

    console.debug('Google reCAPTCHA response:', {
      success: data.success,
      score: data.score,
      action: data.action,
      errorCodes: data['error-codes'],
    });

    // Accept v2 (no score) or v3 with score threshold
    // For v3, accept scores >= 0.0 (very permissive - Google verified it successfully)
    // In production, consider raising to 0.5 after monitoring bot traffic patterns
    const scoreOk = data.score === undefined ? true : data.score >= 0.0;

    if (data.success && scoreOk) {
      console.debug('reCAPTCHA verification successful:', {
        score: data.score,
        hostname: data.hostname,
      });
      return NextResponse.json({
        success: true,
        score: data.score,
        message: 'reCAPTCHA verification successful',
      });
    }

    // Provide detailed error information
    console.error('reCAPTCHA verification failed:', {
      success: data.success,
      score: data.score,
      scoreOk,
      errorCodes: data['error-codes'],
      hostname: data.hostname,
      challenge_ts: data.challenge_ts,
    });
    return NextResponse.json(
      {
        success: false,
        message: `reCAPTCHA verification failed${data['error-codes']?.length ? ': ' + data['error-codes'].join(', ') : ''}`,
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