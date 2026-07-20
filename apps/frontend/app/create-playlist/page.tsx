"use client";
import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Save, Upload, X, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';

export default function CreatePlaylistPage() {
  const { getToken } = useAuth();
  const [playlistData, setPlaylistData] = useState({
    name: '',
    description: '',
    isPublic: true,
    coverImage: null as File | null,
    coverPreview: ''
  });

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPlaylistData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCoverChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPlaylistData(prev => ({
        ...prev,
        coverImage: file,
        coverPreview: URL.createObjectURL(file)
      }));
    }
  };

  const handleRemoveCover = () => {
    setPlaylistData(prev => ({
      ...prev,
      coverImage: null,
      coverPreview: ''
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const token = await getToken();
    if (!token) {
      alert('Please sign in to create a playlist.');
      return;
    }

    try {
      const response = await fetch('/api/playlists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: playlistData.name,
          description: playlistData.description,
          isPublic: playlistData.isPublic,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to create playlist' }));
        throw new Error(error.message || 'Failed to create playlist');
      }

      const data = await response.json();
      alert('Playlist created successfully!');

      // Broadcast update for other tabs/components to refresh library
      try {
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          const bc = new BroadcastChannel('fwaya');
          bc.postMessage({ type: 'playlists-updated', playlist: data });
          bc.close();
        } else {
          localStorage.setItem('fwaya:message', JSON.stringify({ type: 'playlists-updated', playlist: data, t: Date.now() }));
        }
      } catch (e) {
        // ignore
      }
      setPlaylistData({
        name: '',
        description: '',
        isPublic: true,
        coverImage: null,
        coverPreview: ''
      });
    } catch (err) {
      console.error('Create playlist error:', err);
      alert('Unable to create playlist. Please try again.');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-gradient-to-br from-[#090b14]/95 via-[#120a28]/80 to-[#160930]/95 min-h-screen pb-32">
      <div className="mb-8 rounded-3xl border border-purple-700/40 bg-[#090b14]/80 p-8 shadow-2xl shadow-purple-900/20">
        <div className="flex flex-col gap-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-purple-500/10 px-4 py-2 text-sm uppercase tracking-[0.24em] text-purple-300">
            Create Playlist
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-white">Build your playlist, your way</h1>
          <p className="max-w-2xl text-sm text-slate-400">
            Use the same library style as your music experience. Create a playlist, give it a cover, and share it with fans.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Cover Image Upload */}
        <div className="bg-[#0a3747]/70 rounded-xl p-6">
          <h2 className="text-lg font-medium text-white mb-4">Cover Image</h2>
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Cover Preview */}
            <div className="flex-shrink-0">
              {playlistData.coverPreview ? (
                <div className="relative">
                  <Image
                    src={playlistData.coverPreview}
                    alt="Cover preview"
                    className="w-48 h-48 rounded-xl object-cover shadow-lg"
                    width={192}
                    height={192}
                  />
                  <button
                    type="button"
                    onClick={handleRemoveCover}
                    className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <div className="w-48 h-48 bg-[#0a3747] border-2 border-dashed border-gray-600 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-gray-500 transition-colors">
                  <ImageIcon className="w-12 h-12 mb-2" />
                  <span className="text-sm">No cover</span>
                </div>
              )}
            </div>

            {/* Upload Controls */}
            <div className="flex-1">
              <p className="text-gray-400 mb-4">
                Upload a cover image for your playlist. Recommended size: 1000x1000 pixels.
              </p>
              <label className="flex items-center gap-2 px-4 py-2 bg-[#e51f48] hover:bg-[#ff4d6d] text-white rounded-lg transition-colors cursor-pointer w-fit">
                <Upload className="w-4 h-4" />
                Choose Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Playlist Details */}
        <div className="bg-[#0a3747]/70 rounded-xl p-6">
          <h2 className="text-lg font-medium text-white mb-4">Playlist Details</h2>
          
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Playlist Name *
              </label>
              <input
                type="text"
                name="name"
                value={playlistData.name}
                onChange={handleInputChange}
                placeholder="My Awesome Playlist"
                className="w-full px-4 py-3 bg-[#0f1320] border border-purple-700/40 text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={playlistData.description}
                onChange={handleInputChange}
                placeholder="Describe your playlist..."
                rows={4}
                className="w-full px-4 py-3 bg-[#0f1320] border border-purple-700/40 text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400 resize-none"
              />
            </div>

            {/* Privacy */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Privacy
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="isPublic"
                    checked={playlistData.isPublic}
                    onChange={() => setPlaylistData(prev => ({ ...prev, isPublic: true }))}
                    className="text-purple-500 focus:ring-purple-500"
                  />
                  <span className="text-white">Public</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="isPublic"
                    checked={!playlistData.isPublic}
                    onChange={() => setPlaylistData(prev => ({ ...prev, isPublic: false }))}
                    className="text-purple-500 focus:ring-purple-500"
                  />
                  <span className="text-white">Private</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-full transition-colors font-medium shadow-lg shadow-purple-500/20"
          >
            <Save className="w-5 h-5" />
            Create Playlist
          </button>
        </div>
      </form>
    </div>
  );
}




