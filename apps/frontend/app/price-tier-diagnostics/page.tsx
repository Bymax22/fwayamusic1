'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function PriceTierDiagnosticsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">Price Tier Diagnostics</h1>
          <p className="text-red-400">You must be logged in to access this page.</p>
        </div>
      </div>
    );
  }

  const fetchTiers = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/admin/pricing/price-tiers');
      const data = await res.json();
      setResult({
        type: 'tiers',
        message: `Found ${data.length} price tier(s)`,
        data
      });
    } catch (err) {
      setError(`Failed to fetch tiers: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const fixExpiredTiers = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/admin/pricing/fix-tiers', {
        method: 'POST',
      });
      if (!res.ok) {
        const errorData = await res.json();
        setError(`Fix failed: ${errorData.error || res.statusText}`);
        return;
      }
      const data = await res.json();
      setResult({
        type: 'fix',
        message: data.message,
        data
      });
    } catch (err) {
      setError(`Failed to fix tiers: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Price Tier Diagnostics</h1>
        <p className="text-gray-400 mb-6">Use these tools to diagnose and fix price tier issues.</p>

        <div className="space-y-4 mb-8">
          <button
            onClick={fetchTiers}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg font-semibold"
          >
            {loading && result?.type === 'tiers' ? 'Fetching...' : 'View Current Tiers'}
          </button>

          <button
            onClick={fixExpiredTiers}
            disabled={loading}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg font-semibold ml-4"
          >
            {loading && result?.type === 'fix' ? 'Fixing...' : 'Fix Expired Tiers'}
          </button>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-600 rounded-lg p-4 mb-6">
            <p className="text-red-400 font-semibold">Error</p>
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {result && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <p className="text-green-400 font-semibold mb-4">{result.message}</p>
            <pre className="bg-gray-900 p-4 rounded overflow-auto max-h-96 text-sm text-gray-300">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
