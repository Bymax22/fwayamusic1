import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const mediaId = searchParams.get('mediaId')
  const deviceId = searchParams.get('deviceId')
  const licenseKey = searchParams.get('licenseKey')

  if (!mediaId || !deviceId || !licenseKey) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
  }

  try {
    // Proxy the request to the backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000'
    const response = await fetch(`${backendUrl}/drm/validate/${mediaId}`, {
      method: 'GET',
      headers: {
        'device-id': deviceId,
        'license-key': licenseKey,
      },
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('License validation proxy error:', error)
    return NextResponse.json({ error: 'Validation failed' }, { status: 500 })
  }
}