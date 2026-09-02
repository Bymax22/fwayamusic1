'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Play, Download, Heart, MessageCircle, Trash2, Edit, Lock, Unlock } from 'lucide-react';
import CoverArtImage from './CoverArtImage';

interface Beat {
  id: number;
  title: string;
  genre: string;
  bpm: number;
  artCoverUrl: string;
  playCount: number;
  downloadCount: number;
  shareCount: number;
  price: number;
  accessType: 'FREE' | 'PREMIUM' | 'PAY_PER_VIEW';
  createdAt: string;
  user: {
    id: number;
    username: string;
    displayName: string;
  };
}

export default function ProducerBeatsGrid() {
  const [beats, setBeats] = useState<Beat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalBeats, setTotalBeats] = useState(0);

  const beatsPerPage = 12;

  useEffect(() => {
    fetchBeats();
  }, [page]);

  const fetchBeats = async () => {
    try {
      setIsLoading(true);
      const skip = page * beatsPerPage;
      const response = await fetch(
        `/api/v1/beats/producer/me/beats?skip=${skip}&take=${beatsPerPage}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      if (!response.ok) throw new Error('Failed to fetch beats');
      const data = await response.json();
      setBeats(data);
      // Assume total is sent in response or calculate from API
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load beats');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBeat = async (beatId: number) => {
    if (!window.confirm('Delete this beat?')) return;

    try {
      const response = await fetch(`/api/v1/beats/${beatId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      if (!response.ok) throw new Error('Failed to delete');
      setBeats(beats.filter(b => b.id !== beatId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete beat');
    }
  };

  const handleToggleAccess = async (beatId: number, currentAccess: string) => {
    const newAccess = currentAccess === 'FREE' ? 'PREMIUM' : 'FREE';

    try {
      const response = await fetch(`/api/v1/beats/${beatId}/access-type`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ accessType: newAccess }),
      });

      if (!response.ok) throw new Error('Failed to update');
      
      const result = await response.json();
      setBeats(beats.map(b => b.id === beatId ? result.beat : b));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update access');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Beats</h1>
          <Link
            href="/dashboard/beats/upload"
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium transition"
          >
            + Upload New Beat
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {isLoading && !beats.length ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full" />
            </div>
            <p className="mt-4 text-gray-600">Loading your beats...</p>
          </div>
        ) : beats.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No beats yet. Start by uploading one!</p>
          </div>
        ) : (
          <>
            {/* Beats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {beats.map((beat) => (
                <div
                  key={beat.id}
                  className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition group"
                >
                  {/* Cover Image */}
                  <div className="relative aspect-square bg-gray-200 overflow-hidden">
                    <CoverArtImage
                      src={beat.artCoverUrl || '/placeholder-beat.png'}
                      alt={beat.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-3">
                      <Link
                        href={`/beats/${beat.id}`}
                        className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition"
                        title="View"
                      >
                        <Play size={20} />
                      </Link>
                      <Link
                        href={`/dashboard/beats/${beat.id}/edit`}
                        className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-full transition"
                        title="Edit"
                      >
                        <Edit size={20} />
                      </Link>
                    </div>
                    <div className="absolute top-2 right-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold ${
                          beat.accessType === 'FREE'
                            ? 'bg-green-500 text-white'
                            : 'bg-purple-500 text-white'
                        }`}
                      >
                        {beat.accessType}
                      </span>
                    </div>
                  </div>

                  {/* Beat Info */}
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 truncate">{beat.title}</h3>
                    <p className="text-sm text-gray-600 mb-3">{beat.genre}</p>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Play size={14} /> {beat.playCount}
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Download size={14} /> {beat.downloadCount}
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Heart size={14} /> {beat.shareCount}
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        {beat.bpm} BPM
                      </div>
                    </div>

                    {beat.price > 0 && (
                      <div className="mb-3 p-2 bg-blue-50 rounded text-center">
                        <p className="text-sm font-bold text-blue-600">${beat.price.toFixed(2)}</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleAccess(beat.id, beat.accessType)}
                        className="flex-1 flex items-center justify-center gap-1 p-2 text-xs bg-gray-100 hover:bg-gray-200 rounded transition"
                        title={beat.accessType === 'FREE' ? 'Make Premium' : 'Make Free'}
                      >
                        {beat.accessType === 'FREE' ? (
                          <Unlock size={14} />
                        ) : (
                          <Lock size={14} />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteBeat(beat.id)}
                        className="flex-1 flex items-center justify-center gap-1 p-2 text-xs bg-red-100 hover:bg-red-200 text-red-600 rounded transition"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {beats.length >= beatsPerPage && (
              <div className="flex justify-center items-center gap-4 mt-8">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded transition"
                >
                  Previous
                </button>
                <span className="text-gray-600 font-medium">Page {page + 1}</span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={beats.length < beatsPerPage}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded transition"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
