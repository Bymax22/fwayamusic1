"use client";

import { useEffect, useState } from 'react';
import { Check, RefreshCw, X } from 'lucide-react';
import EnhancedRoleGuard from '@/components/RoleGuard';
import { useAuth } from '@/context/AuthContext';

interface Application {
  id: number;
  email: string;
  username: string;
  displayName?: string | null;
  role: string;
  country?: string | null;
  phoneNumber?: string | null;
  artistName?: string | null;
  producerName?: string | null;
  businessName?: string | null;
  createdAt: string;
}

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function ApplicationsWorkspace() {
  const { getToken } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);

  const loadApplications = async () => {
    setLoading(true);
    setError('');
    try {
      const token = await getToken();
      const response = await fetch(`${apiBase}/api/v1/admin/applications`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        cache: 'no-store',
      });
      if (!response.ok) throw new Error(`Unable to load applications (${response.status})`);
      setApplications(await response.json());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadApplications(); }, []);

  const review = async (application: Application, approved: boolean) => {
    const reason = approved ? '' : window.prompt('Reason for rejecting this application:', '') || '';
    if (!approved && !reason.trim()) return;
    setBusyId(application.id);
    try {
      const token = await getToken();
      const response = await fetch(`${apiBase}/api/v1/admin/applications/${application.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ approved, reason }),
      });
      if (!response.ok) throw new Error(`Unable to review application (${response.status})`);
      setApplications((current) => current.filter((item) => item.id !== application.id));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to review application');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#f5f6f8] px-5 py-8 text-slate-950 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-purple-700">Control center</p>
            <h1 className="mt-2 text-3xl font-semibold">Signup approvals</h1>
            <p className="mt-2 text-sm text-slate-500">Review artist, producer, and reseller applications before activation.</p>
          </div>
          <button onClick={() => void loadApplications()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-4 py-3 text-sm text-white shadow-lg shadow-black/10 hover:bg-purple-700" disabled={loading}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </header>
        {error && <div className="rounded-xl bg-red-100 px-4 py-3 text-sm text-red-700">{error}</div>}
        {loading ? <div className="rounded-2xl bg-white p-6 text-slate-500 shadow-sm">Loading applications...</div> : applications.length === 0 ? <div className="rounded-2xl bg-white p-6 text-slate-500 shadow-sm">No pending applications.</div> : (
          <div className="space-y-3">
            {applications.map((application) => (
              <article key={application.id} className="rounded-2xl bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold text-slate-950">{application.displayName || application.username}</h2><span className="rounded-full bg-purple-100 px-2 py-1 text-xs uppercase text-purple-700">{application.role}</span></div>
                    <p className="mt-1 text-sm text-slate-500">{application.email} {application.country ? `· ${application.country}` : ''}</p>
                    <p className="mt-2 text-xs text-slate-400">Submitted {new Date(application.createdAt).toLocaleString()}</p>
                    <p className="mt-1 text-sm text-slate-700">{application.artistName || application.producerName || application.businessName || 'No profile name supplied'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => void review(application, false)} disabled={busyId === application.id} className="inline-flex items-center gap-2 rounded-xl bg-red-100 px-4 py-2 text-sm text-red-700 hover:bg-red-200 disabled:opacity-50"><X size={16} /> Reject</button>
                    <button onClick={() => void review(application, true)} disabled={busyId === application.id} className="inline-flex items-center gap-2 rounded-xl bg-emerald-100 px-4 py-2 text-sm text-emerald-700 hover:bg-emerald-200 disabled:opacity-50"><Check size={16} /> Approve</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default function ApplicationsPage() {
  return <EnhancedRoleGuard allowedRoles={['ADMIN']}><ApplicationsWorkspace /></EnhancedRoleGuard>;
}
