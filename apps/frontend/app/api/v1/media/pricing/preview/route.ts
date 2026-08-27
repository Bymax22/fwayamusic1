import { NextRequest, NextResponse } from 'next/server';

function getBackendBaseUrl() {
  return (process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://localhost:3001').replace(/\/+$/, '');
}

export async function GET(request: NextRequest) {
  const priceTierId = request.nextUrl.searchParams.get('priceTierId');
  const directPrice = request.nextUrl.searchParams.get('directPrice');
  const params = new URLSearchParams();
  if (priceTierId) params.set('priceTierId', priceTierId);
  if (directPrice) params.set('directPrice', directPrice);

  try {
    const response = await fetch(`${getBackendBaseUrl()}/api/v1/media/pricing/preview?${params.toString()}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    });

    const data = await response.json().catch(() => ({ error: 'Invalid pricing response' }));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Pricing preview proxy failed:', error);
    return NextResponse.json({ error: 'Unable to load pricing preview' }, { status: 502 });
  }
}
