'use client';

import React, { useState, useEffect } from 'react';
import { Upload, Edit2, Trash2, TrendingUp, Lock, Unlock } from 'lucide-react';
import CoverArtImage from './CoverArtImage';

interface BeatAnalytics {
  beat: {
    id: number;
    title: string;
    genre: string;
    accessType: 'FREE' | 'PREMIUM' | 'PAY_PER_VIEW';
    createdAt: string;
    updatedAt: string;
  };
  analytics: {
    playCount: number;
    downloadCount: number;
    shareCount: number;
    likeCount: number;
    commentCount: number;
    followerCount: number;
    averageRating: number;
    engagementRate: number;
  };
  monetization: {
    price: number;
    accessType: string;
    estimatedRevenue: string;
  };
}

interface Beat {
  id: number;
  title: string;
  description: string;
  genre: string;
  bpm: number;
  price: number;
  accessType: 'FREE' | 'PREMIUM' | 'PAY_PER_VIEW';
  artCoverUrl: string;
  playCount: number;
  downloadCount: number;
  likeCount: number;
  createdAt: string;
}

export default function BeatManagementPanel({ beatId, onUpdate }: { beatId: number; onUpdate?: () => void }) {
  const [beat, setBeat] = useState<Beat | null>(null);
  const [analytics, setAnalytics] = useState<BeatAnalytics | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCover, setSelectedCover] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    genre: '',
    bpm: 0,
    price: 0,
  });

  // Fetch beat details and analytics on mount
  useEffect(() => {
    fetchBeatDetails();
    fetchAnalytics();
  }, [beatId]);

  const fetchBeatDetails = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/v1/beats/${beatId}/detailed`);
      if (!response.ok) throw new Error('Failed to fetch beat details');
      const data = await response.json();
      setBeat(data);
      setEditFormData({
        title: data.title,
        description: data.description || '',
        genre: data.genre || '',
        bpm: data.bpm || 0,
        price: data.price || 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch beat');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/v1/beats/${beatId}/analytics`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!response.ok) throw new Error('Failed to fetch analytics');
      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedCover(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateBeat = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('title', editFormData.title);
      formData.append('description', editFormData.description);
      formData.append('genre', editFormData.genre);
      formData.append('bpm', editFormData.bpm.toString());
      formData.append('price', editFormData.price.toString());

      if (selectedCover) {
        formData.append('coverFile', selectedCover);
      }

      const response = await fetch(`/api/v1/beats/${beatId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to update beat');
      
      const updated = await response.json();
      setBeat(updated);
      setIsEditing(false);
      setSelectedCover(null);
      setCoverPreview(null);
      onUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update beat');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAccessType = async () => {
    if (!beat) return;
    try {
      setIsLoading(true);
      const newAccessType = beat.accessType === 'FREE' ? 'PREMIUM' : 'FREE';
      
      const response = await fetch(`/api/v1/beats/${beatId}/access-type`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ accessType: newAccessType }),
      });

      if (!response.ok) throw new Error('Failed to update access type');
      
      const result = await response.json();
      setBeat(result.beat);
      fetchAnalytics();
      onUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update access type');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBeat = async () => {
    if (!window.confirm('Are you sure you want to delete this beat? This action cannot be undone.')) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`/api/v1/beats/${beatId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      if (!response.ok) throw new Error('Failed to delete beat');
      
      // Redirect or notify parent component
      onUpdate?.();
      window.location.href = '/dashboard/beats';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete beat');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !beat) {
    return <div className="p-6 text-center">Loading beat details...</div>;
  }

  if (!beat) {
    return <div className="p-6 text-center text-red-500">Failed to load beat</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 rounded text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Cover Art Section */}
        <div className="md:col-span-1">
          <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden mb-4">
            <CoverArtImage
              src={coverPreview || beat.artCoverUrl || '/placeholder-beat.png'}
              alt={beat.title}
              className="w-full h-full object-cover"
            />
          </div>
          {isEditing && (
            <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition">
              <Upload size={20} className="text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Upload Cover</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverChange}
                className="hidden"
              />
            </label>
          )}

          {/* Analytics Cards */}
          {analytics && (
            <div className="space-y-3 mt-6">
              <div className="bg-blue-50 p-3 rounded">
                <p className="text-xs text-gray-600">Play Count</p>
                <p className="text-2xl font-bold text-blue-600">{analytics.analytics.playCount}</p>
              </div>
              <div className="bg-green-50 p-3 rounded">
                <p className="text-xs text-gray-600">Downloads</p>
                <p className="text-2xl font-bold text-green-600">{analytics.analytics.downloadCount}</p>
              </div>
              <div className="bg-purple-50 p-3 rounded">
                <p className="text-xs text-gray-600">Likes</p>
                <p className="text-2xl font-bold text-purple-600">{analytics.analytics.likeCount}</p>
              </div>
              <div className="bg-orange-50 p-3 rounded">
                <p className="text-xs text-gray-600">Comments</p>
                <p className="text-2xl font-bold text-orange-600">{analytics.analytics.commentCount}</p>
              </div>
              <div className="bg-indigo-50 p-3 rounded">
                <p className="text-xs text-gray-600">Followers</p>
                <p className="text-2xl font-bold text-indigo-600">{analytics.analytics.followerCount}</p>
              </div>
            </div>
          )}
        </div>

        {/* Beat Details Section */}
        <div className="md:col-span-2">
          {!isEditing ? (
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{beat.title}</h2>
                  <p className="text-gray-600 mt-1">{beat.genre}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 hover:bg-gray-100 rounded transition"
                    title="Edit beat"
                  >
                    <Edit2 size={20} className="text-blue-600" />
                  </button>
                  <button
                    onClick={handleDeleteBeat}
                    disabled={isLoading}
                    className="p-2 hover:bg-gray-100 rounded transition disabled:opacity-50"
                    title="Delete beat"
                  >
                    <Trash2 size={20} className="text-red-600" />
                  </button>
                </div>
              </div>

              <p className="text-gray-700 mb-4">{beat.description}</p>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">BPM</label>
                  <p className="text-lg font-semibold">{beat.bpm}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Price</label>
                  <p className="text-lg font-semibold">${beat.price.toFixed(2)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-6">
                <button
                  onClick={handleToggleAccessType}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition disabled:opacity-50"
                >
                  {beat.accessType === 'FREE' ? (
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
                  beat.accessType === 'FREE' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
                }`}>
                  {beat.accessType}
                </span>
              </div>

              {analytics && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp size={20} className="text-blue-600" />
                    <h3 className="font-semibold text-gray-900">Engagement Metrics</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-600">Engagement Rate</p>
                      <p className="text-lg font-bold text-blue-600">{analytics.analytics.engagementRate.toFixed(2)}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Avg Rating</p>
                      <p className="text-lg font-bold text-yellow-600">★ {analytics.analytics.averageRating.toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Est. Revenue</p>
                      <p className="text-lg font-bold text-green-600">${analytics.monetization.estimatedRevenue}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Shares</p>
                      <p className="text-lg font-bold text-pink-600">{analytics.analytics.shareCount}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleUpdateBeat} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Genre</label>
                  <input
                    type="text"
                    value={editFormData.genre}
                    onChange={(e) => setEditFormData({ ...editFormData, genre: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">BPM</label>
                  <input
                    type="number"
                    value={editFormData.bpm}
                    onChange={(e) => setEditFormData({ ...editFormData, bpm: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editFormData.price}
                  onChange={(e) => setEditFormData({ ...editFormData, price: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
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
                  onClick={() => {
                    setIsEditing(false);
                    setSelectedCover(null);
                    setCoverPreview(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
