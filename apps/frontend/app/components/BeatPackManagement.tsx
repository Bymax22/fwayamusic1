'use client';

import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, Lock, Unlock, Package, TrendingUp } from 'lucide-react';

interface BeatPack {
  id: number;
  title: string;
  description: string;
  genre: string;
  price: number;
  accessType: 'FREE' | 'PREMIUM';
  coverUrl: string;
  beatCount: number;
  playCount: number;
  downloadCount: number;
  createdAt: string;
}

interface BeatPackAnalytics {
  pack: {
    id: number;
    title: string;
    genre: string;
    beatCount: number;
  };
  analytics: {
    playCount: number;
    downloadCount: number;
    likeCount: number;
    followerCount: number;
    engagementRate: number;
    estimatedRevenue: string;
  };
}

export default function BeatPackManagement({ packId }: { packId?: number }) {
  const [packs, setPacks] = useState<BeatPack[]>([]);
  const [selectedPack, setSelectedPack] = useState<BeatPack | null>(null);
  const [analytics, setAnalytics] = useState<BeatPackAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    genre: '',
    price: 0,
    accessType: 'FREE' as 'FREE' | 'PREMIUM'
  });

  useEffect(() => {
    if (packId) {
      fetchPackAnalytics(packId);
    } else {
      fetchProducerPacks();
    }
  }, [packId]);

  const fetchProducerPacks = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/v1/beat-packs/producer/me', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Failed to fetch packs');
      const data = await response.json();
      setPacks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load packs');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPackAnalytics = async (id: number) => {
    try {
      const response = await fetch(`/api/v1/beat-packs/${id}/analytics`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Failed to fetch analytics');
      const data = await response.json();
      setAnalytics(data);
      setSelectedPack(data.pack);
      setFormData({
        title: data.pack.title,
        description: data.pack.description || '',
        genre: data.pack.genre || '',
        price: data.pack.price || 0,
        accessType: data.pack.accessType
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    }
  };

  const handleUpdatePack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPack) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/v1/beat-packs/${selectedPack.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to update pack');
      const updated = await response.json();
      setSelectedPack(updated);
      setIsEditing(false);
      fetchPackAnalytics(selectedPack.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update pack');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAccess = async () => {
    if (!selectedPack) return;

    try {
      setIsLoading(true);
      const newAccess = selectedPack.accessType === 'FREE' ? 'PREMIUM' : 'FREE';
      const response = await fetch(`/api/v1/beat-packs/${selectedPack.id}/access-type`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ accessType: newAccess })
      });

      if (!response.ok) throw new Error('Failed to update access type');
      const result = await response.json();
      setSelectedPack(result.pack);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update access');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePack = async () => {
    if (!selectedPack || !window.confirm('Delete this beat pack?')) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/v1/beat-packs/${selectedPack.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (!response.ok) throw new Error('Failed to delete pack');
      setPacks(packs.filter(p => p.id !== selectedPack.id));
      setSelectedPack(null);
      setAnalytics(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete pack');
    } finally {
      setIsLoading(false);
    }
  };

  // Grid view when no pack is selected
  if (!packId && packs.length > 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6">Beat Packs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packs.map((pack) => (
            <div
              key={pack.id}
              className="border rounded-lg overflow-hidden hover:shadow-lg transition"
            >
              <div className="aspect-square bg-gray-200 relative">
                {pack.coverUrl ? (
                  <img src={pack.coverUrl} alt={pack.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500">
                    <Package size={48} className="text-white" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-bold text-gray-900">{pack.title}</h3>
                <p className="text-sm text-gray-600 mb-2">{pack.genre} • {pack.beatCount} beats</p>
                <div className="flex justify-between items-center">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    pack.accessType === 'FREE' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
                  }`}>
                    {pack.accessType}
                  </span>
                  <button
                    onClick={() => setSelectedPack(pack)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Detailed view
  if (analytics && selectedPack) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 rounded text-red-700">
            {error}
          </div>
        )}

        {!isEditing ? (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">{selectedPack.title}</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <Edit2 size={20} className="text-blue-600" />
                </button>
                <button onClick={handleDeletePack} disabled={isLoading} className="p-2 hover:bg-gray-100 rounded">
                  <Trash2 size={20} className="text-red-600" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded">
                <p className="text-xs text-gray-600">Plays</p>
                <p className="text-2xl font-bold text-blue-600">{analytics.analytics.playCount}</p>
              </div>
              <div className="bg-green-50 p-4 rounded">
                <p className="text-xs text-gray-600">Downloads</p>
                <p className="text-2xl font-bold text-green-600">{analytics.analytics.downloadCount}</p>
              </div>
              <div className="bg-red-50 p-4 rounded">
                <p className="text-xs text-gray-600">Likes</p>
                <p className="text-2xl font-bold text-red-600">{analytics.analytics.likeCount}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded">
                <p className="text-xs text-gray-600">Engagement</p>
                <p className="text-2xl font-bold text-purple-600">{analytics.analytics.engagementRate.toFixed(1)}%</p>
              </div>
            </div>

            <div className="flex gap-2 mb-6">
              <button
                onClick={handleToggleAccess}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition disabled:opacity-50"
              >
                {selectedPack.accessType === 'FREE' ? (
                  <>
                    <Unlock size={18} /> Switch to Premium
                  </>
                ) : (
                  <>
                    <Lock size={18} /> Switch to Free
                  </>
                )}
              </button>
              <span className={`px-3 py-2 rounded-lg font-medium text-sm ${
                selectedPack.accessType === 'FREE' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
              }`}>
                {selectedPack.accessType}
              </span>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="text-blue-600" />
                <h3 className="font-bold">Revenue Estimate</h3>
              </div>
              <p className="text-3xl font-bold text-green-600">${analytics.analytics.estimatedRevenue}</p>
              <p className="text-sm text-gray-600 mt-2">Based on {analytics.analytics.downloadCount} downloads</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleUpdatePack} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Genre</label>
                <input
                  type="text"
                  value={formData.genre}
                  onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="text-center py-12">
      {isLoading ? <p>Loading...</p> : <p>No beat packs found. Create one to get started!</p>}
    </div>
  );
}
