"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { FaCog, FaSignOutAlt, FaShare, FaUser, FaMusic, FaHeadphones, FaStar } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import NotificationBell from './NotificationBell';
import AvatarImage from './AvatarImage';

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
      // Redirect to logout page which will handle the redirect to home
      window.location.href = '/auth/logout';
    } catch (error) {
      console.error('Logout error:', error);
      // Still redirect even if logout fails
      window.location.href = '/auth/logout';
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
            {user ? (
              <button
                type="button"
                aria-label="Premium"
                onClick={() => router.push('/premium')}
                className="rounded-full bg-purple-500 p-2.5 text-white shadow-lg shadow-purple-500/20 transition hover:bg-purple-400"
              >
                <FaStar className="h-4 w-4" />
              </button>
            ) : (
              <button className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/15">
                Get App
              </button>
            )}

            {/* Notifications Bell */}
            <NotificationBell />

            {/* User Avatar with Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-white/20 hover:border-white/40 transition-colors"
              >
                <AvatarImage src={user?.avatarUrl} alt={user?.displayName || user?.username || 'User'} fill className="object-cover" />
              </button>

              {/* User Menu Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-black/95 backdrop-blur-lg border border-white/10 rounded-xl shadow-xl z-50">
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden">
                        <AvatarImage src={user?.avatarUrl} alt={user?.displayName || user?.username || 'User'} width={40} height={40} className="h-full w-full object-cover" />
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