"use client";

import { FormEvent, useEffect, useState } from 'react';
import EnhancedRoleGuard from '@/components/RoleGuard';
import { useAuth } from '@/context/AuthContext';
import { subscribe } from '@/lib/realtime';

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function NotificationsWorkspace() {
  const { getToken } = useAuth();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState('');
  const [country, setCountry] = useState('');
  const [role, setRole] = useState('USER');
  const [status, setStatus] = useState('');
  const [sending, setSending] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [history, setHistory] = useState<Array<{ id: number; title: string; status: string; scheduledAt?: string | null; sentAt?: string | null; totalRecipients: number; deliveredCount: number; failedCount: number; createdAt: string }>>([]);

  const loadHistory = async () => {
    const token = await getToken();
    const response = await fetch(`${apiBase}/api/v1/admin/notifications`, { headers: token ? { Authorization: `Bearer ${token}` } : undefined, cache: 'no-store' });
    if (response.ok) setHistory(await response.json());
  };

  useEffect(() => {
    void loadHistory();
    let cleanup: (() => void) | undefined;
    void getToken().then((token) => subscribe('admin:notifications-updated', () => void loadHistory(), token)).then((unsubscribe) => { cleanup = unsubscribe; });
    const timer = window.setInterval(() => void loadHistory(), 30000);
    return () => { cleanup?.(); window.clearInterval(timer); };
  }, []);

  const send = async (event: FormEvent) => {
    event.preventDefault();
    setSending(true);
    setStatus('');
    try {
      const token = await getToken();
      const payload: Record<string, unknown> = { title, message, scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null };
      if (audience === 'ROLE') payload.roles = [role];
      if (audience === 'COUNTRY') payload.countries = [country.trim().toUpperCase()];
      if (audience === 'USERS') payload.userIds = selectedIds.split(',').map((id) => Number(id.trim())).filter(Number.isInteger);
      const response = await fetch(`${apiBase}/api/v1/admin/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to send notification');
      setStatus(`Notification sent to ${data.recipients} users.`);
      setTitle('');
      setMessage('');
      setScheduledAt('');
      await loadHistory();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to send notification');
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f5f6f8] px-5 py-8 text-slate-950 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-4xl space-y-7">
        <header><p className="text-xs font-semibold uppercase tracking-[0.24em] text-purple-700">Control center</p><h1 className="mt-2 text-3xl font-semibold">Notification composer</h1><p className="mt-2 text-sm text-slate-500">Send targeted in-app notifications to individuals or audience groups.</p></header>
        <form onSubmit={send} className="space-y-5 rounded-2xl bg-white p-6 shadow-sm">
          <label className="block text-sm text-slate-600">Title<input required value={title} onChange={(event) => setTitle(event.target.value)} className="mt-2 w-full rounded-xl bg-slate-100 px-3 py-2.5 text-slate-950 outline-none focus:ring-2 focus:ring-purple-300" /></label>
          <label className="block text-sm text-slate-600">Message<textarea required value={message} onChange={(event) => setMessage(event.target.value)} rows={5} className="mt-2 w-full rounded-xl bg-slate-100 px-3 py-2.5 text-slate-950 outline-none focus:ring-2 focus:ring-purple-300" /></label>
          <label className="block text-sm text-slate-600">Audience<select value={audience} onChange={(event) => setAudience(event.target.value)} className="mt-2 w-full rounded-xl bg-slate-100 px-3 py-2.5 text-slate-950"><option value="ALL">All users</option><option value="ROLE">Role</option><option value="COUNTRY">Country</option><option value="USERS">Selected user IDs</option></select></label>
          {audience === 'ROLE' && <label className="block text-sm text-slate-600">Role<select value={role} onChange={(event) => setRole(event.target.value)} className="mt-2 w-full rounded-xl bg-slate-100 px-3 py-2.5 text-slate-950">{['USER', 'ARTIST', 'PRODUCER', 'RESELLER'].map((item) => <option key={item}>{item}</option>)}</select></label>}
          {audience === 'COUNTRY' && <label className="block text-sm text-slate-600">Country code<input required value={country} onChange={(event) => setCountry(event.target.value)} placeholder="ZM" className="mt-2 w-full rounded-xl bg-slate-100 px-3 py-2.5 text-slate-950 uppercase" /></label>}
          {audience === 'USERS' && <label className="block text-sm text-slate-600">User IDs<input required value={selectedIds} onChange={(event) => setSelectedIds(event.target.value)} placeholder="12, 18, 24" className="mt-2 w-full rounded-xl bg-slate-100 px-3 py-2.5 text-slate-950" /></label>}
          <label className="block text-sm text-slate-600">Schedule delivery (optional)<input type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} className="mt-2 w-full rounded-xl bg-slate-100 px-3 py-2.5 text-slate-950" /></label>
          <button disabled={sending} className="rounded-xl bg-purple-700 px-5 py-3 text-sm font-medium text-white hover:bg-purple-800 disabled:opacity-50">{sending ? 'Sending...' : 'Send notification'}</button>
          {status && <p className="text-sm text-slate-600">{status}</p>}
        </form>
        <section className="rounded-2xl bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Broadcast history</h2><span className="text-xs text-slate-400">Live updates enabled</span></div><div className="mt-4 space-y-2">{history.length === 0 ? <p className="text-sm text-slate-500">No broadcasts yet.</p> : history.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-100 px-3 py-3 text-sm"><div><p className="font-medium text-slate-950">{item.title}</p><p className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()} · {item.scheduledAt ? `scheduled ${new Date(item.scheduledAt).toLocaleString()}` : 'sent immediately'}</p></div><div className="text-right text-xs"><p className="font-medium text-purple-700">{item.status}</p><p className="text-slate-500">{item.deliveredCount}/{item.totalRecipients} delivered · {item.failedCount} failed</p></div></div>)}</div></section>
      </div>
    </main>
  );
}

export default function NotificationsPage() {
  return <EnhancedRoleGuard allowedRoles={['ADMIN']}><NotificationsWorkspace /></EnhancedRoleGuard>;
}