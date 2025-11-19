"use client";
/* eslint-disable */
import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Home, Search, Library, User, Music, Heart, Plus, Download, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

// Custom icon wrapper with red color
const Icon = ({ children }: { children: React.ReactNode }) => (
  <span className="text-[#e51f48]">{children}</span>
);

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  // Only close menu if pathname changes after menu is already open
  const prevPathnameRef = useRef(pathname);
  useEffect(() => {
    if (isOpen && prevPathnameRef.current !== pathname) {
      onClose();
    }
    prevPathnameRef.current = pathname;
  }, [pathname, isOpen, onClose]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Main navigation items
  const mainMenuItems = [
    { title: "Home", icon: <Icon><Home size={20} /></Icon>, href: "/" },
    { title: "Search", icon: <Icon><Search size={20} /></Icon>, href: "/search" },
    { title: "Explore", icon: <Icon><Music size={20} /></Icon>, href: "/explore" },
    { title: "Library", icon: <Icon><Library size={20} /></Icon>, href: "/library" },
  ];

  // Music control items
  const musicMenuItems = [
    { title: "Create Playlist", icon: <Icon><Plus size={20} /></Icon>, href: "/create-playlist" },
    { title: "Liked Songs", icon: <Icon><Heart size={20} /></Icon>, href: "/liked-songs" },
    { title: "Recently Played", icon: <Icon><Music size={20} /></Icon>, href: "/recently-played" },
    { title: "Downloads", icon: <Icon><Download size={20} /></Icon>, href: "/download" },
  ];

  // Discover sections
  const discoverMenuItems = [
    { title: "Top Charts", icon: <Icon><Music size={20} /></Icon>, href: "/top-charts" },
    { title: "New Releases", icon: <Icon><Music size={20} /></Icon>, href: "/new-releases" },
    { title: "Popular", icon: <Icon><Heart size={20} /></Icon>, href: "/popular" },
    { title: "Artists", icon: <Icon><User size={20} /></Icon>, href: "/artists" },
  ];

  // Settings items
  const settingsMenuItems = [
    { title: "Profile", icon: <Icon><User size={20} /></Icon>, href: "/profile" },
    { title: "Settings", icon: <Icon><Settings size={20} /></Icon>, href: "/settings" },
  ];

  const MenuSection = ({ title, items }: { title: string; items: { title: string; icon: React.ReactNode; href: string }[] }) => (
    <div className="space-y-1">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-2">
        {title}
      </h3>
      {items.map((item) => (
        <Link
          key={item.title}
          href={item.href}
          className="flex items-center px-4 py-3 rounded-lg text-white hover:bg-white/10 transition-all duration-200 group"
          onClick={onClose}
        >
          <span className="flex-shrink-0 group-hover:scale-110 transition-transform">
            {item.icon}
          </span>
          <span className="ml-3 text-sm font-medium">{item.title}</span>
        </Link>
      ))}
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          
          {/* Menu Panel */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ 
              type: "spring", 
              damping: 25, 
              stiffness: 200 
            }}
            className="fixed bottom-0 left-0 right-0 h-[85vh] bg-gradient-to-b from-[#0a3747]/95 to-[#0a1f29]/95 backdrop-blur-2xl border-t border-white/10 rounded-t-3xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#e51f48] to-[#ff4d6d] flex items-center justify-center">
                  <Music className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Fwaya Music</h2>
                  <p className="text-sm text-gray-400">Main Menu</p>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200 touch-target"
                aria-label="Close menu"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* User Info */}
            {user && (
              <div className="px-6 py-4 border-b border-white/10">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#e51f48] to-[#ff4d6d] flex items-center justify-center text-white text-sm font-bold">
                    {user.displayName?.charAt(0) || user.username?.charAt(0) || "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {user.displayName || user.username}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Scrollable Content */}
            <div className="h-[calc(100%-140px)] overflow-y-auto pb-6">
              <div className="space-y-6 py-4">
                <MenuSection title="Navigation" items={mainMenuItems} />
                <MenuSection title="Your Library" items={musicMenuItems} />
                <MenuSection title="Discover" items={discoverMenuItems} />
                <MenuSection title="Account" items={settingsMenuItems} />
              </div>

              {/* Now Playing Preview */}
              <div className="mx-4 mt-6 p-4 rounded-2xl bg-gradient-to-r from-[#e51f48]/20 to-[#ff4d6d]/20 backdrop-blur-sm border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#e51f48] to-[#ff4d6d] flex items-center justify-center">
                      <Music className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Now Playing</p>
                      <p className="text-xs text-gray-300">Tap to open player</p>
                    </div>
                  </div>
                  <div className="w-2 h-8 bg-gradient-to-b from-[#e51f48] to-[#ff4d6d] rounded-full animate-pulse"></div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 mt-8">
                <div className="text-center">
                  <p className="text-xs text-gray-500">
                    Fwaya Music v1.0 • Made with ♥
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}