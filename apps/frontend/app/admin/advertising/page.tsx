"use client";

import { FormEvent, useEffect, useState } from 'react';
import { Plus, Trash2, Upload, Pause, Play } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

type Ad = { id: number; title: string; mediaType: 'IMAGE' | 'VIDEO'; mediaUrl: string; clickUrl?: string | null; isActive: boolean };
type Campaign = { id: number; name: string; startAt: string; endAt?: string | null; isActive: boolean; frequencyCap: number; cooldownSeconds: number; ads: Ad[] };

const apiBase = () => `${process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://localhost:3001'}/api/v1/advertising`;
const headers = (): Record<string, string> => {
  const token = localStorage.getItem('authToken');
  const result: Record<string, string> = {};
  if (token) result.Authorization = `Bearer ${token}`;
  return result;
};

export default function AdvertisingAdminPage() {
  const { user, loading } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ name: '', startAt: '', endAt: '', frequencyCap: 3, cooldownSeconds: 300 });
  const [creative, setCreative] = useState({ campaignId: '', title: '', clickUrl: '', mediaType: 'IMAGE', file: null as File | null });

  const load = async () => {
    const response = await fetch(`${apiBase()}/campaigns`, { headers: headers() });
    if (response.ok) setCampaigns(await response.json());
  };
  useEffect(() => { if (user?.role === 'ADMIN') void load(); }, [user]);

  const createCampaign = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      const response = await fetch(`${apiBase()}/campaigns`, { method: 'POST', headers: { ...headers(), 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!response.ok) throw new Error('Campaign creation failed');
      setForm({ name: '', startAt: '', endAt: '', frequencyCap: 3, cooldownSeconds: 300 }); await load(); setMessage('Campaign created.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Campaign creation failed'); } finally { setBusy(false); }
  };

  const addCreative = async (event: FormEvent) => {
    event.preventDefault(); if (!creative.campaignId || !creative.file) return;
    setBusy(true); setMessage('');
    try {
      const body = new FormData(); body.append('title', creative.title || 'Sponsored advertisement'); body.append('clickUrl', creative.clickUrl); body.append('mediaType', creative.mediaType); body.append('file', creative.file);
      const response = await fetch(`${apiBase()}/campaigns/${creative.campaignId}/ads`, { method: 'POST', headers: headers(), body });
      if (!response.ok) throw new Error('Creative upload failed');
      setCreative({ campaignId: '', title: '', clickUrl: '', mediaType: 'IMAGE', file: null }); await load(); setMessage('Creative uploaded.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Creative upload failed'); } finally { setBusy(false); }
  };

  const toggleCampaign = async (campaign: Campaign) => {
    await fetch(`${apiBase()}/campaigns/${campaign.id}`, { method: 'PATCH', headers: { ...headers(), 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !campaign.isActive }) }); await load();
  };
  const removeCampaign = async (id: number) => { if (confirm('Delete this campaign and its creatives?')) { await fetch(`${apiBase()}/campaigns/${id}`, { method: 'DELETE', headers: headers() }); await load(); } };
  const removeCreative = async (id: number) => { await fetch(`${apiBase()}/ads/${id}`, { method: 'DELETE', headers: headers() }); await load(); };

  if (loading) return <main className="p-8 text-white">Loading...</main>;
  if (!user || user.role !== 'ADMIN') return <main className="p-8 text-white">Access denied.</main>;

  return <main className="min-h-screen bg-slate-950 p-6 text-white md:p-10"><div className="mx-auto max-w-6xl space-y-8"><div><h1 className="text-3xl font-bold">Advertising</h1><p className="mt-2 text-white/60">Manage scheduled sponsored campaigns for free listeners.</p></div>
    {message && <p className="rounded-xl bg-purple-500/10 px-4 py-3 text-sm text-purple-200">{message}</p>}
    <section className="rounded-2xl border border-white/10 bg-white/[.03] p-5"><h2 className="mb-4 text-lg font-semibold">Create campaign</h2><form onSubmit={createCampaign} className="grid gap-3 md:grid-cols-5"><input required placeholder="Campaign name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="rounded-lg bg-black/30 px-3 py-2" /><input required type="datetime-local" value={form.startAt} onChange={e => setForm({ ...form, startAt: e.target.value })} className="rounded-lg bg-black/30 px-3 py-2" /><input type="datetime-local" value={form.endAt} onChange={e => setForm({ ...form, endAt: e.target.value })} className="rounded-lg bg-black/30 px-3 py-2" /><input min="1" type="number" title="Impressions per browser" value={form.frequencyCap} onChange={e => setForm({ ...form, frequencyCap: Number(e.target.value) })} className="rounded-lg bg-black/30 px-3 py-2" /><button disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2 font-semibold hover:bg-purple-500 disabled:opacity-50"><Plus size={17} /> Create</button></form><p className="mt-2 text-xs text-white/40">Frequency cap is per browser. Cooldown is 300 seconds by default.</p></section>
    <section className="rounded-2xl border border-white/10 bg-white/[.03] p-5"><h2 className="mb-4 text-lg font-semibold">Upload creative</h2><form onSubmit={addCreative} className="grid gap-3 md:grid-cols-5"><select required value={creative.campaignId} onChange={e => setCreative({ ...creative, campaignId: e.target.value })} className="rounded-lg bg-slate-900 px-3 py-2"><option value="">Choose campaign</option>{campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select><input required placeholder="Creative title" value={creative.title} onChange={e => setCreative({ ...creative, title: e.target.value })} className="rounded-lg bg-black/30 px-3 py-2" /><input placeholder="Click-through URL" value={creative.clickUrl} onChange={e => setCreative({ ...creative, clickUrl: e.target.value })} className="rounded-lg bg-black/30 px-3 py-2" /><select value={creative.mediaType} onChange={e => setCreative({ ...creative, mediaType: e.target.value })} className="rounded-lg bg-slate-900 px-3 py-2"><option value="IMAGE">Image</option><option value="VIDEO">Video</option></select><label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2 hover:bg-white/10"><Upload size={17} /> {creative.file?.name || 'Choose file'}<input required type="file" accept={creative.mediaType === 'VIDEO' ? 'video/*' : 'image/*'} onChange={e => setCreative({ ...creative, file: e.target.files?.[0] || null })} className="hidden" /></label><button disabled={busy} className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold hover:bg-emerald-500 disabled:opacity-50 md:col-span-5">Upload creative</button></form></section>
    <div className="space-y-4">{campaigns.map(campaign => <section key={campaign.id} className="rounded-2xl border border-white/10 bg-white/[.03] p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">{campaign.name}</h2><p className="text-xs text-white/50">{new Date(campaign.startAt).toLocaleString()} {campaign.endAt ? `to ${new Date(campaign.endAt).toLocaleString()}` : 'with no end date'} · cap {campaign.frequencyCap}</p></div><div className="flex gap-2"><button onClick={() => toggleCampaign(campaign)} className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-sm">{campaign.isActive ? <Pause size={15} /> : <Play size={15} />}{campaign.isActive ? 'Pause' : 'Activate'}</button><button onClick={() => removeCampaign(campaign.id)} className="rounded-lg border border-red-400/20 p-2 text-red-300"><Trash2 size={16} /></button></div></div><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{campaign.ads.map(ad => <div key={ad.id} className="overflow-hidden rounded-xl border border-white/10 bg-black/20">{ad.mediaType === 'VIDEO' ? <video src={ad.mediaUrl} muted controls className="h-32 w-full object-cover" /> : <img src={ad.mediaUrl} alt={ad.title} className="h-32 w-full object-cover" />}<div className="flex items-center justify-between p-2 text-xs"><span className="truncate">{ad.title}</span><button onClick={() => removeCreative(ad.id)} className="p-1 text-red-300"><Trash2 size={14} /></button></div></div>)}</div></section>)}</div>
  </div></main>;
}
