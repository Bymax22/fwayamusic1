// apps/web/src/pages/api/reseller/generate.ts

import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    try {
      const token = req.headers.authorization?.split('Bearer ')[1];
      if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Proxy the request to the backend
      const backendRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reseller/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(req.body),
      });
      const data = await backendRes.json();
      if (!backendRes.ok) {
        return res.status(backendRes.status).json(data);
      }
      return res.status(200).json(data);
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ error: 'Server error', details: String(error) });
    }
  }
  return res.status(405).end();
}