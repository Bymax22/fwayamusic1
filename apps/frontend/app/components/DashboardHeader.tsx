"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { FaBell, FaCog, FaSignOutAlt, FaShare, FaUser, FaMusic, FaHeadphones } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface DashboardHeaderProps {
  showLogo?: boolean;
  logoText?: string;
}

export default function DashboardHeader({ showLogo = true, logoText = "Fwaya" }: DashboardHeaderProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Fwaya',
          text: 'Check out Fwaya - Your ultimate music streaming platform!',
          url: window.location.origin,
        });
      } catch (error) {
        console.log('Share cancelled or failed');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.origin);
      alert('Link copied to clipboard!');
    }
    setShowUserMenu(false);
  };

  const userMenuItems = [
    {
      icon: <FaUser className="w-4 h-4" />,
      label: 'Profile',
      action: () => {
        router.push('/profile');
        setShowUserMenu(false);
      }
    },
    {
      icon: <FaCog className="w-4 h-4" />,
      label: 'Settings',
      action: () => {
        router.push('/settings');
        setShowUserMenu(false);
      }
    },
    {
      icon: <FaShare className="w-4 h-4" />,
      label: 'Share App',
      action: handleShare
    },
    {
      icon: <FaSignOutAlt className="w-4 h-4" />,
      label: 'Logout',
      action: () => {
        handleLogout();
        setShowUserMenu(false);
      }
    }
  ];

  return (
    <header className="bg-black/95 backdrop-blur-lg border-b border-white/10 sticky top-0 z-50 lg:hidden">
      <div className="px-5 py-4">
        <div className="flex items-center justify-between">
          {/* Logo/Brand */}
          <div className="flex items-center gap-2 text-white text-2xl font-semibold">
            {showLogo && (
              <img src="/fwayalogo-01.png" alt="Fwaya" className="h-10 w-auto object-contain opacity-100" />
            )}
            <span className="text-xl font-semibold text-white">{logoText}</span>
          </div>

          {/* Right side buttons */}
          <div className="flex items-center gap-3">
            {/* Get App Button */}
            <button className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/15">
              Get App
            </button>

            {/* Notifications Bell */}
            <button className="relative p-2 text-white/80 hover:text-white transition-colors">
              <FaBell className="w-5 h-5" />
              {/* Notification dot - can be made dynamic */}
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* User Avatar with Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-white/20 hover:border-white/40 transition-colors"
              >
                {user?.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt={user.displayName || user.username || 'User'}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/default-avatar.png';
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {(user?.displayName || user?.username || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </button>

              {/* User Menu Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-black/95 backdrop-blur-lg border border-white/10 rounded-xl shadow-xl z-50">
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden">
                        {user?.avatarUrl ? (
                          <Image
                            src={user.avatarUrl}
                            alt={user.displayName || user.username || 'User'}
                            width={40}
                            height={40}
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <span className="text-white font-semibold">
                              {(user?.displayName || user?.username || 'U').charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-white font-medium truncate">
                          {user?.displayName || user?.username}
                        </p>
                        <p className="text-white/60 text-sm capitalize">
                          {user?.role?.toLowerCase()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    {userMenuItems.map((item, index) => (
                      <button
                        key={index}
                        onClick={item.action}
                        className="w-full px-4 py-3 text-left text-white/80 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-3"
                      >
                        {item.icon}
                        <span className="text-sm">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Backdrop for mobile menu */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </header>
  );
}