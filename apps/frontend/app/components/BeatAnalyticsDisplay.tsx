'use client';

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Heart, MessageCircle, Download, Play } from 'lucide-react';

interface BeatAnalyticsData {
  beat: {
    id: number;
    title: string;
    genre: string;
    accessType: string;
    createdAt: string;
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

interface ProducerStats {
  totalBeats: number;
  totalPlays: number;
  monthlyPlays: number;
  totalDownloads: number;
  monthlyDownloads: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalSales: number;
  monthlySales: number;
  followerCount: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function BeatAnalyticsDisplay({ beatId }: { beatId?: number }) {
  const [analytics, setAnalytics] = useState<BeatAnalyticsData | null>(null);
  const [producerStats, setProducerStats] = useState<ProducerStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month');

  useEffect(() => {
    if (beatId) {
      fetchBeatAnalytics();
    } else {
      fetchProducerStats();
    }
  }, [beatId]);

  const fetchBeatAnalytics = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/v1/beats/${beatId}/analytics`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProducerStats = async () => {
    try {
      setIsLoading(true);
      // Note: This endpoint needs to be created or modified to get authenticated user's stats
      const response = await fetch(`/api/v1/beats/producer/me/stats`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setProducerStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="inline-block animate-spin">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full" />
        </div>
      </div>
    );
  }

  if (analytics) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{analytics.beat.title}</h1>
          <p className="text-gray-600 mt-2">{analytics.beat.genre} • {new Date(analytics.beat.createdAt).toLocaleDateString()}</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Plays</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{analytics.analytics.playCount.toLocaleString()}</p>
              </div>
              <Play className="text-blue-400" size={32} />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Downloads</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{analytics.analytics.downloadCount.toLocaleString()}</p>
              </div>
              <Download className="text-green-400" size={32} />
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Likes</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{analytics.analytics.likeCount.toLocaleString()}</p>
              </div>
              <Heart className="text-red-400" size={32} />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Comments</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">{analytics.analytics.commentCount.toLocaleString()}</p>
              </div>
              <MessageCircle className="text-purple-400" size={32} />
            </div>
          </div>
        </div>

        {/* Engagement Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Engagement Rate</p>
                <p className="text-3xl font-bold text-indigo-600 mt-2">{analytics.analytics.engagementRate.toFixed(2)}%</p>
              </div>
              <TrendingUp className="text-indigo-400" size={32} />
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Avg Rating</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">★ {analytics.analytics.averageRating.toFixed(1)}</p>
              </div>
              <div className="text-yellow-400" style={{ fontSize: '32px' }}>⭐</div>
            </div>
          </div>
        </div>

        {/* Revenue Section */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-8 rounded-lg mb-8">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-green-100 text-sm mb-2">Estimated Revenue</p>
              <p className="text-4xl font-bold">${analytics.monetization.estimatedRevenue}</p>
            </div>
            <div>
              <p className="text-green-100 text-sm mb-2">Beat Price</p>
              <p className="text-4xl font-bold">${analytics.monetization.price.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Engagement Breakdown */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Engagement Breakdown</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Plays', value: analytics.analytics.playCount },
                  { name: 'Downloads', value: analytics.analytics.downloadCount },
                  { name: 'Likes', value: analytics.analytics.likeCount },
                  { name: 'Comments', value: analytics.analytics.commentCount },
                  { name: 'Shares', value: analytics.analytics.shareCount },
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {COLORS.map((color, index) => (
                  <Cell key={`cell-${index}`} fill={color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Followers Card */}
        <div className="mt-8 bg-gradient-to-br from-cyan-50 to-cyan-100 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Your Followers</p>
              <p className="text-3xl font-bold text-cyan-600 mt-2">{analytics.analytics.followerCount.toLocaleString()}</p>
            </div>
            <Users className="text-cyan-400" size={32} />
          </div>
        </div>
      </div>
    );
  }

  if (producerStats) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Dashboard</h1>

        {/* Time Range Selector */}
        <div className="flex gap-2 mb-8">
          {(['week', 'month', 'quarter'] as const).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
            <p className="text-xs text-gray-600 font-medium">Total Beats</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{producerStats.totalBeats}</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
            <p className="text-xs text-gray-600 font-medium">Total Plays</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{producerStats.totalPlays.toLocaleString()}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
            <p className="text-xs text-gray-600 font-medium">Monthly Plays</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">{producerStats.monthlyPlays.toLocaleString()}</p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg">
            <p className="text-xs text-gray-600 font-medium">Total Downloads</p>
            <p className="text-2xl font-bold text-orange-600 mt-1">{producerStats.totalDownloads.toLocaleString()}</p>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg">
            <p className="text-xs text-gray-600 font-medium">Followers</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{producerStats.followerCount.toLocaleString()}</p>
          </div>
        </div>

        {/* Revenue Section */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg">
            <p className="text-green-100 text-sm mb-2">Total Revenue</p>
            <p className="text-3xl font-bold">${producerStats.totalRevenue.toFixed(2)}</p>
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg">
            <p className="text-blue-100 text-sm mb-2">Monthly Revenue</p>
            <p className="text-3xl font-bold">${producerStats.monthlyRevenue.toFixed(2)}</p>
          </div>
        </div>

        {/* Sales Stats */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="font-bold text-gray-900 mb-4">Total Sales</h3>
            <p className="text-4xl font-bold text-blue-600">{producerStats.totalSales}</p>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="font-bold text-gray-900 mb-4">Monthly Sales</h3>
            <p className="text-4xl font-bold text-green-600">{producerStats.monthlySales}</p>
          </div>
        </div>

        {/* Charts */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Activity Overview</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[
              { name: 'Plays', value: producerStats.monthlyPlays },
              { name: 'Downloads', value: producerStats.monthlyDownloads },
              { name: 'Sales', value: producerStats.monthlySales },
            ]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  return null;
}
