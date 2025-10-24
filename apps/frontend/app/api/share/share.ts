// apps/web/src/pages/api/media/share.ts

import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    try {
      let { mediaId } = req.body;
      mediaId = typeof mediaId === "string" ? parseInt(mediaId, 10) : mediaId;
      if (!mediaId || isNaN(mediaId)) {
        return res.status(400).json({ error: 'Invalid mediaId' });
      }

      // Proxy the request to the backend
      const backendRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/media/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaId }),
      });
      const data = await backendRes.json();
      if (!backendRes.ok) {
        return res.status(backendRes.status).json(data);
      }
      return res.status(200).json(data);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to increment share count', details: String(error) });
    }
  }
  return res.status(405).end();
}