"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Activity, ArrowUpRight, BarChart3, CircleDollarSign, FileAudio, LifeBuoy, Megaphone, RefreshCw, ShieldCheck, Users } from 'lucide-react';
import EnhancedRoleGuard from '@/components/RoleGuard';
import { useAuth } from '@/context/AuthContext';
import { subscribe } from '@/lib/realtime';

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

const emptyStats: AdminStats = {
  totalUsers: 0, totalArtists: 0, totalProducers: 0, totalResellers: 0, totalAdmins: 0, premiumUsers: 0,
  totalMedia: 0, audioCount: 0, videoCount: 0, podcastCount: 0, premiumMedia: 0, payPerViewMedia: 0,
  totalRevenue: 0, pendingWithdrawals: 0, totalCommissions: 0, totalPlays: 0, totalDownloads: 0, activeUsers24h: 0,
};

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function AdminDashboard() {
  const { getToken } = useAuth();
  const [stats, setStats] = useState<AdminStats>(emptyStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadStats = async () => {
    setError('');
    try {
      const token = await getToken();
      const response = await fetch(`${apiBase}/api/v1/admin/dashboard/stats`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        cache: 'no-store',
      });
      if (!response.ok) throw new Error(`Unable to load dashboard data (${response.status})`);
      setStats(await response.json());
      setLastUpdated(new Date());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadStats();
    let cleanup: (() => void) | undefined;
    void subscribe('media:uploaded', () => void loadStats()).then((unsubscribe) => { cleanup = unsubscribe; });
    const interval = window.setInterval(() => void loadStats(), 60000);
    return () => {
      cleanup?.();
      window.clearInterval(interval);
    };
  }, []);

  const statCards = [
    { label: 'Total users', value: stats.totalUsers, detail: `${stats.activeUsers24h} active today`, icon: Users, color: 'text-purple-300' },
    { label: 'Published media', value: stats.totalMedia, detail: `${stats.audioCount} audio tracks`, icon: FileAudio, color: 'text-fuchsia-300' },
    { label: 'Total plays', value: stats.totalPlays, detail: `${stats.totalDownloads} downloads`, icon: Activity, color: 'text-violet-300' },
    { label: 'Revenue', value: `ZMW ${Number(stats.totalRevenue).toLocaleString()}`, detail: `${stats.pendingWithdrawals} pending transactions`, icon: CircleDollarSign, color: 'text-emerald-300' },
  ];

  const links = [
    { href: '/admin/support', label: 'Support inbox', detail: 'Resolve user tickets', icon: LifeBuoy },
    { href: '/admin/covers', label: 'Cover moderation', detail: 'Approve or reject artwork', icon: ShieldCheck },
    { href: '/admin/advertising', label: 'Advertising', detail: 'Manage campaigns and creatives', icon: Megaphone },
  ];

  return (
    <main className="min-h-screen bg-black px-4 py-6 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-purple-300">Fwaya control room</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Admin overview</h1>
            <p className="mt-2 text-sm text-white/55">Monitor the platform, moderate content, and keep operations moving.</p>
          </div>
          <button onClick={() => void loadStats()} className="inline-flex items-center justify-center gap-2 rounded-lg border border-purple-400/30 px-4 py-2 text-sm text-purple-200 hover:bg-purple-500/10" disabled={loading}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh data
          </button>
        </header>

        {error && <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map(({ label, value, detail, icon: Icon, color }) => (
            <article key={label} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
              <div className="flex items-start justify-between"><span className="text-sm text-white/55">{label}</span><Icon size={19} className={color} /></div>
              <p className="mt-5 text-2xl font-semibold">{loading ? '...' : value}</p>
              <p className="mt-1 text-xs text-white/45">{detail}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <div className="flex items-center justify-between"><div><h2 className="text-lg font-semibold">Platform mix</h2><p className="mt-1 text-sm text-white/50">Current audience and content distribution.</p></div><BarChart3 className="text-purple-300" size={21} /></div>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[['Artists', stats.totalArtists], ['Producers', stats.totalProducers], ['Premium users', stats.premiumUsers], ['Videos', stats.videoCount]].map(([label, value]) => <div key={label} className="rounded-xl bg-black/30 p-4"><p className="text-xs text-white/45">{label}</p><p className="mt-2 text-xl font-semibold">{Number(value).toLocaleString()}</p></div>)}
            </div>
          </div>
          <div className="rounded-2xl border border-purple-400/20 bg-purple-500/[0.08] p-5"><div className="flex items-center justify-between"><div><h2 className="text-lg font-semibold">Live status</h2><p className="mt-1 text-sm text-purple-100/60">Dashboard refreshes on platform events.</p></div><span className="h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_14px_#34d399]" /></div><p className="mt-8 text-sm text-white/70">{lastUpdated ? `Last synced ${lastUpdated.toLocaleTimeString()}` : 'Connecting to data service...'}</p></div>
        </section>

        <section><div className="mb-4 flex items-end justify-between"><div><h2 className="text-lg font-semibold">Operations</h2><p className="mt-1 text-sm text-white/50">Jump directly into connected admin workflows.</p></div><ArrowUpRight className="text-white/35" size={20} /></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{links.map(({ href, label, detail, icon: Icon }) => <Link key={href} href={href} className="group rounded-2xl border border-white/10 bg-white/[0.035] p-5 transition hover:border-purple-400/40 hover:bg-purple-500/[0.08]"><Icon size={20} className="text-purple-300" /><h3 className="mt-5 font-semibold">{label}</h3><p className="mt-1 text-sm text-white/50">{detail}</p><span className="mt-5 inline-flex text-xs text-purple-200 opacity-0 transition group-hover:opacity-100">Open workspace <ArrowUpRight size={14} className="ml-1" /></span></Link>)}</div></section>
      </div>
    </main>
  );
}

export default function AdminPage() {
  return <EnhancedRoleGuard allowedRoles={['ADMIN']}><AdminDashboard /></EnhancedRoleGuard>;
}