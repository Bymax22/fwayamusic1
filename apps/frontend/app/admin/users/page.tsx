"use client";

import { FormEvent, useEffect, useState } from 'react';
import { Archive, Edit3, Plus, Search, Trash2, UserRound, X } from 'lucide-react';
import EnhancedRoleGuard from '@/components/RoleGuard';
import { useAuth } from '@/context/AuthContext';

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
type UserRow = { id: number; email: string; username: string; displayName?: string | null; role: string; status: string; country?: string | null; isPremium: boolean; createdAt: string; lastLoginAt?: string | null };
type MediaRow = { id: number; title: string; type: string; contentStatus: string; accessType: string; releaseDate: string; createdAt: string; playCount: number; downloadCount: number; user?: { displayName?: string | null; username: string } | null };

type ActiveUserFilter = 'all' | 'now' | '24h';

function ManagementWorkspace() {
  const { getToken } = useAuth();
  const [tab, setTab] = useState<'users' | 'media'>('users');
  const [users, setUsers] = useState<UserRow[]>([]);
  const [media, setMedia] = useState<MediaRow[]>([]);
  const [query, setQuery] = useState('');
  const [userFilter, setUserFilter] = useState<ActiveUserFilter>('all');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [editingMedia, setEditingMedia] = useState<MediaRow | null>(null);
  const [form, setForm] = useState({ email: '', username: '', password: '', displayName: '', role: 'USER', country: 'ZM' });

  const request = async (path: string, init: RequestInit = {}) => {
    const token = await getToken();
    const headers = new Headers(init.headers);
    if (token) headers.set('Authorization', `Bearer ${token}`);
    if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    const response = await fetch(`${apiBase}/api/v1/admin${path}`, { ...init, headers, cache: 'no-store' });
    if (!response.ok) throw new Error((await response.text()) || `Request failed (${response.status})`);
    return response.json();
  };

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set('q', query.trim());
      if (tab === 'users' && userFilter !== 'all') params.set('active', userFilter);

      const userSuffix = params.toString() ? `?${params.toString()}` : '';
      const [userRows, mediaRows] = await Promise.all([
        request(`/users${userSuffix}`),
        request(`/media${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''}`),
      ]);
      setUsers(userRows);
      setMedia(mediaRows);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to load management data'); } finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, [tab, userFilter]);

  useEffect(() => {
    if (tab !== 'users') return;
    const intervalId = window.setInterval(() => { void load(); }, 30000);
    return () => window.clearInterval(intervalId);
  }, [tab, userFilter, query]);

  const saveUser = async (event: FormEvent) => {
    event.preventDefault();
    try {
      if (editing) await request(`/users/${editing.id}`, { method: 'PATCH', body: JSON.stringify({ displayName: form.displayName, email: form.email, username: form.username, role: form.role, country: form.country }) });
      else await request('/users', { method: 'POST', body: JSON.stringify(form) });
      setShowCreate(false); setEditing(null); setForm({ email: '', username: '', password: '', displayName: '', role: 'USER', country: 'ZM' }); setMessage(editing ? 'User updated.' : 'User created.'); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to save user'); }
  };

  const editUser = (row: UserRow) => { setEditing(row); setShowCreate(true); setForm({ email: row.email, username: row.username, password: '', displayName: row.displayName || '', role: row.role, country: row.country || 'ZM' }); };
  const suspendUser = async (row: UserRow) => { if (!window.confirm(`Suspend ${row.displayName || row.username}?`)) return; try { await request(`/users/${row.id}`, { method: 'DELETE' }); setMessage('User suspended.'); await load(); } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to suspend user'); } };
  const archiveMedia = async (row: MediaRow) => { if (!window.confirm(`Archive ${row.title}?`)) return; try { await request(`/media/${row.id}`, { method: 'DELETE' }); setMessage('Media archived.'); await load(); } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to archive media'); } };
  const saveMedia = async (event: FormEvent) => { event.preventDefault(); if (!editingMedia) return; try { await request(`/media/${editingMedia.id}`, { method: 'PATCH', body: JSON.stringify({ title: editingMedia.title, contentStatus: editingMedia.contentStatus, accessType: editingMedia.accessType, releaseDate: editingMedia.releaseDate }) }); setEditingMedia(null); setMessage('Media updated.'); await load(); } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to update media'); } };

  return <div className="min-h-screen bg-[#FFFFFF] px-5 py-8 sm:px-8 lg:px-10"><div className="mx-auto max-w-7xl space-y-7"><header className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple/90">Management center</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-black">Users & media</h1><p className="mt-2 max-w-2xl text-sm text-white/60">Control account access, roles, profile details, and published media from one workspace.</p></div><button onClick={() => { setEditing(null); setForm({ email: '', username: '', password: '', displayName: '', role: 'USER', country: 'ZM' }); setShowCreate(true); }} className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-4 py-3 text-sm font-medium text-white shadow-lg shadow-black/10 hover:bg-purple/90"><Plus size={17} /> Add user</button></header>
    {message && <div className="rounded-xl bg-purple/20 px-4 py-3 text-sm text-purple">{message}</div>}
    <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-3 shadow-sm"><div className="flex gap-1 rounded-xl bg-white/10 p-1"><button onClick={() => setTab('users')} className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === 'users' ? 'bg-black text-white' : 'text-white/60'}`}>Users <span className="ml-1 text-xs">{users.length}</span></button><button onClick={() => setTab('media')} className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === 'media' ? 'bg-black text-white' : 'text-white/60'}`}>Media <span className="ml-1 text-xs">{media.length}</span></button></div>{tab === 'users' && <div className="flex flex-wrap items-center gap-2 rounded-xl bg-white/10 p-1">{[{ key: 'all', label: 'All' }, { key: 'now', label: 'Active now' }, { key: '24h', label: 'Active 24h' }].map((option) => <button key={option.key} type="button" onClick={() => setUserFilter(option.key as ActiveUserFilter)} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${userFilter === option.key ? 'bg-black text-white' : 'text-white/60 hover:text-charcoal'}`}>{option.label}</button>)}</div>}<div className="relative w-full max-w-sm"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60" /><input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void load(); }} placeholder={tab === 'users' ? 'Search users' : 'Search media'} className="w-full rounded-xl bg-white/10 py-2.5 pl-9 pr-3 text-sm outline-none ring-purple/30 focus:ring-2" /></div></section>
    <section className="overflow-hidden rounded-2xl bg-white shadow-sm">{loading ? <div className="p-8 text-sm text-white/60">Loading management data...</div> : tab === 'users' ? <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-black text-xs uppercase tracking-wider text-white/60"><tr><th className="px-5 py-4">User</th><th className="px-5 py-4">Role</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Last active</th><th className="px-5 py-4">Country</th><th className="px-5 py-4">Joined</th><th className="px-5 py-4 text-right">Actions</th></tr></thead><tbody>{users.map((row) => <tr key={row.id} className="hover:bg-white/5"><td className="px-5 py-4"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple/20 text-purple/90"><UserRound size={16} /></div><div><p className="font-medium text-charcoal">{row.displayName || row.username}</p><p className="text-xs text-white/60">{row.email}</p></div></div></td><td className="px-5 py-4"><span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white/80">{row.role}</span></td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${row.status === 'ACTIVE' ? 'bg-purple/20 text-purple/90' : 'bg-purple/20 text-purple/90'}`}>{row.status}</span></td><td className="px-5 py-4 text-white/60">{row.lastLoginAt ? new Date(row.lastLoginAt).toLocaleString() : 'Never'}</td><td className="px-5 py-4 text-white/60">{row.country || '—'}</td><td className="px-5 py-4 text-white/60">{new Date(row.createdAt).toLocaleDateString()}</td><td className="px-5 py-4"><div className="flex justify-end gap-2"><button onClick={() => editUser(row)} aria-label={`Edit ${row.username}`} className="rounded-lg p-2 text-white/60 hover:bg-purple/20 hover:text-purple/90"><Edit3 size={16} /></button><button onClick={() => void suspendUser(row)} aria-label={`Suspend ${row.username}`} className="rounded-lg p-2 text-white/60 hover:bg-purple/20 hover:text-purple/85"><Trash2 size={16} /></button></div></td></tr>)}</tbody></table>{users.length === 0 && <p className="p-8 text-sm text-white/60">No users match this search.</p>}</div> : <div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left text-sm"><thead className="bg-black text-xs uppercase tracking-wider text-white/60"><tr><th className="px-5 py-4">Media</th><th className="px-5 py-4">Type</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Release date</th><th className="px-5 py-4">Performance</th><th className="px-5 py-4 text-right">Actions</th></tr></thead><tbody>{media.map((row) => <tr key={row.id} className="hover:bg-white/5"><td className="px-5 py-4"><p className="font-medium text-charcoal">{row.title}</p><p className="text-xs text-white/60">{row.user?.displayName || row.user?.username || 'Unknown creator'}</p></td><td className="px-5 py-4 text-white/60">{row.type}</td><td className="px-5 py-4"><span className="rounded-full bg-purple/20 px-2.5 py-1 text-xs font-medium text-purple/90">{row.contentStatus}</span></td><td className="px-5 py-4 text-white/60">{new Date(row.releaseDate).toLocaleDateString()}</td><td className="px-5 py-4 text-white/60">{row.playCount.toLocaleString()} plays · {row.downloadCount.toLocaleString()} downloads</td><td className="px-5 py-4"><div className="flex justify-end gap-2"><button onClick={() => setEditingMedia(row)} aria-label={`Edit ${row.title}`} className="rounded-lg p-2 text-white/60 hover:bg-purple/20 hover:text-purple/90"><Edit3 size={16} /></button><button onClick={() => void archiveMedia(row)} aria-label={`Archive ${row.title}`} className="rounded-lg p-2 text-white/60 hover:bg-purple/20 hover:text-purple/85"><Archive size={16} /></button></div></td></tr>)}</tbody></table>{media.length === 0 && <p className="p-8 text-sm text-white/60">No media matches this search.</p>}</div>}</section>
    {showCreate && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4"><form onSubmit={saveUser} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-wider text-purple/90">User record</p><h2 className="mt-1 text-xl font-semibold">{editing ? 'Edit user' : 'Add user'}</h2></div><button type="button" onClick={() => setShowCreate(false)} className="rounded-lg p-2 text-white/60 hover:bg-white/10"><X size={18} /></button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="text-sm text-white/60">Display name<input value={form.displayName} onChange={(event) => setForm({ ...form, displayName: event.target.value })} className="mt-1 w-full rounded-xl bg-white/10 px-3 py-2.5 text-black outline-none" /></label><label className="text-sm text-white/60">Username<input required value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} className="mt-1 w-full rounded-xl bg-white/10 px-3 py-2.5 text-black outline-none" /></label><label className="text-sm text-white/60 sm:col-span-2">Email<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="mt-1 w-full rounded-xl bg-white/10 px-3 py-2.5 text-black outline-none" /></label>{!editing && <label className="text-sm text-white/60 sm:col-span-2">Temporary password<input required minLength={8} type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="mt-1 w-full rounded-xl bg-white/10 px-3 py-2.5 text-black outline-none" /></label>}<label className="text-sm text-white/60">Role<select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} className="mt-1 w-full rounded-xl bg-white/10 px-3 py-2.5 text-black outline-none">{['USER', 'ARTIST', 'PRODUCER', 'RESELLER', 'MODERATOR', 'ADMIN'].map((role) => <option key={role}>{role}</option>)}</select></label><label className="text-sm text-white/60">Country<input value={form.country} maxLength={2} onChange={(event) => setForm({ ...form, country: event.target.value.toUpperCase() })} className="mt-1 w-full rounded-xl bg-white/10 px-3 py-2.5 text-black outline-none" /></label></div><button className="mt-6 w-full rounded-xl bg-purple/90 px-4 py-3 text-sm font-medium text-white hover:bg-purple/95">{editing ? 'Save changes' : 'Create user'}</button></form></div>}
    {editingMedia && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4"><form onSubmit={saveMedia} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-wider text-purple/90">Media record</p><h2 className="mt-1 text-xl font-semibold">Edit media</h2></div><button type="button" onClick={() => setEditingMedia(null)} className="rounded-lg p-2 text-white/60 hover:bg-white/10"><X size={18} /></button></div><div className="mt-6 space-y-4"><label className="block text-sm text-white/60">Title<input required value={editingMedia.title} onChange={(event) => setEditingMedia({ ...editingMedia, title: event.target.value })} className="mt-1 w-full rounded-xl bg-white/10 px-3 py-2.5 text-black outline-none" /></label><label className="block text-sm text-white/60">Content status<select value={editingMedia.contentStatus} onChange={(event) => setEditingMedia({ ...editingMedia, contentStatus: event.target.value })} className="mt-1 w-full rounded-xl bg-white/10 px-3 py-2.5 text-black outline-none"><option>DRAFT</option><option>SUBMITTED</option><option>APPROVED</option><option>PUBLISHED</option><option>ARCHIVED</option></select></label><label className="block text-sm text-white/60">Access<select value={editingMedia.accessType} onChange={(event) => setEditingMedia({ ...editingMedia, accessType: event.target.value })} className="mt-1 w-full rounded-xl bg-white/10 px-3 py-2.5 text-black outline-none"><option>FREE</option><option>PREMIUM</option><option>PAY_PER_VIEW</option></select></label><label className="block text-sm text-white/60">Release date<input required type="date" value={editingMedia.releaseDate.slice(0, 10)} onChange={(event) => setEditingMedia({ ...editingMedia, releaseDate: event.target.value })} className="mt-1 w-full rounded-xl bg-white/10 px-3 py-2.5 text-black outline-none" /></label></div><button className="mt-6 w-full rounded-xl bg-purple/90 px-4 py-3 text-sm font-medium text-white hover:bg-purple/95">Save media changes</button></form></div>}
  </div></div>;
}

export default function AdminUsersPage() { return <EnhancedRoleGuard allowedRoles={['ADMIN']}><ManagementWorkspace /></EnhancedRoleGuard>; }
