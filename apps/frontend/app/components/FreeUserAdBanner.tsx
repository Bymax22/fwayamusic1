"use client";

import { Megaphone } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function FreeUserAdBanner() {
  const { user } = useAuth();

  if (user?.isPremium && user.premiumUntil && new Date(user.premiumUntil) > new Date()) return null;

  return (
    <div className="mx-auto mb-4 flex max-w-7xl items-center gap-3 rounded-xl border border-white/10 bg-white/[.04] px-4 py-3 text-sm text-white/70">
      <Megaphone className="h-4 w-4 flex-shrink-0 text-purple-300" />
      <span>Sponsored</span>
      <span className="text-white/40">Support Fwaya creators and keep listening.</span>
    </div>
  );
}