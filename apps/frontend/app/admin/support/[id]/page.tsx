"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function TicketDetail() {
  const params = useParams();
  const id = (params as any)?.id as string | undefined;
  const { getToken, user } = useAuth();
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('OPEN');
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const token = await getToken();
        const res = await fetch(`/v1/support/${id}`, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setTicket(data);
        setStatus(data?.status || 'OPEN');
      } catch (err) {
        console.error(err);
      } finally { setLoading(false); }
    };
    if (user && ['ADMIN','MODERATOR','CONTENT_MANAGER'].includes(user.role)) load();
  }, [id, getToken, user]);

  const updateStatus = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`/v1/support/${id}`, { method: 'PATCH', headers: { 'content-type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ status }) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      router.push('/admin/support');
    } catch (err) { console.error(err); }
  };

  if (!user || !['ADMIN','MODERATOR','CONTENT_MANAGER'].includes(user.role)) return <div className="p-6">Access denied.</div>;

  return (
    <div className="min-h-screen bg-[#f5f6f8] p-6 text-slate-950 sm:p-8">
      <div className="mx-auto max-w-3xl">
        <button onClick={() => router.push('/admin/support')} className="mb-4 text-sm text-purple-700">← Back to support center</button>
        {loading ? <p>Loading…</p> : (
          ticket ? (
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-700">Support conversation</p><h2 className="mt-2 text-lg font-semibold">{ticket.ticketId}</h2>
              <p className="text-sm text-slate-500">From: {ticket.name || ticket.email}</p>
              <p className="mt-3 text-sm text-slate-700">{ticket.message}</p>
              <div className="mt-4">
                <label className="text-sm text-slate-600">Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="ml-2 rounded-xl bg-slate-100 p-2 text-slate-950">
                  <option>OPEN</option>
                  <option>IN_PROGRESS</option>
                  <option>RESOLVED</option>
                  <option>CLOSED</option>
                </select>
                <button onClick={updateStatus} className="ml-3 rounded-xl bg-purple-700 px-3 py-2 text-white">Update</button>
              </div>
            </div>
          ) : <p className="text-red-400">Ticket not found</p>
        )}
      </div>
    </div>
  );
}
