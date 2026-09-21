"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Bell, ChevronRight, FileAudio, LifeBuoy, Megaphone, Settings2, ShieldCheck, Users, X } from 'lucide-react';
import { useState } from 'react';

const navigation = [
  { href: '/admin', label: 'Overview', icon: BarChart3 },
  { href: '/admin/users', label: 'Users & media', icon: Users },
  { href: '/admin/applications', label: 'Applications', icon: ShieldCheck },
  { href: '/admin/support', label: 'Support center', icon: LifeBuoy },
  { href: '/admin/notifications', label: 'Notifications', icon: Bell },
  { href: '/admin/advertising', label: 'Advertising', icon: Megaphone },
  { href: '/admin/covers', label: 'Cover moderation', icon: FileAudio },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-slate-950">
      <button type="button" aria-label="Open admin navigation" onClick={() => setMobileOpen(true)} className="fixed left-4 top-4 z-30 rounded-xl bg-black p-3 text-white shadow-lg lg:hidden">
        <ChevronRight size={18} />
      </button>
      {mobileOpen && <button aria-label="Close admin navigation" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-black/30 lg:hidden" />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-black px-4 py-5 text-white shadow-2xl transition-transform lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-3">
          <Link href="/admin" onClick={() => setMobileOpen(false)} className="text-xl font-semibold tracking-tight">fwaya<span className="text-purple-400">.</span></Link>
          <button type="button" aria-label="Close navigation" onClick={() => setMobileOpen(false)} className="rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white lg:hidden"><X size={18} /></button>
        </div>
        <div className="mt-8 rounded-2xl bg-purple-600 px-4 py-4"><p className="text-xs uppercase tracking-[0.18em] text-purple-100">Control center</p><p className="mt-2 text-sm font-medium">Platform operations</p><p className="mt-1 text-xs text-purple-100/70">Manage people, media, and activity.</p></div>
        <nav className="mt-7 space-y-1" aria-label="Admin navigation">
          {navigation.map(({ href, label, icon: Icon }) => {
            const active = href === '/admin' ? pathname === href : pathname.startsWith(href);
            return <Link key={href} href={href} onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${active ? 'bg-white text-black' : 'text-white/65 hover:bg-white/10 hover:text-white'}`}><Icon size={17} /><span>{label}</span></Link>;
          })}
        </nav>
        <div className="mt-auto rounded-xl bg-white/10 px-3 py-3 text-xs text-white/55"><Settings2 size={16} className="mb-2 text-purple-300" /><p>Admin access is protected by Firebase and role permissions.</p></div>
      </aside>
      <main className="min-h-screen lg:pl-64">{children}</main>
    </div>
  );
}
