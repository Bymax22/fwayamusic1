"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Home, Search, Library, User, Music, Heart, Plus, Download, Settings, LogIn, UserPlus, Compass, PlayCircle, Shuffle, SkipBack, SkipForward, Play, Pause, Volume2, Bell, Moon, Sun, ChevronRight, Crown, Zap } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";

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
  const { currentTrack, isPlaying, playTrack, togglePlay } = useAudioPlayer();
  const [activeMenuTab, setActiveMenuTab] = useState("menu");
  const [searchQuery, setSearchQuery] = useState("");
  const [isShuffled, setIsShuffled] = useState(false);
  const [volume, setVolume] = useState(70);
  const [isDarkMode, setIsDarkMode] = useState(true);

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
    { title: "Login", icon: <Icon><LogIn size={20} /></Icon>, href: "/auth/login", description: "Sign in to your account" },
    { title: "Create Account", icon: <Icon><UserPlus size={20} /></Icon>, href: "/auth/signup", description: "Join Fwaya Music" },
  ];

  // Menu tabs with enhanced icons
  const menuTabs = [
    { id: "menu", label: "Menu", icon: Home },
    { id: "library", label: "Library", icon: Library },
    { id: "discover", label: "Discover", icon: Compass },
    { id: "account", label: "Account", icon: User },
  ];

  // Quick actions
  const quickActions = [
    { icon: Shuffle, label: "Shuffle", action: () => setIsShuffled(!isShuffled) },
    { icon: isPlaying ? Pause : Play, label: isPlaying ? "Pause" : "Play", action: () => togglePlay },
    { icon: SkipBack, label: "Previous", action: () => {} },
    { icon: SkipForward, label: "Next", action: () => {} },
  ];

  const MenuSection = ({ title, items }: { title: string; items: { title: string; icon: React.ReactNode; href: string; description: string }[] }) => (
    <div className="space-y-2">
      <h3 className="text-xs font-bold text-purple-300 uppercase tracking-wider px-4 py-2 border-l-2 border-purple-500 bg-white/5 rounded-r-2xl">
        {title}
      </h3>
      {items.map((item, index) => (
        <motion.div
          key={item.title}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Link
            href={item.href}
            className="flex items-center px-4 py-3 rounded-3xl text-white bg-[#090b14]/90 hover:bg-[#121827] transition-all duration-300 group mx-2 border border-white/10 hover:border-purple-500/30 shadow-sm shadow-purple-500/10"
            onClick={onClose}
          >
            <span className="flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
              {item.icon}
            </span>
            <div className="ml-3 flex-1">
              <span className="text-sm font-semibold block">{item.title}</span>
              <span className="text-xs text-gray-400">{item.description}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-purple-300 group-hover:text-white transition-colors" />
          </Link>
        </motion.div>
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
            className="fixed bottom-0 left-0 right-0 h-[90vh] bg-[#0a0a0d] rounded-t-[32px] z-50 overflow-hidden"
          >
            {/* Header with search */}
            <div className="p-6 bg-[#0a0a0d]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <motion.div 
                    className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Music className="w-6 h-6 text-white" />
                  </motion.div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Fwaya
                    </h2>
                    <p className="text-sm text-purple-300">Discover</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <motion.button
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className="p-2 rounded-full hover:bg-purple-600/20 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {isDarkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-purple-400" />}
                  </motion.button>
                  
                  <motion.button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-purple-600/20 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    aria-label="Close menu"
                  >
                    <X className="w-6 h-6 text-white" />
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
                <div className="flex items-center bg-[#080a13] rounded-2xl px-4 py-3 focus-within:bg-[#0a0d18] transition-colors">
                  <Search className="w-5 h-5 text-purple-400 mr-3" />
                  <input
                    type="text"
                    placeholder="Search songs, artists, playlists..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent outline-none text-white placeholder:text-gray-500 flex-1 text-sm"
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

                  {/* Sign In Button */}
                  <motion.button
                    className="w-full py-2 rounded-xl bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Sign In to Account
                  </motion.button>
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
            <div className="h-[calc(100%-280px)] overflow-y-auto pb-6">
              <AnimatePresence mode="wait">
                {activeMenuTab === "menu" && (
                  <motion.div 
                    key="menu"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-6 py-4"
                  >
                    <MenuSection title="Navigation" items={mainMenuItems} />
                  </motion.div>
                )}

                {activeMenuTab === "library" && user && (
                  <motion.div 
                    key="library"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-6 py-4"
                  >
                    <MenuSection title="Your Library" items={musicMenuItems} />
                  </motion.div>
                )}

                {activeMenuTab === "discover" && (
                  <motion.div 
                    key="discover"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-6 py-4"
                  >
                    <MenuSection title="Discover" items={discoverMenuItems} />
                  </motion.div>
                )}

                {activeMenuTab === "account" && (
                  <motion.div 
                    key="account"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-6 py-4"
                  >
                    {user ? (
                      <MenuSection title="Account" items={settingsMenuItems} />
                    ) : (
                      <MenuSection title="Authentication" items={authMenuItems} />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Enhanced Now Playing with Controls */}
              <motion.div 
                className="mx-4 mt-6 p-5 rounded-2xl bg-[#080a13]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <motion.div 
                      className="w-14 h-14 rounded-xl bg-purple-600 flex items-center justify-center"
                      whileHover={{ scale: 1.05 }}
                      animate={{ rotate: isPlaying ? 360 : 0 }}
                      transition={{ duration: 2, repeat: isPlaying ? Infinity : 0, ease: "linear" }}
                    >
                      <Music className="w-7 h-7 text-white" />
                    </motion.div>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {currentTrack ? currentTrack.title : "No track playing"}
                      </p>
                      <p className="text-xs text-purple-300">
                        {currentTrack ? currentTrack.artist : "Select a song"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {currentTrack ? (currentTrack.accessType === 'PREMIUM' ? 'Premium' : 'Free') : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <motion.button
                      onClick={() => setIsShuffled(!isShuffled)}
                      className={`p-2 rounded-full transition-all duration-200 ${
                        isShuffled ? 'bg-purple-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Shuffle className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      onClick={togglePlay}
                      className="p-2 rounded-full bg-purple-600 hover:bg-purple-700 text-white transition-all duration-200"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </motion.button>
                    <motion.button
                      className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-200"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <SkipForward className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-white/20 rounded-full h-1 mb-3">
                  <motion.div 
                    className="bg-purple-600 h-1 rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: isPlaying ? "60%" : "30%" }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mb-3">
                  <span>0:00</span>
                  <span>{currentTrack?.duration ? `${Math.floor(currentTrack.duration / 60)}:${(currentTrack.duration % 60).toString().padStart(2, '0')}` : "0:00"}</span>
                </div>

                {/* Volume Control */}
                <div className="flex items-center space-x-3">
                  <Volume2 className="w-4 h-4 text-purple-400" />
                  <div className="flex-1">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={volume}
                      onChange={(e) => setVolume(Number(e.target.value))}
                      className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer slider"
                    />
                  </div>
                  <span className="text-xs text-gray-400 w-8">{volume}%</span>
                </div>
              </motion.div>

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
                    Fwaya Music v2.0 • Premium Experience
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




