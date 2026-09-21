"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { subscribe } from '@/lib/realtime';

type Ticket = {
  id: number;
  ticketId: string;
  name?: string;
  email: string;
  message: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  unreadCount: number;
  assignedTo?: { id: number; displayName?: string; username: string; role: string } | null;
  messages?: Message[];
};
type Message = { id: number; body: string; senderName?: string | null; isStaff: boolean; createdAt: string };
type Agent = { id: number; displayName?: string | null; username: string; role: string };

export default function AdminSupportInbox() {
  const { getToken, user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [onlineAgents, setOnlineAgents] = useState<number[]>([]);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const pageSize = 20;

  const authHeaders = async (): Promise<Record<string, string>> => {
    const token = await getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const loadTickets = async () => {
    const headers = await authHeaders();
    const skip = (page - 1) * pageSize;
    const params = new URLSearchParams({ limit: String(pageSize), skip: String(skip) });
    if (query.trim()) params.set('q', query.trim());
    if (statusFilter) params.set('status', statusFilter);
    const res = await fetch(`/v1/support?${params.toString()}`, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    setTickets(await res.json());
  };

  const loadSelected = async (id: number) => {
    const res = await fetch(`/v1/support/${id}`, { headers: await authHeaders() });
    if (res.ok) setSelected(await res.json());
  };

  useEffect(() => {
    if (!user || !['ADMIN','MODERATOR','CONTENT_MANAGER'].includes(user.role)) return;
    setLoading(true);
    void Promise.all([loadTickets(), authHeaders().then((headers) => fetch('/v1/support/agents', { headers })).then((res) => res.ok ? res.json() : [])])
      .then(([, staff]) => setAgents(staff))
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }, [user, page, query, statusFilter]);

  useEffect(() => {
    if (!user) return;
    let cleanups: Array<() => void> = [];
    void getToken().then(async (token) => {
      const events = await Promise.all([
        subscribe('support:ticket-created', () => void loadTickets(), token),
        subscribe('support:ticket-updated', (ticket) => { void loadTickets(); if (selected?.id === ticket.id) void loadSelected(ticket.id); }, token),
        subscribe('support:message-created', (event) => { void loadTickets(); if (selected?.id === event.ticketId) void loadSelected(event.ticketId); }, token),
        subscribe('support:presence', (agentsOnline) => setOnlineAgents((agentsOnline || []).map((agent: Agent) => agent.id)), token),
      ]);
      cleanups = events;
    });
    return () => cleanups.forEach((cleanup) => cleanup());
  }, [user, selected?.id]);

  const selectTicket = async (ticket: Ticket) => {
    setSelected(ticket);
    await loadSelected(ticket.id);
    await fetch(`/v1/support/${ticket.id}/read`, { method: 'PATCH', headers: await authHeaders() });
    setTickets((current) => current.map((item) => item.id === ticket.id ? { ...item, unreadCount: 0 } : item));
  };

  const updateTicket = async (data: Record<string, unknown>) => {
    if (!selected) return;
    await fetch(`/v1/support/${selected.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...(await authHeaders()) }, body: JSON.stringify(data) });
    await loadTickets();
    await loadSelected(selected.id);
  };

  const sendReply = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected || !reply.trim()) return;
    setSending(true);
    try {
      await fetch(`/v1/support/${selected.id}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(await authHeaders()) }, body: JSON.stringify({ body: reply.trim() }) });
      setReply('');
      await loadSelected(selected.id);
    } finally { setSending(false); }
  };

  if (!user || !['ADMIN','MODERATOR','CONTENT_MANAGER'].includes(user.role)) {
    return <div className="p-6">Access denied.</div>;
  }

  return (
    <div className="min-h-screen bg-[#f5f6f8] p-6 text-slate-950 sm:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-700">Control center</p><h1 className="mt-2 text-2xl font-semibold">Live support center</h1><p className="mt-1 text-sm text-slate-500">Realtime conversations, assignment, status, and unread tickets.</p></div><div className="rounded-xl bg-black px-3 py-2 text-sm text-white">{onlineAgents.length} agent{onlineAgents.length === 1 ? '' : 's'} online</div></div>

        <div className="mt-4 flex gap-2 items-center">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tickets" className="flex-1 rounded-xl bg-white px-3 py-2.5 text-slate-950 shadow-sm outline-none" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl bg-white px-3 py-2.5 text-slate-950 shadow-sm">
            <option value="">All</option>
            <option value="OPEN">OPEN</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="RESOLVED">RESOLVED</option>
            <option value="CLOSED">CLOSED</option>
          </select>
          <button onClick={() => setPage(1)} className="rounded-xl bg-purple-700 px-4 py-2.5 text-white shadow-sm">Apply</button>
        </div>

        {loading ? (
          <p className="mt-4">Loading…</p>
        ) : error ? (
          <p className="mt-4 rounded-xl bg-red-100 p-4 text-red-700">{error}</p>
        ) : (
          <div className="mt-4 grid min-h-[620px] gap-4 lg:grid-cols-[360px_1fr]">
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="px-4 py-3 text-sm text-slate-500">{tickets.length} conversations</div>
              <div className="max-h-[560px] overflow-y-auto">{tickets.map((ticket) => <button key={ticket.id} onClick={() => void selectTicket(ticket)} className={`w-full p-4 text-left hover:bg-purple-50 ${selected?.id === ticket.id ? 'bg-purple-100' : ''}`}><div className="flex items-center justify-between gap-2"><span className="truncate font-medium text-slate-950">{ticket.name || ticket.email}</span>{ticket.unreadCount > 0 && <span className="rounded-full bg-purple-700 px-2 py-0.5 text-xs text-white">{ticket.unreadCount}</span>}</div><p className="mt-1 truncate text-xs text-slate-500">{ticket.message}</p><div className="mt-2 flex justify-between text-[11px] text-slate-400"><span>{ticket.status}</span><span>{new Date(ticket.updatedAt || ticket.createdAt).toLocaleString()}</span></div></button>)}</div>
            </div>
            <div className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm">
              {!selected ? <div className="flex flex-1 items-center justify-center text-sm text-slate-400">Select a conversation</div> : <>
                <div className="flex flex-wrap items-center justify-between gap-3 p-4"><div><h2 className="font-semibold text-slate-950">{selected.name || selected.email}</h2><p className="text-xs text-slate-500">{selected.email} · {selected.ticketId}</p></div><div className="flex gap-2"><select value={selected.status} onChange={(event) => void updateTicket({ status: event.target.value })} className="rounded-xl bg-slate-100 px-2 py-1 text-xs text-slate-950"><option>OPEN</option><option>IN_PROGRESS</option><option>RESOLVED</option><option>CLOSED</option></select><select value={selected.assignedTo?.id || ''} onChange={(event) => void updateTicket({ assignedToId: event.target.value ? Number(event.target.value) : null })} className="max-w-[170px] rounded-xl bg-slate-100 px-2 py-1 text-xs text-slate-950"><option value="">Unassigned</option>{agents.map((agent) => <option key={agent.id} value={agent.id}>{onlineAgents.includes(agent.id) ? '● ' : ''}{agent.displayName || agent.username}</option>)}</select></div></div>
                <div className="flex-1 space-y-3 overflow-y-auto p-4">{(selected.messages || []).map((message) => <div key={message.id} className={`max-w-[80%] rounded-xl p-3 text-sm ${message.isStaff ? 'ml-auto bg-purple-100 text-purple-950' : 'bg-slate-100 text-slate-950'}`}><p>{message.body}</p><p className="mt-1 text-[11px] text-slate-500">{message.senderName || (message.isStaff ? 'Support' : selected.name)} · {new Date(message.createdAt).toLocaleString()}</p></div>)}</div>
                <form onSubmit={sendReply} className="flex gap-2 p-4"><input value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Reply to this conversation" className="min-w-0 flex-1 rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-950 outline-none" /><button disabled={sending || !reply.trim()} className="rounded-xl bg-purple-700 px-4 py-2 text-sm text-white disabled:opacity-50">Send</button></form>
              </>}
            </div>
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
