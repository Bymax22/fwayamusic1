"use client";
import { useState } from 'react';
import { Save, Upload, X,  Image as ImageIcon } from 'lucide-react';
import Image from "next/image";

export default function CreatePlaylistPage() {
  const [playlistData, setPlaylistData] = useState({
    name: '',
    description: '',
    isPublic: true,
    coverImage: null as File | null,
    coverPreview: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPlaylistData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Here you would typically send the data to your backend
    console.log('Creating playlist:', playlistData);
    
    // Mock success
    alert('Playlist created successfully!');
    
    // Reset form
    setPlaylistData({
      name: '',
      description: '',
      isPublic: true,
      coverImage: null,
      coverPreview: ''
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-gradient-to-br from-[#0a3747]/95 to-[#0a1f29]/95 min-h-screen pb-32">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Create Playlist</h1>
        <p className="text-gray-400">Build your perfect music collection</p>
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
                className="w-full px-4 py-3 bg-[#0a3747] border border-[#0a3747] text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e51f48] focus:border-transparent placeholder-gray-400"
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
                className="w-full px-4 py-3 bg-[#0a3747] border border-[#0a3747] text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e51f48] focus:border-transparent placeholder-gray-400 resize-none"
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
                    className="text-[#e51f48] focus:ring-[#e51f48]"
                  />
                  <span className="text-white">Public</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="isPublic"
                    checked={!playlistData.isPublic}
                    onChange={() => setPlaylistData(prev => ({ ...prev, isPublic: false }))}
                    className="text-[#e51f48] focus:ring-[#e51f48]"
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
            className="flex items-center gap-2 px-6 py-3 bg-[#e51f48] hover:bg-[#ff4d6d] text-white rounded-xl transition-colors font-medium"
          >
            <Save className="w-5 h-5" />
            Create Playlist
          </button>
        </div>
      </form>
    </div>
  );
}