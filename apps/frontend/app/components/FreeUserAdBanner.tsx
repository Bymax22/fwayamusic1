"use client";

import { Megaphone, ExternalLink, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';

type Ad = { id: number; title: string; mediaType: 'IMAGE' | 'VIDEO'; mediaUrl: string; clickUrl?: string | null };
type Campaign = { id: number; frequencyCap: number; cooldownSeconds: number; ads: Ad[] };
type Impression = { count: number; lastShown: number };

const STORAGE_KEY = 'fwaya-ad-impressions';

export default function FreeUserAdBanner() {
  const { user } = useAuth();
  const [ad, setAd] = useState<Ad | null>(null);
  const [campaignId, setCampaignId] = useState<number | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [dismissed, setDismissed] = useState(false);

  const hasActivePremium = Boolean(user?.isPremium && user.premiumUntil && new Date(user.premiumUntil) > new Date());

  useEffect(() => {
    if (hasActivePremium) return;
    const load = async () => {
      try {
        const response = await fetch('/api/advertising/active', { cache: 'no-store' });
        if (response.ok) setCampaigns(await response.json());
      } catch (error) {
        console.warn('Unable to load sponsored ads', error);
      }
    };
    void load();
    const interval = window.setInterval(load, 60_000);
    return () => window.clearInterval(interval);
  }, [hasActivePremium]);

  useEffect(() => {
    if (!campaigns.length || hasActivePremium) return;
    const now = Date.now();
    let impressions: Record<string, Impression> = {};
    try { impressions = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { impressions = {}; }
    const eligible = campaigns.filter((campaign) => {
      const entry = impressions[String(campaign.id)];
      return !entry || (entry.count < campaign.frequencyCap && now - entry.lastShown >= campaign.cooldownSeconds * 1000);
    });
    const pool = eligible.length ? eligible : campaigns.filter((campaign) => !impressions[String(campaign.id)] || impressions[String(campaign.id)].count < campaign.frequencyCap);
    const selectedCampaign = pool.find((item) => item.ads.length);
    if (!selectedCampaign) return;
    const nextAd = selectedCampaign.ads[Math.floor(Math.random() * selectedCampaign.ads.length)];
    setCampaignId(selectedCampaign.id);
    setAd(nextAd);
    impressions[String(selectedCampaign.id)] = { count: (impressions[String(selectedCampaign.id)]?.count || 0) + 1, lastShown: now };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(impressions));
  }, [campaigns, hasActivePremium]);

  useEffect(() => {
    if (!ad) return;
    const timer = window.setInterval(() => {
      const campaign = campaigns.find((item) => item.id === campaignId);
      const next = campaign?.ads.find((item) => item.id !== ad.id) || campaign?.ads[0];
      if (next) setAd(next);
    }, 10_000);
    return () => window.clearInterval(timer);
  }, [ad, campaignId, campaigns]);

  if (hasActivePremium || !ad || dismissed) return null;
  const content = ad.mediaType === 'VIDEO'
    ? <video src={ad.mediaUrl} className="h-20 w-32 flex-shrink-0 rounded-lg object-cover sm:h-24 sm:w-44" autoPlay muted loop playsInline />
    : <img src={ad.mediaUrl} alt={ad.title} className="h-20 w-32 flex-shrink-0 rounded-lg object-cover sm:h-24 sm:w-44" />;

  return (
    <div className="mx-auto mb-4 flex max-w-7xl items-center gap-3 rounded-xl border border-white/10 bg-white/[.04] p-2.5 text-sm text-white/70">
      {ad.clickUrl ? <a href={ad.clickUrl} target="_blank" rel="noreferrer" aria-label={`Open sponsored ad: ${ad.title}`}>{content}</a> : content}
      <div className="min-w-0 flex-1"><p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-purple-300"><Megaphone className="h-3 w-3" /> Sponsored</p><p className="truncate text-white/80">{ad.title}</p></div>
      {ad.clickUrl && <ExternalLink className="h-4 w-4 flex-shrink-0 text-white/40" />}
      <button type="button" onClick={() => setDismissed(true)} aria-label="Dismiss sponsored ad" className="rounded-full p-1.5 text-white/40 hover:bg-white/10 hover:text-white"><X className="h-4 w-4" /></button>
    </div>
  );
}