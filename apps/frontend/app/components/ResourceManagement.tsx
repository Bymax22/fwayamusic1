'use client';

import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, Lock, Unlock, Download, TrendingUp } from 'lucide-react';

interface Resource {
  id: number;
  title: string;
  description: string;
  resourceType: 'SAMPLE' | 'LOOP' | 'TEMPLATE' | 'PRESET' | 'SOUND';
  genre: string;
  price: number;
  accessType: 'FREE' | 'PREMIUM';
  thumbnailUrl: string;
  playCount: number;
  downloadCount: number;
  likeCount: number;
  createdAt: string;
}

interface ResourceAnalytics {
  resource: {
    id: number;
    title: string;
    resourceType: string;
    genre: string;
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

const resourceTypeIcons: Record<string, string> = {
  SAMPLE: '📦',
  LOOP: '🔄',
  TEMPLATE: '📋',
  PRESET: '⚙️',
  SOUND: '🔊'
};

export default function ResourceManagement({ resourceId }: { resourceId?: number }) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [analytics, setAnalytics] = useState<ResourceAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    resourceType: 'SAMPLE' as Resource['resourceType'],
    genre: '',
    price: 0,
    accessType: 'FREE' as 'FREE' | 'PREMIUM'
  });

  useEffect(() => {
    if (resourceId) {
      fetchResourceAnalytics(resourceId);
    } else {
      fetchProducerResources();
    }
  }, [resourceId, filterType]);

  const fetchProducerResources = async () => {
    try {
      setIsLoading(true);
      const url = new URL('/api/v1/resources/producer/me', window.location.origin);
      if (filterType) url.searchParams.set('type', filterType);
      
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Failed to fetch resources');
      const data = await response.json();
      setResources(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load resources');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchResourceAnalytics = async (id: number) => {
    try {
      const response = await fetch(`/api/v1/resources/${id}/analytics`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Failed to fetch analytics');
      const data = await response.json();
      setAnalytics(data);
      setSelectedResource(data.resource);
      setFormData({
        title: data.resource.title,
        description: data.resource.description || '',
        resourceType: data.resource.resourceType,
        genre: data.resource.genre || '',
        price: data.resource.price || 0,
        accessType: data.resource.accessType
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    }
  };

  const handleUpdateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResource) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/v1/resources/${selectedResource.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to update resource');
      const updated = await response.json();
      setSelectedResource(updated);
      setIsEditing(false);
      fetchResourceAnalytics(selectedResource.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update resource');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAccess = async () => {
    if (!selectedResource) return;

    try {
      setIsLoading(true);
      const newAccess = selectedResource.accessType === 'FREE' ? 'PREMIUM' : 'FREE';
      const response = await fetch(`/api/v1/resources/${selectedResource.id}/access-type`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ accessType: newAccess })
      });

      if (!response.ok) throw new Error('Failed to update access type');
      const result = await response.json();
      setSelectedResource(result.resource);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update access');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteResource = async () => {
    if (!selectedResource || !window.confirm('Delete this resource?')) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/v1/resources/${selectedResource.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (!response.ok) throw new Error('Failed to delete resource');
      setResources(resources.filter(r => r.id !== selectedResource.id));
      setSelectedResource(null);
      setAnalytics(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete resource');
    } finally {
      setIsLoading(false);
    }
  };

  // Grid view when no resource is selected
  if (!resourceId && resources.length > 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Resources</h2>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">All Types</option>
            <option value="SAMPLE">Samples</option>
            <option value="LOOP">Loops</option>
            <option value="TEMPLATE">Templates</option>
            <option value="PRESET">Presets</option>
            <option value="SOUND">Sounds</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((resource) => (
            <div
              key={resource.id}
              className="border rounded-lg overflow-hidden hover:shadow-lg transition cursor-pointer"
              onClick={() => setSelectedResource(resource)}
            >
              <div className="aspect-square bg-gray-200 relative flex items-center justify-center">
                {resource.thumbnailUrl ? (
                  <img src={resource.thumbnailUrl} alt={resource.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-5xl">{resourceTypeIcons[resource.resourceType]}</div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-gray-600">
                    {resourceTypeIcons[resource.resourceType]}
                  </span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {resource.resourceType}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{resource.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{resource.genre}</p>
                <div className="flex justify-between items-center text-xs">
                  <span className={`px-2 py-1 rounded font-bold ${
                    resource.accessType === 'FREE' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
                  }`}>
                    {resource.accessType}
                  </span>
                  <span className="text-gray-600">
                    <Download size={14} className="inline mr-1" />
                    {resource.downloadCount}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Detailed view
  if (analytics && selectedResource) {
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
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-4xl">{resourceTypeIcons[selectedResource.resourceType]}</span>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedResource.title}</h2>
                    <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded inline-block">
                      {selectedResource.resourceType}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <Edit2 size={20} className="text-blue-600" />
                </button>
                <button onClick={handleDeleteResource} disabled={isLoading} className="p-2 hover:bg-gray-100 rounded">
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
                {selectedResource.accessType === 'FREE' ? (
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
                selectedResource.accessType === 'FREE' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
              }`}>
                {selectedResource.accessType}
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
          <form onSubmit={handleUpdateResource} className="space-y-4">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={formData.resourceType}
                  onChange={(e) => setFormData({ ...formData, resourceType: e.target.value as Resource['resourceType'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="SAMPLE">Sample</option>
                  <option value="LOOP">Loop</option>
                  <option value="TEMPLATE">Template</option>
                  <option value="PRESET">Preset</option>
                  <option value="SOUND">Sound</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Genre</label>
                <input
                  type="text"
                  value={formData.genre}
                  onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
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
      {isLoading ? <p>Loading...</p> : <p>No resources found. Create one to get started!</p>}
    </div>
  );
}
