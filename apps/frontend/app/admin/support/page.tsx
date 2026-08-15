"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

type Ticket = {
  id: number;
  ticketId: string;
  name?: string;
  email: string;
  message: string;
  status: string;
  createdAt: string;
};

export default function AdminSupportInbox() {
  const { getToken, user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const token = await getToken();
        const skip = (page - 1) * pageSize;
        const params = new URLSearchParams();
        params.set('limit', String(pageSize));
        params.set('skip', String(skip));
        if (query.trim()) params.set('q', query.trim());
        if (statusFilter) params.set('status', statusFilter);
        const res = await fetch(`/v1/support?${params.toString()}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setTickets(data || []);
      } catch (err: any) {
        setError(err?.message || String(err));
      } finally {
        setLoading(false);
      }
    };
    if (user && ['ADMIN','MODERATOR','CONTENT_MANAGER'].includes(user.role)) load();
  }, [getToken, user, page, query, statusFilter]);

  if (!user || !['ADMIN','MODERATOR','CONTENT_MANAGER'].includes(user.role)) {
    return <div className="p-6">Access denied.</div>;
  }

  return (
    <div className="min-h-screen p-6 bg-black text-white">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold">Support Tickets</h1>
        <p className="text-sm text-gray-400 mt-1">Inbox — recent support tickets submitted by users.</p>

        <div className="mt-4 flex gap-2 items-center">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tickets" className="flex-1 px-3 py-2 bg-white/5 rounded" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 bg-white/5 rounded">
            <option value="">All</option>
            <option value="OPEN">OPEN</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="RESOLVED">RESOLVED</option>
            <option value="CLOSED">CLOSED</option>
          </select>
          <button onClick={() => setPage(1)} className="px-3 py-2 bg-purple-600 rounded">Apply</button>
        </div>

        {loading ? (
          <p className="mt-4">Loading…</p>
        ) : error ? (
          <p className="mt-4 text-red-400">{error}</p>
        ) : (
          <div className="mt-4 bg-white/3 rounded-xl p-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-300">
                  <th className="py-2 px-3">ID</th>
                  <th className="py-2 px-3">From</th>
                  <th className="py-2 px-3">Message</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id} className="border-t border-white/6">
                    <td className="py-3 px-3"><Link href={`/admin/support/${t.id}`} className="text-purple-300">{t.ticketId}</Link></td>
                    <td className="py-3 px-3">{t.name || t.email}</td>
                    <td className="py-3 px-3 truncate max-w-xs">{t.message}</td>
                    <td className="py-3 px-3">{t.status}</td>
                    <td className="py-3 px-3">{new Date(t.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 flex items-center justify-between">
              <div className="text-sm text-gray-300">Showing {tickets.length} tickets</div>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(Math.max(1, page - 1))} className="px-3 py-1 bg-white/5 rounded">Prev</button>
                <div className="px-2">{page}</div>
                <button onClick={() => setPage(page + 1)} className="px-3 py-1 bg-white/5 rounded">Next</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
