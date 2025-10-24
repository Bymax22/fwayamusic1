"use client";
import { useEffect, useState, useCallback } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Link, 
  Share2, 
  Eye, 
  ShoppingCart, 
  Wallet, 
  BarChart3,
  Copy,
  Check,
  Plus,
  Filter,
  Download,
  ArrowUpRight,
  UserCheck,
  AlertTriangle,
  Shield,
  CreditCard,
  BanknoteIcon
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Image from "next/image";
import React from "react";
import { AuthProvider, useAuth } from "../context/AuthContext"; // <-- added useAuth
import { ThemeProvider } from "../context/ThemeContext";
import { PaymentProvider } from "../context/PaymentContext";
import { useRouter } from 'next/navigation';
import RoleGuard from '@/components/RoleGuard';


type TabId = 'overview' | 'links' | 'commissions' | 'payouts' | 'verification';

const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'links', label: 'Reseller Links', icon: <Link className="w-4 h-4" /> },
  { id: 'commissions', label: 'Commissions', icon: <DollarSign className="w-4 h-4" /> },
  { id: 'payouts', label: 'Payouts', icon: <Wallet className="w-4 h-4" /> },
  { id: 'verification', label: 'Verification', icon: <UserCheck className="w-4 h-4" /> },
];

interface Commission {
  id: number;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'HOLD';
  resellerId: number;
  transactionId: number;
  mediaId: number;
  commissionRate: number;
  isPaid: boolean;
  paidAt: string | null;
  createdAt: string;
  media: {
    title: string;
    artCoverUrl: string;
  };
  transaction: {
    user: {
      displayName: string;
      username: string;
    };
    reference: string;
  };
}

interface ResellerLink {
  id: number;
  code: string;
  resellerId: number;
  mediaId: number;
  clickCount: number;
  conversionCount: number;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  customCommissionRate: number | null;
  createdAt: string;
  expiresAt: string | null;
  media: {
    id: number;
    title: string;
    artCoverUrl: string;
    price: number;
    accessType: 'FREE' | 'PREMIUM' | 'PAY_PER_VIEW';
    user: {
      displayName: string;
    };
  };
  transactions: Array<{
    id: number;
    amount: number;
    status: string;
    createdAt: string;
  }>;
}

interface DashboardStats {
  totalCommission: number;
  paidCommission: number;
  pendingCommission: number;
  totalSales: number;
  conversionRate: number;
  activeLinks: number;
  monthlyGrowth: number;
}

interface PaymentAccount {
  id: number;
  provider: 'MTN_MONEY' | 'AIRTEL_MONEY' | 'BANK' | 'STRIPE' | 'PAYPAL';
  accountType: 'MOBILE_MONEY' | 'BANK_TRANSFER' | 'CREDIT_CARD';
  accountNumber: string;
  accountName: string | null;
  country: string | null;
  currency: 'USD' | 'EUR' | 'ZMW' | 'ZAR' | 'KES';
  isVerified: boolean;
  isDefault: boolean;
}

interface KYCStatus {
  isVerified: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NOT_SUBMITTED';
  submittedAt: string | null;
  verifiedAt: string | null;
  rejectionReason: string | null;
  documents: Array<{
    type: string;
    url: string;
    status: string;
  }>;
}

interface Media {
  id: number;
  title: string;
  artCoverUrl: string;
  price: number;
  accessType: 'FREE' | 'PREMIUM' | 'PAY_PER_VIEW';
  user: {
    displayName: string;
  };
}

interface NewPaymentAccount {
  provider: 'MTN_MONEY' | 'AIRTEL_MONEY' | 'BANK' | 'STRIPE' | 'PAYPAL';
  accountType: 'MOBILE_MONEY' | 'BANK_TRANSFER' | 'CREDIT_CARD';
  accountNumber: string;
  accountName?: string | null;
  country?: string | null;
  currency: 'USD' | 'EUR' | 'ZMW' | 'ZAR' | 'KES';
}

export default function ResellerDashboard() {
  const { user } = useAuth();
  const router = useRouter();

  // Helper: try get token from localStorage (fallback if AuthContext doesn't expose token)
  const getAuthToken = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authToken') || localStorage.getItem('token') || null;
  };

  const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = getAuthToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (user?.id) headers['user-id'] = String(user.id);
    return headers;
  };

  // Clipboard helper
  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // fallback
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopiedLink(text);
      setTimeout(() => setCopiedLink(null), 2500);
    } catch (e) {
      console.error('Copy failed', e);
    }
  };
  const [stats, setStats] = useState<DashboardStats>({
    totalCommission: 0,
    paidCommission: 0,
    pendingCommission: 0,
    totalSales: 0,
    conversionRate: 0,
    activeLinks: 0,
    monthlyGrowth: 0
  });
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [resellerLinks, setResellerLinks] = useState<ResellerLink[]>([]);
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
  const [kycStatus, setKycStatus] = useState<KYCStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'links' | 'commissions' | 'payouts' | 'verification'>('overview');
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<number | null>(null);
  const [availableMedia, setAvailableMedia] = useState<Media[]>([]);

  // memoize fetch function so effect deps are stable
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const commonHeaders = getAuthHeaders();
      const [
        statsRes,
        commissionsRes,
        linksRes,
        accountsRes,
        kycRes,
        mediaRes
      ] = await Promise.all([
        fetch('/api/reseller/stats', { headers: commonHeaders }),
        fetch('/api/reseller/commissions', { headers: commonHeaders }),
        fetch('/api/reseller/links', { headers: commonHeaders }),
        fetch('/api/payment/accounts', { headers: commonHeaders }),
        fetch('/api/kyc/status', { headers: commonHeaders }),
        fetch('/api/media?allowReselling=true', { headers: commonHeaders })
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (commissionsRes.ok) setCommissions(await commissionsRes.json());
      if (linksRes.ok) setResellerLinks(await linksRes.json());
      if (accountsRes.ok) setPaymentAccounts(await accountsRes.json());
      if (kycRes.ok) setKycStatus(await kycRes.json());
      if (mediaRes.ok) setAvailableMedia(await mediaRes.json());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]); // depends on user (used by getAuthHeaders)

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }
    fetchDashboardData();
  }, [user, router, fetchDashboardData]);

  

  const generateResellerLink = async (mediaId: number) => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch('/api/reseller/links', {
        method: 'POST',
        headers,
        body: JSON.stringify({ mediaId }),
      });

      if (response.ok) {
        const newLink = await response.json();
        setResellerLinks(prev => [newLink, ...prev]);
        setSelectedMedia(null);
        await fetchDashboardData(); // Refresh stats
      } else {
        const err = await response.json().catch(()=>({ message: 'Unknown error' }));
        console.error('Create link failed', err);
      }
    } catch (error) {
      console.error('Error generating link:', error);
    }
  };

  const getResellerLinkUrl = (code: string) => {
    return `${window.location.origin}/purchase/${code}`;
  };

  const handlePayoutRequest = async () => {
    if (!kycStatus?.isVerified) {
      alert('Please complete KYC verification before requesting payouts');
      setActiveTab('verification');
      return;
    }
 
    if (stats.pendingCommission < 10) {
      alert('Minimum payout amount is $10');
      return;
    }

    try {
      const headers = getAuthHeaders();
      const response = await fetch('/api/reseller/payouts', {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          amount: stats.pendingCommission,
          currency: 'USD' // Default currency
        }),
      });

      if (response.ok) {
        alert('Payout request submitted successfully!');
        await fetchDashboardData(); // Refresh data
      } else {
        const error = await response.json();
        alert(`Payout failed: ${error.message}`);
      }
    } catch (error) {
      console.error('Error requesting payout:', error);
      alert('Payout request failed. Please try again.');
    }
  };

  const addPaymentAccount = async (accountData: NewPaymentAccount) => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch('/api/payment/accounts', {
        method: 'POST',
        headers,
        body: JSON.stringify(accountData),
      });

      if (response.ok) {
        const newAccount = await response.json();
        setPaymentAccounts(prev => [...prev, newAccount]);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error adding payment account:', error);
      return false;
    }
  };
  
<button
  onClick={async () => {
    // Replace with a modal/form in production!
    await addPaymentAccount({
      provider: 'MTN_MONEY',
      accountType: 'MOBILE_MONEY',
      accountNumber: '260900000000',
      accountName: 'Demo User',
      country: 'ZM',
      currency: 'ZMW'
    });
    alert('Demo payout method added!');
  }}
  className="w-full flex items-center gap-3 p-4 bg-[#0a3747] hover:bg-[#0a3747]/80 rounded-lg transition-colors text-left border-2 border-dashed border-[#0a3747]"
>
  <Plus className="w-5 h-5 text-[#e51f48]" />
  <div>
    <p className="font-medium text-white">Add Payout Method</p>
    <p className="text-sm text-gray-400">Add mobile money or bank account</p>
  </div>
</button>
  const startKYCVerification = async () => {
    try {
      const response = await fetch('/api/kyc/start', {
        method: 'POST',
      });

      if (response.ok) {
        const { verificationUrl } = await response.json();
        window.open(verificationUrl, '_blank');
      }
    } catch (error) {
      console.error('Error starting KYC:', error);
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'MTN_MONEY':
        return <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-xs">MTN</span>
        </div>;
      case 'AIRTEL_MONEY':
        return <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-xs">ATL</span>
        </div>;
      case 'BANK':
        return <BanknoteIcon className="w-6 h-6 text-blue-400" />;
      default:
        return <CreditCard className="w-6 h-6 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
      case 'APPROVED':
      case 'ACTIVE':
        return 'bg-green-500/20 text-green-400';
      case 'PENDING':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'FAILED':
      case 'REJECTED':
      case 'SUSPENDED':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto bg-gradient-to-br from-[#0a3747]/95 to-[#0a1f29]/95 min-h-screen">
        <div className="animate-pulse">
          <div className="h-8 bg-[#0a3747] rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-[#0a3747] rounded-xl"></div>
            ))}
          </div>
          <div className="h-64 bg-[#0a3747] rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <RoleGuard       allowedRoles={['RESELLER']} 
      requireKYC={true}
      requireEmailVerification={true}
      fallbackPath="/auth/reseller/signin"
    >
    <ThemeProvider>
      <AuthProvider>
        <PaymentProvider>
    <div className="p-6 max-w-7xl mx-auto bg-gradient-to-br from-[#0a3747]/95 to-[#0a1f29]/95 min-h-screen pb-32">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Reseller Dashboard</h1>
          <p className="text-gray-400">Track your earnings and manage your reseller links</p>
        </div>
        <div className="flex items-center gap-4">
          {/* KYC Status Badge */}
          {kycStatus && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
              kycStatus.isVerified 
                ? 'bg-green-500/20 text-green-400' 
                : kycStatus.status === 'PENDING'
                ? 'bg-yellow-500/20 text-yellow-400'
                : 'bg-red-500/20 text-red-400'
            }`}>
              <Shield className="w-4 h-4" />
              <span className="text-sm font-medium">
                {kycStatus.isVerified ? 'Verified' : 
                 kycStatus.status === 'PENDING' ? 'Under Review' : 'Not Verified'}
              </span>
            </div>
          )}
          <button
            onClick={handlePayoutRequest}
            disabled={!kycStatus?.isVerified || stats.pendingCommission < 10}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#e51f48] to-[#ff4d6d] disabled:from-gray-600 disabled:to-gray-600 text-white rounded-xl hover:shadow-lg transition-all"
          >
            <Wallet className="w-5 h-5" />
            Request Payout
          </button>
        </div>
      </div>

       {/* Navigation Tabs */}
<div className="flex gap-4 border-b border-[#0a3747] pb-2 mb-6 overflow-x-auto">
  {tabs.map(tab => (
    <button
      key={tab.id}
      onClick={() => setActiveTab(tab.id)}
      className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors whitespace-nowrap ${
        activeTab === tab.id 
          ? 'text-[#e51f48] border-b-2 border-[#e51f48]' 
          : 'text-gray-400 hover:text-gray-300'
      }`}
    >
      {tab.icon}
      {tab.label}
    </button>
  ))}
</div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-[#0a3747]/70 rounded-xl p-6 border-l-4 border-green-500">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-gray-400 text-sm mb-1">Total Earnings</p>
              <p className="text-2xl font-bold text-white">${stats.totalCommission.toFixed(2)}</p>
            </div>
            <div className="p-2 bg-green-500/20 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-400" />
            </div>
          </div>
          <div className="flex items-center gap-1 text-green-400 text-sm">
            <ArrowUpRight className="w-4 h-4" />
            <span>+{stats.monthlyGrowth}% this month</span>
          </div>
        </div>

        <div className="bg-[#0a3747]/70 rounded-xl p-6 border-l-4 border-blue-500">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-gray-400 text-sm mb-1">Pending Earnings</p>
              <p className="text-2xl font-bold text-white">${stats.pendingCommission.toFixed(2)}</p>
            </div>
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Wallet className="w-6 h-6 text-blue-400" />
            </div>
          </div>
          <p className="text-blue-400 text-sm">Available for payout</p>
        </div>

        <div className="bg-[#0a3747]/70 rounded-xl p-6 border-l-4 border-purple-500">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-gray-400 text-sm mb-1">Total Sales</p>
              <p className="text-2xl font-bold text-white">{stats.totalSales}</p>
            </div>
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-purple-400" />
            </div>
          </div>
          <div className="flex items-center gap-1 text-purple-400 text-sm">
            <TrendingUp className="w-4 h-4" />
            <span>{stats.conversionRate}% conversion rate</span>
          </div>
        </div>

        <div className="bg-[#0a3747]/70 rounded-xl p-6 border-l-4 border-orange-500">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-gray-400 text-sm mb-1">Active Links</p>
              <p className="text-2xl font-bold text-white">{stats.activeLinks}</p>
            </div>
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <Link className="w-6 h-6 text-orange-400" />
            </div>
          </div>
          <p className="text-orange-400 text-sm">Generating commissions</p>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Commissions */}
          <div className="lg:col-span-2 bg-[#0a3747]/70 rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Recent Commissions</h2>
              <button 
                onClick={() => setActiveTab('commissions')}
                className="text-[#e51f48] hover:text-[#ff4d6d] text-sm"
              >
                View all
              </button>
            </div>
            <div className="space-y-4">
              {commissions.slice(0, 5).map(commission => (
                <div key={commission.id} className="flex items-center justify-between p-4 bg-[#0a3747] rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      commission.status === 'PAID' ? 'bg-green-500' : 
                      commission.status === 'PENDING' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                    <div>
                      <p className="font-medium text-white">{commission.media.title}</p>
                      <p className="text-sm text-gray-400">
                        {commission.transaction.user.displayName || commission.transaction.user.username}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-white">
                      {commission.currency} {commission.amount.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-400">
                      {formatDistanceToNow(new Date(commission.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions & KYC Status */}
          <div className="space-y-6">
            {/* KYC Status Card */}
            <div className="bg-[#0a3747]/70 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Verification Status</h2>
              {kycStatus ? (
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg ${
                    kycStatus.isVerified ? 'bg-green-500/20' :
                    kycStatus.status === 'PENDING' ? 'bg-yellow-500/20' : 'bg-red-500/20'
                  }`}>
                    <div className="flex items-center gap-3">
                      <Shield className={`w-6 h-6 ${
                        kycStatus.isVerified ? 'text-green-400' :
                        kycStatus.status === 'PENDING' ? 'text-yellow-400' : 'text-red-400'
                      }`} />
                      <div>
                        <p className="font-medium text-white">
                          {kycStatus.isVerified ? 'Identity Verified' :
                           kycStatus.status === 'PENDING' ? 'Under Review' : 'Verification Required'}
                        </p>
                        <p className="text-sm text-gray-400">
                          {kycStatus.isVerified ? 
                            `Verified on ${new Date(kycStatus.verifiedAt!).toLocaleDateString()}` :
                           kycStatus.status === 'PENDING' ? 
                            'Your documents are being reviewed' :
                            'Complete verification to enable payouts'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                  {!kycStatus.isVerified && kycStatus.status !== 'PENDING' && (
                    <button
                      onClick={startKYCVerification}
                      className="w-full py-3 bg-[#e51f48] hover:bg-[#ff4d6d] text-white rounded-xl transition-colors font-medium"
                    >
                      Start Verification
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">Verification status unavailable</p>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-[#0a3747]/70 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-6">Quick Actions</h2>
              <div className="space-y-4">
                <button 
                  onClick={() => setActiveTab('links')}
                  className="w-full flex items-center gap-3 p-4 bg-[#0a3747] hover:bg-[#0a3747]/80 rounded-lg transition-colors text-left"
                >
                  <Plus className="w-5 h-5 text-[#e51f48]" />
                  <div>
                    <p className="font-medium text-white">Create New Link</p>
                    <p className="text-sm text-gray-400">Generate reseller link for a track</p>
                  </div>
                </button>

                <button 
                  onClick={handlePayoutRequest}
                  disabled={!kycStatus?.isVerified || stats.pendingCommission < 10}
                  className="w-full flex items-center gap-3 p-4 bg-[#0a3747] hover:bg-[#0a3747]/80 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors text-left"
                >
                  <Wallet className="w-5 h-5 text-[#e51f48]" />
                  <div>
                    <p className="font-medium text-white">Request Payout</p>
                    <p className="text-sm text-gray-400">Withdraw earnings to your account</p>
                  </div>
                </button>

                <button className="w-full flex items-center gap-3 p-4 bg-[#0a3747] hover:bg-[#0a3747]/80 rounded-lg transition-colors text-left">
                  <Download className="w-5 h-5 text-[#e51f48]" />
                  <div>
                    <p className="font-medium text-white">Export Reports</p>
                    <p className="text-sm text-gray-400">Download sales and earnings data</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'links' && (
        <div className="space-y-6">
          {/* Create New Link */}
          <div className="bg-[#0a3747]/70 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Generate Reseller Link</h2>
            <div className="flex gap-4">
              <select 
                value={selectedMedia || ''}
                onChange={(e) => setSelectedMedia(Number(e.target.value))}
                className="flex-1 px-4 py-3 bg-[#0a3747] border border-[#0a3747] text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e51f48] focus:border-transparent"
              >
                <option value="">Select a track to promote</option>
                {availableMedia.map(media => (
                  <option key={media.id} value={media.id}>
                    {media.title} - {media.user.displayName} (${media.price})
                  </option>
                ))}
              </select>
              <button
                onClick={() => selectedMedia && generateResellerLink(selectedMedia)}
                disabled={!selectedMedia}
                className="px-6 py-3 bg-[#e51f48] hover:bg-[#ff4d6d] disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
              >
                Generate Link
              </button>
            </div>
          </div>

          {/* Active Links */}
          <div className="bg-[#0a3747]/70 rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Your Reseller Links</h2>
              <div className="flex gap-2">
                <button className="p-2 bg-[#0a3747] rounded-lg text-gray-400 hover:text-white transition-colors">
                  <Filter className="w-4 h-4" />
                </button>
                <button className="p-2 bg-[#0a3747] rounded-lg text-gray-400 hover:text-white transition-colors">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {resellerLinks.map(link => (
                <div key={link.id} className="bg-[#0a3747] rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {link.media.artCoverUrl ? (
                        <Image
                          src={link.media.artCoverUrl} 
                          alt={link.media.title}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-[#e51f48] to-[#ff4d6d] rounded-lg flex items-center justify-center">
                          <Link className="w-6 h-6 text-white" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-white">{link.media.title}</p>
                        <p className="text-sm text-gray-400">
                          by {link.media.user.displayName}
                        </p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {link.clickCount} clicks
                          </span>
                          <span className="flex items-center gap-1">
                            <ShoppingCart className="w-3 h-3" />
                            {link.conversionCount} sales
                          </span>
                          <span>Conversion: {((link.conversionCount / link.clickCount) * 100 || 0).toFixed(1)}%</span>
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(link.status)}`}>
                            {link.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm text-gray-400">Your Link:</p>
                        <div className="flex items-center gap-2">
                          <code className="text-white bg-[#0a1f29] px-2 py-1 rounded text-sm">
                            {getResellerLinkUrl(link.code)}
                          </code>
                          <button
                            onClick={() => copyToClipboard(getResellerLinkUrl(link.code))}
                            className="p-1 text-gray-400 hover:text-[#e51f48] transition-colors"
                          >
                            {copiedLink === getResellerLinkUrl(link.code) ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                      <button className="p-2 bg-[#0a1f29] text-gray-400 hover:text-white rounded-lg transition-colors">
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'commissions' && (
        <div className="bg-[#0a3747]/70 rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Commission History</h2>
            <div className="flex gap-2">
              <select className="px-3 py-2 bg-[#0a3747] border border-[#0a3747] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e51f48] focus:border-transparent">
                <option>All Time</option>
                <option>This Month</option>
                <option>Last Month</option>
              </select>
              <button className="p-2 bg-[#0a3747] rounded-lg text-gray-400 hover:text-white transition-colors">
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#0a3747]">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Track</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Customer</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Amount</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {commissions.map(commission => (
                  <tr key={commission.id} className="border-b border-[#0a3747] hover:bg-[#0a3747]/50">
                    <td className="py-3 px-4 text-white">{commission.media.title}</td>
                    <td className="py-3 px-4 text-gray-400">
                      {commission.transaction.user.displayName || commission.transaction.user.username}
                    </td>
                    <td className="py-3 px-4 text-white font-bold">
                      {commission.currency} {commission.amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(commission.status)}`}>
                        {commission.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-400">
                      {formatDistanceToNow(new Date(commission.createdAt), { addSuffix: true })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'payouts' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Payout Methods */}
          <div className="lg:col-span-2 bg-[#0a3747]/70 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-6">Payout Methods</h2>
            <div className="space-y-4">
              {paymentAccounts.map(account => (
                <div key={account.id} className="flex items-center justify-between p-4 bg-[#0a3747] rounded-lg">
                  <div className="flex items-center gap-3">
                    {getProviderIcon(account.provider)}
                    <div>
                      <p className="font-medium text-white">
                        {account.provider.replace('_', ' ')}
                        {account.isDefault && (
                          <span className="ml-2 text-green-400 text-sm">Primary</span>
                        )}
                      </p>
                      <p className="text-sm text-gray-400">
                        {account.accountNumber} • {account.currency}
                        {!account.isVerified && (
                          <span className="ml-2 text-yellow-400 text-sm">Pending Verification</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!account.isDefault && (
                      <button className="text-[#e51f48] hover:text-[#ff4d6d] text-sm">
                        Set Primary
                      </button>
                    )}
                    <button className="text-gray-400 hover:text-white text-sm">
                      Edit
                    </button>
                  </div>
                </div>
              ))}

              <button 
                onClick={() => {/* Open add account modal */}}
                className="w-full flex items-center gap-3 p-4 bg-[#0a3747] hover:bg-[#0a3747]/80 rounded-lg transition-colors text-left border-2 border-dashed border-[#0a3747]"
              >
                <Plus className="w-5 h-5 text-[#e51f48]" />
                <div>
                  <p className="font-medium text-white">Add Payout Method</p>
                  <p className="text-sm text-gray-400">Add mobile money or bank account</p>
                </div>
              </button>
            </div>
          </div>

          {/* Payout Summary */}
          <div className="bg-[#0a3747]/70 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-6">Payout Summary</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Available Balance</span>
                <span className="text-white font-bold">${stats.pendingCommission.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Minimum Payout</span>
                <span className="text-white">$10.00</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Next Payout Date</span>
                <span className="text-white">Instant</span>
              </div>
              
              {!kycStatus?.isVerified && (
                <div className="p-4 bg-yellow-500/20 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm">Complete KYC verification to enable payouts</span>
                  </div>
                </div>
              )}

              <button
                onClick={handlePayoutRequest}
                disabled={!kycStatus?.isVerified || stats.pendingCommission < 10}
                className="w-full mt-4 py-3 bg-[#e51f48] hover:bg-[#ff4d6d] disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-xl transition-colors font-medium"
              >
                Request Payout (${stats.pendingCommission.toFixed(2)})
              </button>
              
              {stats.pendingCommission < 10 && (
                <p className="text-yellow-400 text-sm text-center mt-2">
                  Minimum $10 required for payout
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'verification' && (
        <div className="bg-[#0a3747]/70 rounded-xl p-6">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-2">Identity Verification</h2>
            <p className="text-gray-400 mb-8">
              Complete KYC verification to enable payouts and access all reseller features
            </p>

            {kycStatus ? (
              <div className="space-y-6">
                {/* Status Overview */}
                <div className={`p-6 rounded-xl ${
                  kycStatus.isVerified ? 'bg-green-500/20 border border-green-500/30' :
                  kycStatus.status === 'PENDING' ? 'bg-yellow-500/20 border border-yellow-500/30' :
                  'bg-red-500/20 border border-red-500/30'
                }`}>
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${
                      kycStatus.isVerified ? 'bg-green-500/30' :
                      kycStatus.status === 'PENDING' ? 'bg-yellow-500/30' : 'bg-red-500/30'
                    }`}>
                      <Shield className={`w-8 h-8 ${
                        kycStatus.isVerified ? 'text-green-400' :
                        kycStatus.status === 'PENDING' ? 'text-yellow-400' : 'text-red-400'
                      }`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        {kycStatus.isVerified ? 'Verification Complete' :
                         kycStatus.status === 'PENDING' ? 'Under Review' : 'Verification Required'}
                      </h3>
                      <p className="text-gray-400">
                        {kycStatus.isVerified ? 
                          `Your identity was verified on ${new Date(kycStatus.verifiedAt!).toLocaleDateString()}` :
                         kycStatus.status === 'PENDING' ? 
                          'Your documents are being reviewed. This usually takes 1-2 business days.' :
                          'Please complete the verification process to enable payouts.'
                        }
                      </p>
                      {kycStatus.rejectionReason && (
                        <p className="text-red-400 mt-2">
                          <strong>Reason: </strong>{kycStatus.rejectionReason}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {!kycStatus.isVerified && kycStatus.status !== 'PENDING' && (
                  <div className="text-center">
                    <button
                      onClick={startKYCVerification}
                      className="px-8 py-4 bg-[#e51f48] hover:bg-[#ff4d6d] text-white rounded-xl transition-colors font-medium text-lg"
                    >
                      Start Verification Process
                    </button>
                    <p className="text-gray-400 mt-4 text-sm">
                      You&apos;ll need a government-issued ID and a selfie
                    </p>
                  </div>
                )}

                {/* Document Status */}
  {kycStatus.documents && kycStatus.documents.length > 0 && (
    <div>
      <h4 className="text-lg font-bold text-white mb-4">Document Status</h4>
      <div className="space-y-3">
        {kycStatus.documents.map((doc: KYCStatus['documents'][number], index: number) => (
          <div key={index} className="flex items-center justify-between p-4 bg-[#0a3747] rounded-lg">
            <div>
              <p className="font-medium text-white">{doc.type}</p>
              <p className="text-sm text-gray-400">{doc.status}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              doc.status === 'APPROVED' ? 'bg-green-500/20 text-green-400' :
              doc.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              {doc.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  )}

                {/* Benefits */}
                <div className="bg-[#0a3747] rounded-xl p-6">
                  <h4 className="text-lg font-bold text-white mb-4">Benefits of Verification</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <Wallet className="w-5 h-5 text-green-400" />
                      <span className="text-white">Instant payouts</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-5 h-5 text-green-400" />
                      <span className="text-white">Higher commission rates</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-green-400" />
                      <span className="text-white">Enhanced security</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-5 h-5 text-green-400" />
                      <span className="text-white">Priority support</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <UserCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">Unable to load verification status</p>
                <button
                  onClick={fetchDashboardData}
                  className="mt-4 px-6 py-3 bg-[#e51f48] hover:bg-[#ff4d6d] text-white rounded-xl transition-colors"
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
        </PaymentProvider>
      </AuthProvider>
    </ThemeProvider>
    </RoleGuard>
  );
}