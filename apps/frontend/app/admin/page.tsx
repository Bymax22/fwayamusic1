"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Activity, ArrowUpRight, BarChart3, CircleDollarSign, FileAudio, LifeBuoy, Megaphone, RefreshCw, ShieldCheck, Users } from 'lucide-react';
import EnhancedRoleGuard from '@/components/RoleGuard';
import { useAuth } from '@/context/AuthContext';
import { subscribe } from '@/lib/realtime';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

type AdminStats = {
  totalUsers: number;
  totalArtists: number;
  totalProducers: number;
  totalResellers: number;
  totalAdmins: number;
  premiumUsers: number;
  totalMedia: number;
  audioCount: number;
  videoCount: number;
  podcastCount: number;
  premiumMedia: number;
  payPerViewMedia: number;
  totalRevenue: number;
  pendingWithdrawals: number;
  totalCommissions: number;
  totalPlays: number;
  totalDownloads: number;
  activeUsers24h: number;
};

type AdminAnalytics = {
  activeUsers: number;
  activeUsers24h: number;
  pendingApplications: number;
  usersByCountry: Array<{ country: string; count: number }>;
  engagement: { plays: number; downloads: number; shares: number };
  series: Array<{ day: string; activeUsers: number; activeUsers24h: number; signups: number; approvals: number; plays: number; downloads: number; shares: number }>;
};

const emptyStats: AdminStats = {
  totalUsers: 0, totalArtists: 0, totalProducers: 0, totalResellers: 0, totalAdmins: 0, premiumUsers: 0,
  totalMedia: 0, audioCount: 0, videoCount: 0, podcastCount: 0, premiumMedia: 0, payPerViewMedia: 0,
  totalRevenue: 0, pendingWithdrawals: 0, totalCommissions: 0, totalPlays: 0, totalDownloads: 0, activeUsers24h: 0,
};

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const ADMIN_REQUEST_TIMEOUT_MS = 20000;

async function fetchAdminData(url: string, token: string) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), ADMIN_REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('The admin data service took too long to respond. Check the backend database connection and try again.');
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

function AdminDashboard() {
  const { getToken, firebaseUser, user } = useAuth();
  const [stats, setStats] = useState<AdminStats>(emptyStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [analytics, setAnalytics] = useState<AdminAnalytics>({ activeUsers: 0, activeUsers24h: 0, pendingApplications: 0, usersByCountry: [], engagement: { plays: 0, downloads: 0, shares: 0 }, series: [] });

  const loadStats = async () => {
    setError('');
    try {
      let token = await getToken();
      if (!token && firebaseUser) {
        token = await firebaseUser.getIdToken(true);
      }
      if (!token) {
        throw new Error('Your admin session is still loading. Please try again.');
      }
      const response = await fetchAdminData(`${apiBase}/api/v1/admin/dashboard/stats`, token);
      if (!response.ok) throw new Error(`Unable to load dashboard data (${response.status})`);
      setStats(await response.json());
      const analyticsResponse = await fetchAdminData(`${apiBase}/api/v1/admin/analytics`, token);
      if (analyticsResponse.ok) setAnalytics(await analyticsResponse.json());
      setLastUpdated(new Date());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || !firebaseUser) return;
    void loadStats();
    let cleanup: (() => void) | undefined;
    void subscribe('media:uploaded', () => void loadStats()).then((unsubscribe) => { cleanup = unsubscribe; });
    let adminCleanup: (() => void) | undefined;
    void subscribe('admin:dashboard-updated', () => void loadStats()).then((unsubscribe) => { adminCleanup = unsubscribe; });
    const interval = window.setInterval(() => void loadStats(), 60000);
    return () => {
      cleanup?.();
      adminCleanup?.();
      window.clearInterval(interval);
    };
  }, [user, firebaseUser]);

  const statCards = [
    { label: 'Total users', value: stats.totalUsers, detail: `${stats.activeUsers24h} active today`, icon: Users, color: 'text-purple-300' },
    { label: 'Published media', value: stats.totalMedia, detail: `${stats.audioCount} audio tracks`, icon: FileAudio, color: 'text-fuchsia-300' },
    { label: 'Total plays', value: stats.totalPlays, detail: `${stats.totalDownloads} downloads`, icon: Activity, color: 'text-violet-300' },
    { label: 'Revenue', value: `ZMW ${Number(stats.totalRevenue).toLocaleString()}`, detail: `${stats.pendingWithdrawals} pending transactions`, icon: CircleDollarSign, color: 'text-emerald-300' },
  ];

  const links = [
    { href: '/admin/users', label: 'Users & media', detail: 'Manage accounts and content', icon: Users },
    { href: '/admin/applications', label: 'Signup approvals', detail: `${analytics.pendingApplications} applications waiting`, icon: ShieldCheck },
    { href: '/admin/notifications', label: 'Notifications', detail: 'Message users and groups', icon: Megaphone },
    { href: '/admin/support', label: 'Support inbox', detail: 'Resolve user tickets', icon: LifeBuoy },
    { href: '/admin/covers', label: 'Cover moderation', detail: 'Approve or reject artwork', icon: ShieldCheck },
    { href: '/admin/advertising', label: 'Advertising', detail: 'Manage campaigns and creatives', icon: Megaphone },
  ];

  return (
    <main className="min-h-screen bg-[#f5f6f8] px-5 py-8 text-slate-950 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col gap-4 pb-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-purple-700">Fwaya control room</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Admin overview</h1>
            <p className="mt-2 text-sm text-slate-500">Monitor the platform, moderate content, and keep operations moving.</p>
          </div>
          <button onClick={() => void loadStats()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-4 py-3 text-sm text-white shadow-lg shadow-black/10 hover:bg-purple-700" disabled={loading}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh data
          </button>
        </header>

        {error && <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map(({ label, value, detail, icon: Icon, color }) => (
            <article key={label} className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between"><span className="text-sm text-slate-500">{label}</span><Icon size={19} className="text-purple-700" /></div>
              <p className="mt-5 text-2xl font-semibold text-slate-950">{loading ? '...' : value}</p>
              <p className="mt-1 text-xs text-slate-500">{detail}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between"><div><h2 className="text-lg font-semibold">Platform mix</h2><p className="mt-1 text-sm text-slate-500">Current audience and content distribution.</p></div><BarChart3 className="text-purple-700" size={21} /></div>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[['Artists', stats.totalArtists], ['Producers', stats.totalProducers], ['Premium users', stats.premiumUsers], ['Videos', stats.videoCount]].map(([label, value]) => <div key={label} className="rounded-xl bg-slate-100 p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-2 text-xl font-semibold text-slate-950">{Number(value).toLocaleString()}</p></div>)}
            </div>
          </div>
          <div className="rounded-2xl bg-black p-5 text-white shadow-sm"><div className="flex items-center justify-between"><div><h2 className="text-lg font-semibold">Live status</h2><p className="mt-1 text-sm text-white/55">Realtime events plus periodic reconciliation.</p></div><span className="h-3 w-3 rounded-full bg-emerald-400" /></div><div className="mt-8 grid grid-cols-2 gap-3"><div><p className="text-xs text-white/45">Active now</p><p className="mt-1 text-2xl font-semibold">{analytics.activeUsers}</p></div><div><p className="text-xs text-white/45">Active 24h</p><p className="mt-1 text-2xl font-semibold">{analytics.activeUsers24h}</p></div></div><p className="mt-4 text-xs text-white/45">{lastUpdated ? `Last synced ${lastUpdated.toLocaleTimeString()}` : 'Connecting to data service...'}</p></div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-2xl bg-white p-5 shadow-sm"><h2 className="text-lg font-semibold">Active users by location</h2><p className="mt-1 text-sm text-slate-500">Users active in the last 24 hours.</p><div className="mt-5 space-y-3">{analytics.usersByCountry.length === 0 ? <p className="text-sm text-slate-500">No location activity yet.</p> : analytics.usersByCountry.slice(0, 8).map((entry) => <div key={entry.country} className="flex items-center justify-between text-sm"><span>{entry.country}</span><span className="font-medium text-purple-700">{entry.count}</span></div>)}</div></div>
          <div className="rounded-2xl bg-purple-700 p-5 text-white shadow-sm"><h2 className="text-lg font-semibold">Approval queue</h2><p className="mt-1 text-sm text-purple-100/70">Role-based signups waiting for review.</p><p className="mt-5 text-4xl font-semibold">{analytics.pendingApplications}</p><Link href="/admin/applications" className="mt-4 inline-flex text-sm text-white hover:underline">Open approval workspace <ArrowUpRight size={14} className="ml-1" /></Link></div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5"><h2 className="text-lg font-semibold">Audience trends</h2><p className="mt-1 text-sm text-white/50">Daily active users and new signups captured by the control center.</p><div className="mt-5 h-64"><ResponsiveContainer width="100%" height="100%"><LineChart data={analytics.series}><CartesianGrid stroke="rgba(255,255,255,.08)" /><XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 11 }} /><YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} /><Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,.1)' }} /><Legend /><Line type="monotone" dataKey="activeUsers" stroke="#c084fc" name="Active now" /><Line type="monotone" dataKey="activeUsers24h" stroke="#34d399" name="Active 24h" /><Line type="monotone" dataKey="signups" stroke="#60a5fa" name="Signups" /></LineChart></ResponsiveContainer></div></div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5"><h2 className="text-lg font-semibold">Approvals and engagement</h2><p className="mt-1 text-sm text-white/50">Operational outcomes and platform activity over time.</p><div className="mt-5 h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={analytics.series}><CartesianGrid stroke="rgba(255,255,255,.08)" /><XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 11 }} /><YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} /><Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,.1)' }} /><Legend /><Bar dataKey="approvals" fill="#f59e0b" name="Approvals" /><Bar dataKey="downloads" fill="#38bdf8" name="Downloads" /><Bar dataKey="shares" fill="#f472b6" name="Shares" /></BarChart></ResponsiveContainer></div></div>
        </section>

        <section><div className="mb-4 flex items-end justify-between"><div><h2 className="text-lg font-semibold">Operations</h2><p className="mt-1 text-sm text-white/50">Jump directly into connected admin workflows.</p></div><ArrowUpRight className="text-white/35" size={20} /></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{links.map(({ href, label, detail, icon: Icon }) => <Link key={href} href={href} className="group rounded-2xl border border-white/10 bg-white/[0.035] p-5 transition hover:border-purple-400/40 hover:bg-purple-500/[0.08]"><Icon size={20} className="text-purple-300" /><h3 className="mt-5 font-semibold">{label}</h3><p className="mt-1 text-sm text-white/50">{detail}</p><span className="mt-5 inline-flex text-xs text-purple-200 opacity-0 transition group-hover:opacity-100">Open workspace <ArrowUpRight size={14} className="ml-1" /></span></Link>)}</div></section>
      </div>
    </main>
  );
}

export default function AdminPage() {
  return <EnhancedRoleGuard allowedRoles={['ADMIN']}><AdminDashboard /></EnhancedRoleGuard>;
}