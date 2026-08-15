"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function TicketDetail({ params }: { params: { id: string } }) {
  const { id } = params;
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
    <div className="min-h-screen p-6 bg-black text-white">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => router.push('/admin/support')} className="text-sm text-gray-400 mb-4">← Back</button>
        {loading ? <p>Loading…</p> : (
          ticket ? (
            <div className="bg-white/3 p-4 rounded-xl">
              <h2 className="text-lg font-semibold">{ticket.ticketId}</h2>
              <p className="text-sm text-gray-300">From: {ticket.name || ticket.email}</p>
              <p className="mt-3 text-sm">{ticket.message}</p>
              <div className="mt-4">
                <label className="text-sm text-gray-300">Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="ml-2 bg-white/5 p-2 rounded">
                  <option>OPEN</option>
                  <option>IN_PROGRESS</option>
                  <option>RESOLVED</option>
                  <option>CLOSED</option>
                </select>
                <button onClick={updateStatus} className="ml-3 bg-purple-600 px-3 py-2 rounded">Update</button>
              </div>
            </div>
          ) : <p className="text-red-400">Ticket not found</p>
        )}
      </div>
    </div>
  );
}
