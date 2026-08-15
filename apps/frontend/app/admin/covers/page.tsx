"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CoversAdminPage() {
  const [covers, setCovers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchCovers = async () => {
      try {
        const token = localStorage.getItem('authToken') || null;
        const res = await fetch('/v1/admin/covers/pending', { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
        if (!res.ok) return;
        const data = await res.json();
        setCovers(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchCovers();
  }, []);

  const approve = async (id: number) => {
    const token = localStorage.getItem('authToken') || null;
    const res = await fetch(`/v1/admin/covers/${id}/approve`, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : undefined });
    if (res.ok) setCovers(covers.filter(c => c.id !== id));
  };

  const reject = async (id: number) => {
    const reason = prompt('Reason for rejection (optional)') || 'Rejected by admin';
    const token = localStorage.getItem('authToken') || null;
    const res = await fetch(`/v1/admin/covers/${id}/reject`, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : undefined, body: JSON.stringify({ reason }) });
    if (res.ok) setCovers(covers.filter(c => c.id !== id));
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Cover Moderation Queue</h1>
      {covers.length === 0 && <p>No pending covers</p>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {covers.map(cover => (
          <div key={cover.id} className="p-4 border rounded">
            <img src={cover.url} alt={`cover-${cover.id}`} className="w-full h-48 object-cover rounded mb-2" />
            <p className="text-sm text-gray-600">Uploaded: {new Date(cover.createdAt).toLocaleString()}</p>
            <div className="flex gap-2 mt-2">
              <button onClick={() => approve(cover.id)} className="px-3 py-2 bg-green-600 text-white rounded">Approve</button>
              <button onClick={() => reject(cover.id)} className="px-3 py-2 bg-red-600 text-white rounded">Reject</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
