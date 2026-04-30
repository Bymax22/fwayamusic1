"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Home, Search, Library, User, Music, Heart, Plus, Download, Settings, LogIn, UserPlus, Compass, Bell, Moon, Sun, ChevronRight, Crown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

// Custom icon wrapper with purple color
const Icon = ({ children }: { children: React.ReactNode }) => (
  <span className="text-purple-400">{children}</span>
);

// Removed floating particle component - using clean design instead

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [activeMenuTab, setActiveMenuTab] = useState("menu");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [authModalMode, setAuthModalMode] = useState<"signin" | "signup" | null>(null);

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

  // Main navigation items with enhanced styling
  const mainMenuItems = [
    { title: "Home", icon: <Icon><Home size={20} /></Icon>, href: "/", description: "Your music dashboard" },
    { title: "Search", icon: <Icon><Search size={20} /></Icon>, href: "/search", description: "Find your favorite songs" },
    { title: "Explore", icon: <Icon><Music size={20} /></Icon>, href: "/explore", description: "Discover new music" },
    { title: "Library", icon: <Icon><Library size={20} /></Icon>, href: "/library", description: "Your personal collection" },
  ];

  // Music control items
  const musicMenuItems = [
    { title: "Create Playlist", icon: <Icon><Plus size={20} /></Icon>, href: "/create-playlist", description: "Make your own playlist" },
    { title: "Liked Songs", icon: <Icon><Heart size={20} /></Icon>, href: "/liked-songs", description: "Songs you love" },
    { title: "Recently Played", icon: <Icon><Music size={20} /></Icon>, href: "/recently-played", description: "Your listening history" },
    { title: "Downloads", icon: <Icon><Download size={20} /></Icon>, href: "/download", description: "Offline music" },
  ];

  // Discover sections
  const discoverMenuItems = [
    { title: "Top Charts", icon: <Icon><Music size={20} /></Icon>, href: "/top-charts", description: "What's trending" },
    { title: "New Releases", icon: <Icon><Music size={20} /></Icon>, href: "/new-releases", description: "Latest music" },
    { title: "Popular", icon: <Icon><Heart size={20} /></Icon>, href: "/popular", description: "Most loved" },
    { title: "Artists", icon: <Icon><User size={20} /></Icon>, href: "/artists", description: "Featured artists" },
  ];

  // Settings items
  const settingsMenuItems = [
    { title: "Profile", icon: <Icon><User size={20} /></Icon>, href: "/profile", description: "Manage your account" },
    { title: "Settings", icon: <Icon><Settings size={20} /></Icon>, href: "/settings", description: "App preferences" },
  ];

  // Auth items (shown when not logged in)
  const authMenuItems = [
    { title: "Login", icon: <Icon><LogIn size={20} /></Icon>, href: "/auth/signin", description: "Sign in to your account" },
    { title: "Create Account", icon: <Icon><UserPlus size={20} /></Icon>, href: "/auth/signup", description: "Join Fwaya Music" },
    { title: "Artist Login", icon: <Icon><LogIn size={20} /></Icon>, href: "/auth/artist/signin", description: "Sign in as an artist" },
    { title: "Create Artist Account", icon: <Icon><UserPlus size={20} /></Icon>, href: "/auth/artist/signup", description: "Sign up as an artist" },
  ];

  // Menu tabs with enhanced icons
  const menuTabs = [
    { id: "menu", label: "Menu", icon: Home },
    { id: "library", label: "Library", icon: Library },
    { id: "discover", label: "Discover", icon: Compass },
    { id: "account", label: "Account", icon: User },
  ];

  const authOptions = [
    {
      title: "Music Lover",
      subtitle: "User account",
      description: "Stream music, create playlists, and follow artists.",
      signinHref: "/auth/user/signin",
      signupHref: "/auth/user/signup",
    },
    {
      title: "Artist",
      subtitle: "Artist account",
      description: "Upload music, manage your profile, and access artist tools.",
      signinHref: "/auth/artist/signin",
      signupHref: "/auth/artist/signup",
    },
    {
      title: "Reseller",
      subtitle: "Reseller account",
      description: "Sell music, earn commissions, and manage customers.",
      signinHref: "/auth/reseller/signin",
      signupHref: "/auth/reseller/signup",
    },
  ];

  const MenuSection = ({ title, items }: { title: string; items: { title: string; icon: ReactNode; href: string; description: string }[] }) => (
    <div className="space-y-3">
      <h3 className="text-xs font-bold text-purple-300 uppercase tracking-wider px-4 py-2 border-l-2 border-purple-500 bg-white/5 rounded-r-2xl">
        {title}
      </h3>
      {items.map((item, index) => (
        <motion.div
          key={item.title}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Link
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-3xl text-white transition-all duration-300 group mx-2 border border-white/10 hover:border-purple-500/30 shadow-sm shadow-purple-500/10 ${isDarkMode ? 'bg-[#090b14]/90 hover:bg-[#121827]' : 'bg-[#12131f]/90 hover:bg-[#1c1d29]'}`}
            onClick={onClose}
          >
            <span className="flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
              {item.icon}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{item.title}</p>
              <p className="text-xs text-gray-400 truncate">{item.description}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-purple-300 group-hover:text-white transition-colors" />
          </Link>
        </motion.div>
      ))}
    </div>
  );

  const getActiveItems = () => {
    if (activeMenuTab === "menu") return mainMenuItems;
    if (activeMenuTab === "library") return musicMenuItems;
    if (activeMenuTab === "discover") return discoverMenuItems;
    return user ? settingsMenuItems : authMenuItems;
  };

  const filterItems = <T extends { title: string; description: string }>(items: T[]) => {
    if (!searchQuery.trim()) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(item => item.title.toLowerCase().includes(query) || item.description.toLowerCase().includes(query));
  };

  const activeItems = filterItems(getActiveItems());

  const currentSectionLabel = activeMenuTab === "menu" ? "Navigation" : activeMenuTab === "library" ? "Your Library" : activeMenuTab === "discover" ? "Discover" : "Account";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50"
            onClick={onClose}
          />
          
          {/* Menu Panel */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ 
              type: "spring", 
              damping: 30, 
              stiffness: 300 
            }}
            className={`fixed bottom-0 left-0 right-0 h-[90vh] rounded-t-[32px] z-50 overflow-hidden border-t border-white/10 shadow-[0_-30px_120px_-50px_rgba(94,43,255,0.35)] backdrop-blur-2xl ${isDarkMode ? 'bg-[#020206]/95' : 'bg-[#12131f]/95'}`}
          >
            {/* Header with search */}
            <div className={`p-6 ${isDarkMode ? 'bg-[#0a0a0d]/20' : 'bg-[#12131f]/20'} border-b border-white/10 backdrop-blur-2xl`}>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <motion.div 
                    className="w-12 h-12 rounded-3xl bg-gradient-to-br from-purple-500 to-violet-700 flex items-center justify-center shadow-lg shadow-purple-500/20"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Music className="w-6 h-6 text-white" />
                  </motion.div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Fwaya Menu</h2>
                    <p className="text-sm text-purple-300">Quick access to your music world</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <motion.button
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className="p-2 rounded-full bg-white/5 text-white hover:bg-white/10 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isDarkMode ? <Sun className="w-5 h-5 text-yellow-300" /> : <Moon className="w-5 h-5 text-purple-300" />}
                  </motion.button>
                  <motion.button
                    onClick={onClose}
                    className="p-2 rounded-full bg-white/5 text-white hover:bg-white/10 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label="Close menu"
                  >
                    <X className="w-6 h-6" />
                  </motion.button>
                </div>
              </div>

              {/* Search Bar */}
              <motion.div 
                className="relative"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-[#080a13] px-4 py-3 shadow-inner shadow-white/5 transition-all duration-300 focus-within:border-purple-500/50">
                  <Search className="w-5 h-5 text-purple-300" />
                  <input
                    type="text"
                    placeholder="Search menu items"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-gray-500"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery("")}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            </div>

            <AnimatePresence>
              {authModalMode && (
                <motion.div
                  key="auth-modal"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70"
                  onClick={() => setAuthModalMode(null)}
                >
                  <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 30, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 18 }}
                    className="w-full max-w-md rounded-3xl border border-white/10 bg-[#07101d] p-6 shadow-2xl"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className="flex items-start justify-between gap-4 mb-5">
                      <div>
                        <p className="text-sm uppercase tracking-[0.24em] text-purple-300">Choose account</p>
                        <h3 className="mt-2 text-2xl font-semibold text-white">
                          {authModalMode === 'signin' ? 'Sign in to Fwaya' : 'Create a new account'}
                        </h3>
                        <p className="mt-2 text-sm text-gray-400">
                          Pick your account type to continue with the right experience.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAuthModalMode(null)}
                        className="rounded-full p-2 bg-white/5 text-white hover:bg-white/10 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="grid gap-3">
                      {authOptions.map((option) => (
                        <Link
                          key={option.title}
                          href={authModalMode === 'signin' ? option.signinHref : option.signupHref}
                          className="group block rounded-3xl border border-white/10 bg-[#0d1420] p-5 transition hover:border-purple-500/30 hover:bg-[#111925]"
                          onClick={onClose}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="text-lg font-semibold text-white">{option.title}</p>
                              <p className="text-sm text-gray-400">{option.subtitle}</p>
                            </div>
                            <div className="rounded-2xl bg-purple-600 px-3 py-2 text-xs font-semibold text-white uppercase">
                              {authModalMode === 'signin' ? 'Sign In' : 'Sign Up'}
                            </div>
                          </div>
                          <p className="mt-3 text-sm text-gray-400">{option.description}</p>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* User Info */}
            {user ? (
              <motion.div 
                className="px-6 py-4 bg-[#0a0a0d]"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center space-x-3 bg-[#080a13] rounded-3xl p-3">
                  <motion.div 
                    className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-bold"
                    whileHover={{ scale: 1.05 }}
                  >
                    {(user.role === 'ARTIST' ? (user.artistName || user.stageName || user.displayName || user.username) : (user.displayName || user.username))?.charAt(0) || "U"}
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {user.role === 'ARTIST' ? (user.artistName || user.stageName || user.displayName || user.username) : (user.displayName || user.username)}
                    </p>
                    <p className="text-xs text-purple-300 truncate">
                      {user.email}
                    </p>
                  </div>
                  <motion.button
                    className="p-2 rounded-full hover:bg-purple-600/20 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Bell className="w-4 h-4 text-purple-400" />
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                className="px-6 py-4 bg-[#0a0a0d]"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="space-y-3">
                  {/* Guest Plan Info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-[#080a13] flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-300" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Guest Plan</p>
                        <p className="text-xs text-gray-400">Limited access</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Free</p>
                    </div>
                  </div>

                  {/* Premium Plan CTA */}
                  <div className="bg-[#080a13] rounded-3xl p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Crown className="w-4 h-4 text-purple-400" />
                        <div>
                          <p className="text-sm font-medium text-white">Premium Plan</p>
                          <p className="text-xs text-purple-300">Unlimited access</p>
                        </div>
                      </div>
                      <motion.button
                        className="px-3 py-1 rounded-full bg-purple-600 text-white text-xs font-medium hover:bg-purple-700 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Upgrade
                      </motion.button>
                    </div>
                  </div>

                  {/* Artist login/create actions */}
                  <div className="grid gap-3">
                    <button
                      type="button"
                      onClick={() => setAuthModalMode('signin')}
                      className="w-full inline-flex items-center justify-center py-2 rounded-xl bg-[#080a13] text-white text-sm font-medium hover:bg-[#0a0d18] transition-colors"
                    >
                      Login
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthModalMode('signup')}
                      className="w-full inline-flex items-center justify-center py-2 rounded-xl bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition-colors"
                    >
                      Create Account
                    </button>
                  </div>
                  <div className="grid gap-3 mt-3">
                    <Link
                      href="/auth/artist/signin"
                      className="w-full inline-flex items-center justify-center py-2 rounded-xl border border-white/10 bg-[#0b1520] text-white text-sm font-medium hover:bg-[#121c2b] transition-colors"
                    >
                      Artist Login
                    </Link>
                    <Link
                      href="/auth/artist/signup"
                      className="w-full inline-flex items-center justify-center py-2 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors"
                    >
                      Artist Sign Up
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Tabs */}
            <div className="px-6 py-4">
              <div className="flex space-x-2 bg-[#080a13] rounded-2xl p-1">
                {menuTabs.map((tab, index) => {
                  const Icon = tab.icon;
                  const isActive = activeMenuTab === tab.id;
                  return (
                    <motion.button
                      key={tab.id}
                      onClick={() => setActiveMenuTab(tab.id)}
                      className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-sm font-medium transition-colors ${
                        isActive 
                          ? "bg-purple-600 text-white" 
                          : "text-gray-400 hover:text-white hover:bg-[#0a0d18]"
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                    >
                      <Icon size={18} />
                      <span>{tab.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="h-[calc(100%-240px)] overflow-y-auto pb-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeMenuTab}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6 py-4"
                >
                  {activeItems.length > 0 ? (
                    <MenuSection title={currentSectionLabel} items={activeItems} />
                  ) : (
                    <div className="mx-4 rounded-3xl border border-white/10 bg-[#080a13]/90 p-6 text-center text-gray-400 shadow-[0_25px_80px_-40px_rgba(94,43,255,0.28)]">
                      <p className="text-sm font-semibold text-white mb-2">No menu items found.</p>
                      <p className="text-sm text-gray-400">Try a different search or switch to another section.</p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Footer with enhanced styling */}
              <motion.div 
                className="px-6 mt-8 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-[#080a13]">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                  <p className="text-xs text-gray-400">
                    Fwaya Music v1.5.3 • Developed by BymaxZM
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}




