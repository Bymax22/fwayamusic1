"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import {
  Headphones,
  Heart,
  User,
  Edit3,
  Settings,
  MapPin,
  Link as LinkIcon,
  Calendar,
  Mail,
  Download,
} from 'lucide-react';

type ActivityType = 'played' | 'liked' | 'created';

interface RecentActivity {
  id: number;
  type: ActivityType;
  title: string;
  artist?: string;
  timestamp: string;
}

interface UserProfile {
  id: number;
  username: string;
  displayName: string;
  email: string;
  avatar: string;
  coverImage: string;
  bio: string;
  location: string;
  website: string;
  joinDate: string;
  stats: {
    tracksPlayed: number;
    likedSongs: number;
    playlists: number;
    followers: number;
    following: number;
  };
  recentActivity: RecentActivity[];
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    id: 0,
    username: '',
    displayName: '',
    email: '',
    avatar: '/default-avatar.jpg',
    coverImage: '/covers/banner1.jpg',
    bio: '',
    location: '',
    website: '',
    joinDate: new Date().toISOString(),
    stats: {
      tracksPlayed: 0,
      likedSongs: 0,
      playlists: 0,
      followers: 0,
      following: 0,
    },
    recentActivity: [],
  });

  // Redirect unauthenticated users and populate profile when user available
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
      return;
    }

    if (user) {
      const backend = user as unknown as Record<string, unknown>;

      const safeString = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback);
      const safeNumber = (v: unknown, fallback = 0): number => (typeof v === 'number' ? v : fallback);

      setProfile((prev) => ({
        ...prev,
        id: safeNumber(backend.id, prev.id),
        username: safeString(backend.username, safeString(backend.email).split('@')[0] || prev.username),
        displayName: safeString(backend.displayName, safeString(backend.username, safeString(backend.email, prev.displayName))),
        email: safeString(backend.email, prev.email),
        avatar: safeString(backend.avatarUrl, prev.avatar),
        bio: safeString(backend.bio, prev.bio),
        location: safeString(backend.country ?? backend.location, prev.location),
        website: safeString(backend.website, prev.website),
        joinDate: safeString(backend.createdAt, prev.joinDate),
        stats: {
          tracksPlayed: safeNumber(backend.tracksPlayed, prev.stats.tracksPlayed),
          likedSongs: safeNumber(backend.likedSongs, prev.stats.likedSongs),
          playlists: safeNumber(backend.playlists, prev.stats.playlists),
          followers: safeNumber(backend.followers, prev.stats.followers),
          following: safeNumber(backend.following, prev.stats.following),
        },
        recentActivity: Array.isArray(backend.recentActivity) ? (backend.recentActivity as RecentActivity[]) : prev.recentActivity,
      }));
    }
  }, [user, loading, router]);

  const [editForm, setEditForm] = useState({
    displayName: '',
    bio: '',
    location: '',
    website: '',
  });

  useEffect(() => {
    setEditForm({
      displayName: profile.displayName,
      bio: profile.bio,
      location: profile.location,
      website: profile.website,
    });
  }, [profile]);

  const handleSaveProfile = () => {
    setProfile((prev) => ({ ...prev, ...editForm }));
    setIsEditing(false);
  };

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'played':
        return <Headphones className="w-4 h-4" />;
      case 'liked':
        return <Heart className="w-4 h-4" />;
      case 'created':
        return <User className="w-4 h-4" />;
      default:
        return <Headphones className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type: ActivityType) => {
    switch (type) {
      case 'played':
        return 'text-blue-400';
      case 'liked':
        return 'text-red-400';
      case 'created':
        return 'text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="max-w-6xl mx-auto bg-gradient-to-br from-[#0a3747]/95 to-[#0a1f29]/95 min-h-screen pb-32">
      {/* Cover Image */}
      <div className="relative h-64 bg-gradient-to-r from-[#e51f48] to-[#ff4d6d]">
        <div className="absolute inset-0 bg-black/20" />
        {isEditing && (
          <button className="absolute top-4 right-4 px-4 py-2 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-colors">
            Change Cover
          </button>
        )}
      </div>

      {/* Profile Content */}
      <div className="px-6 -mt-16 relative z-10">
        {/* Profile Header */}
        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-end mb-8">
          {/* Avatar */}
          <div className="relative">
            <Image
              src={profile.avatar}
              alt={profile.displayName}
              width={128}
              height={128}
              className="w-32 h-32 rounded-full border-4 border-[#0a3747] object-cover"
              onError={() => {
                setProfile((prev) => ({ ...prev, avatar: '/default-avatar.jpg' }));
              }}
            />
            {isEditing && (
              <button className="absolute bottom-2 right-2 w-8 h-8 bg-[#e51f48] rounded-full flex items-center justify-center text-white">
                <Edit3 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Profile Info */}
          <div className="flex-1 text-white">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4">
              <div>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.displayName}
                    onChange={(e) => setEditForm((p) => ({ ...p, displayName: e.target.value }))}
                    className="text-3xl font-bold bg-transparent border-b border-gray-600 focus:outline-none focus:border-[#e51f48]"
                  />
                ) : (
                  <h1 className="text-3xl font-bold">{profile.displayName}</h1>
                )}
                <p className="text-gray-400">@{profile.username}</p>
              </div>

              <div className="flex gap-2 mt-4 lg:mt-0">
                {!isEditing ? (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-[#0a3747] hover:bg-[#0a3747]/80 text-white rounded-xl transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit Profile
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-[#0a3747] hover:bg-[#0a3747]/80 text-white rounded-xl transition-colors">
                      <Settings className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={handleSaveProfile} className="px-4 py-2 bg-[#e51f48] hover:bg-[#ff4d6d] text-white rounded-xl transition-colors">
                      Save
                    </button>
                    <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-[#0a3747] hover:bg-[#0a3747]/80 text-white rounded-xl transition-colors">
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Bio and Details */}
            <div className="space-y-2 mb-4">
              {isEditing ? (
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm((p) => ({ ...p, bio: e.target.value }))}
                  className="w-full bg-transparent border border-gray-600 rounded-lg p-2 focus:outline-none focus:border-[#e51f48] resize-none"
                  rows={3}
                />
              ) : (
                <p className="text-gray-300">{profile.bio}</p>
              )}

              <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.location}
                      onChange={(e) => setEditForm((p) => ({ ...p, location: e.target.value }))}
                      className="bg-transparent border-b border-gray-600 focus:outline-none focus:border-[#e51f48]"
                    />
                  ) : (
                    <span>{profile.location}</span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <LinkIcon className="w-4 h-4" />
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.website}
                      onChange={(e) => setEditForm((p) => ({ ...p, website: e.target.value }))}
                      className="bg-transparent border-b border-gray-600 focus:outline-none focus:border-[#e51f48]"
                    />
                  ) : (
                    <a href={profile.website ? `https://${profile.website}` : '#'} className="hover:text-[#e51f48] transition-colors">
                      {profile.website || '—'}
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {new Date(profile.joinDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-6">
              {Object.entries(profile.stats).map(([key, value]) => (
                <div key={key} className="text-center">
                  <div className="text-white font-bold text-lg">{(value as number).toLocaleString()}</div>
                  <div className="text-gray-400 text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content Tabs and Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-white mb-6">Recent Activity</h2>

            <div className="bg-[#0a3747]/70 rounded-xl p-6">
              {profile.recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {profile.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center gap-4 p-3 bg-[#0a3747] rounded-lg">
                      <div className={`p-2 rounded-lg ${getActivityColor(activity.type)} bg-opacity-20`}>
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1">
                        <p className="text-white">
                          {activity.type === 'played' && `Played "${activity.title}"`}
                          {activity.type === 'liked' && `Liked "${activity.title}"`}
                          {activity.type === 'created' && `Created "${activity.title}"`}
                        </p>
                        {activity.artist && <p className="text-gray-400 text-sm">{activity.artist}</p>}
                        <p className="text-gray-500 text-xs">{new Date(activity.timestamp).toLocaleDateString()} • {new Date(activity.timestamp).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Headphones className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No recent activity</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-[#0a3747]/70 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Listening Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Listening Time</span>
                  <span className="text-white font-medium">124 hours</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Top Genre</span>
                  <span className="text-white font-medium">Afrobeats</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Most Played Track</span>
                  <span className="text-white font-medium">CEO Wandi</span>
                </div>
              </div>
            </div>

            {/* Account Details */}
            <div className="bg-[#0a3747]/70 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Account Details</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300">{profile.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300">Premium Member</span>
                </div>
                <div className="flex items-center gap-3">
                  <Download className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300">45 Downloads</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}