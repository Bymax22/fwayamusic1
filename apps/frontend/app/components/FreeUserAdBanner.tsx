"use client";

import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';

type Ad = { id: number; title: string; mediaType: 'IMAGE' | 'VIDEO'; mediaUrl: string; clickUrl?: string | null };
type Campaign = { id: number; frequencyCap: number; cooldownSeconds: number; ads: Ad[] };
type Impression = { count: number; lastShown: number };

const STORAGE_KEY = 'fwaya-ad-impressions';
const FALLBACK_CAMPAIGN: Campaign = {
  id: 1,
  frequencyCap: 3,
  cooldownSeconds: 300,
  ads: [
    { id: 1, title: 'Fwaya sponsored promotion 1', mediaType: 'IMAGE', mediaUrl: 'https://res.cloudinary.com/dayn5vifn/image/upload/v1788368656/ChatGPT_Image_Sep_2_2026_06_58_51_PM_2_krnf19.png' },
    { id: 2, title: 'Fwaya sponsored promotion 2', mediaType: 'IMAGE', mediaUrl: 'https://res.cloudinary.com/dayn5vifn/image/upload/v1788368656/ChatGPT_Image_Sep_2_2026_06_48_12_PM_1_vnf9ld.png' },
    { id: 3, title: 'Fwaya sponsored promotion 3', mediaType: 'IMAGE', mediaUrl: 'https://res.cloudinary.com/dayn5vifn/image/upload/v1788368657/ChatGPT_Image_Sep_2_2026_06_56_15_PM_1_x6mtxq.png' },
  ],
};

export default function FreeUserAdBanner() {
  const { user, loading } = useAuth();
  const [ad, setAd] = useState<Ad | null>(null);
  const [campaignId, setCampaignId] = useState<number | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([FALLBACK_CAMPAIGN]);
  const [dismissed, setDismissed] = useState(false);

  const hasActivePremium = Boolean(user?.isPremium && user.premiumUntil && new Date(user.premiumUntil) > new Date());

  useEffect(() => {
    if (hasActivePremium) return;
    const load = async () => {
      try {
        const response = await fetch('/api/advertising/active', { cache: 'no-store' });
        if (response.ok) {
          const loadedCampaigns = await response.json();
          setCampaigns(Array.isArray(loadedCampaigns) && loadedCampaigns.length ? loadedCampaigns : [FALLBACK_CAMPAIGN]);
        } else {
          setCampaigns([FALLBACK_CAMPAIGN]);
        }
      } catch (error) {
        console.warn('Unable to load sponsored ads', error);
        setCampaigns([FALLBACK_CAMPAIGN]);
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
      if (!entry) return true;
      if (now - entry.lastShown >= campaign.cooldownSeconds * 1000) {
        entry.count = 0;
        return true;
      }
      return entry.count < campaign.frequencyCap;
    });
    // Frequency limits control impression counting, not whether an active campaign is visible.
    const pool = eligible.length ? eligible : campaigns.filter((campaign) => campaign.ads.length);
    const selectedCampaign = pool.find((item) => item.ads.length);
    if (!selectedCampaign) return;
    const nextAd = selectedCampaign.ads[Math.floor(Math.random() * selectedCampaign.ads.length)];
    setCampaignId(selectedCampaign.id);
    setAd(nextAd);
    const previous = impressions[String(selectedCampaign.id)];
    const wasRecentlyCounted = previous && now - previous.lastShown < 10_000;
    impressions[String(selectedCampaign.id)] = {
      count: wasRecentlyCounted
        ? previous.count
        : Math.min((previous?.count || 0) + 1, selectedCampaign.frequencyCap),
      lastShown: wasRecentlyCounted ? previous.lastShown : now,
    };
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

  if (loading || hasActivePremium || !ad || dismissed) return null;
  const content = ad.mediaType === 'VIDEO'
    ? <video src={ad.mediaUrl} className="block h-auto max-h-96 w-full object-cover" autoPlay muted loop playsInline />
    : <img src={ad.mediaUrl} alt={ad.title} className="block h-auto max-h-96 w-full object-cover" />;

  return (
    <div className="mx-auto mb-6 w-full max-w-7xl">
      {ad.clickUrl ? <a href={ad.clickUrl} target="_blank" rel="noreferrer" aria-label={`Open sponsored ad: ${ad.title}`}>{content}</a> : content}
    </div>
  );
}