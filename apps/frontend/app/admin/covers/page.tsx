"use client";

import React, { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';

export default function CoversAdminPage() {
  const [covers, setCovers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <main className="min-h-screen bg-[#f5f6f8] p-8 text-slate-500">Loading moderation queue...</main>;

  return (
    <main className="min-h-screen bg-[#f5f6f8] px-5 py-8 text-slate-950 sm:px-8 lg:px-10"><div className="mx-auto max-w-7xl">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-700">Control center</p>
      <h1 className="mt-2 text-3xl font-semibold">Cover moderation</h1>
      <p className="mt-2 text-sm text-slate-500">Review artwork before it appears across the platform.</p>
      {covers.length === 0 && <div className="mt-7 rounded-2xl bg-white p-6 text-slate-500 shadow-sm">No pending covers.</div>}
      <div className="mt-7 grid grid-cols-1 gap-5 md:grid-cols-3">
        {covers.map(cover => (
          <div key={cover.id} className="overflow-hidden rounded-2xl bg-white p-4 shadow-sm">
            <img src={cover.url} alt={`cover-${cover.id}`} className="mb-3 h-56 w-full rounded-xl object-cover" />
            <p className="text-sm text-slate-500">Uploaded: {new Date(cover.createdAt).toLocaleString()}</p>
            <div className="flex gap-2 mt-2">
              <button onClick={() => approve(cover.id)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-100 px-3 py-2 text-sm text-emerald-700"><Check size={15} /> Approve</button>
              <button onClick={() => reject(cover.id)} className="inline-flex items-center gap-2 rounded-xl bg-red-100 px-3 py-2 text-sm text-red-700"><X size={15} /> Reject</button>
            </div>
          </div>
        ))}
      </div>
    </div></main>
  );
}
