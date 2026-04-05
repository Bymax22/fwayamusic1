"use client";
import { 
  Music, User, Bell, LogOut, Settings, Share2, Crown, TrendingUp, 
  Heart, Plus, Radio, Mic2, Gift, Compass, DollarSign, X, Play, Coins, Search, Home, Menu, LogIn
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";

// Invite Popup Component
const InvitePopup = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const inviteUrl = "https://www.fwayainnovations.com";
  const shareText = "Check out Fwaya Music - The ultimate platform for music lovers! 🎵";
  
  const sharePlatforms = [
    {
      name: "WhatsApp",
      icon: "💬",
      shareUrl: `https://wa.me/?text=${encodeURIComponent(shareText + " " + inviteUrl)}`,
      color: "from-green-500 to-green-600"
    },
    {
      name: "Facebook",
      icon: "👥",
      shareUrl: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(inviteUrl)}`,
      color: "from-blue-600 to-blue-700"
    },
    {
      name: "Twitter",
      icon: "🐦",
      shareUrl: `https://twitter.com/intent/tweet?url=${encodeURIComponent(inviteUrl)}&text=${encodeURIComponent(shareText)}`,
      color: "from-sky-400 to-sky-500"
    },
    {
      name: "Telegram",
      icon: "📱",
      shareUrl: `https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${encodeURIComponent(shareText)}`,
      color: "from-blue-400 to-blue-500"
    },
    {
      name: "Email",
      icon: "📧",
      shareUrl: `mailto:?subject=Join Fwaya Music&body=${encodeURIComponent(shareText + "\n\n" + inviteUrl)}`,
      color: "from-gray-600 to-gray-700"
    },
    {
      name: "Copy Link",
      icon: "🔗",
      shareUrl: inviteUrl,
      color: "from-purple-500 to-purple-600",
      isCopy: true
    }
  ];

  const handleShare = async (platform: typeof sharePlatforms[0]) => {
    if (platform.isCopy) {
      try {
        await navigator.clipboard.writeText(inviteUrl);
        alert("Invite link copied to clipboard!");
        return;
      } catch {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = inviteUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert("Invite link copied to clipboard!");
      }
    } else {
      window.open(platform.shareUrl, '_blank', 'width=600,height=400');
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gradient-to-br from-[#240e47] to-[#240e47] rounded-2xl p-6 max-w-md w-full border border-[#ce7f16]/30 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#ce7f16] to-[#ce7f16] rounded-lg flex items-center justify-center">
              <Gift size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Invite Friends</h2>
              <p className="text-sm text-gray-400">Share Fwaya Music with friends</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#0a4a5f] transition-colors touch-target"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Share Platforms Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {sharePlatforms.map((platform) => (
            <button
              key={platform.name}
              onClick={() => handleShare(platform)}
              className={`bg-gradient-to-br ${platform.color} text-white p-3 rounded-xl transition-all hover:scale-105 touch-target flex flex-col items-center gap-2`}
            >
              <span className="text-xl">{platform.icon}</span>
              <span className="text-xs font-medium">{platform.name}</span>
            </button>
          ))}
        </div>

        {/* Preview of what friends will see */}
        <div className="bg-[#0a4a5f] rounded-xl p-4 border border-[#0a5a6f]">
          <h4 className="text-sm font-bold text-white mb-3">Your friends will receive:</h4>
          <div className="bg-white rounded-lg p-3">
            <div className="flex items-center gap-3 mb-2">
              <Image 
                src="/Fwaya Music Icon-01.png" 
                alt="Fwaya Music" 
                width={40}
                height={40}
                className="rounded"
              />
              <div>
                <h5 className="font-bold text-gray-900">Fwaya Music</h5>
                <p className="text-xs text-gray-600">The ultimate music platform</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-3">
              🎵 Stream latest music worldwide for FREE<br/>
              💰 Sell your music & earn commissions<br/>
              🚀 Resell without any investment<br/>
              🎹 Buy music, beats & instruments
            </p>
            <button 
              onClick={() => window.open(inviteUrl, '_blank')}
              className="w-full bg-[#ce7f16] hover:bg-[#ce7f16]/80 text-white py-2 rounded-lg font-semibold transition-colors"
            >
              Visit Fwaya Music
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showInvitePopup, setShowInvitePopup] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{id: number; title: string; type: string}>>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { currentTrack, isPlaying } = useAudioPlayer();
  const [forcedNowPlaying, setForcedNowPlaying] = useState(false);
  const [forcedInfo, setForcedInfo] = useState("");
  const showNowPlaying = forcedNowPlaying || (currentTrack && isPlaying);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  

  // Listen for player minimize events to show running title/artist in header
  useEffect(() => {
    const handler = (evt: Event) => {
      const e = evt as CustomEvent<{
        minimized?: boolean;
        title?: string;
        artist?: string;
      }>;
      const minimized = !!e?.detail?.minimized;
      const title = e?.detail?.title || currentTrack?.title || "";
      const artist = e?.detail?.artist || currentTrack?.artist || "";
      if (minimized) {
        setForcedNowPlaying(true);
        setForcedInfo(`${title} — ${artist}`);
      } else {
        setForcedNowPlaying(false);
        setForcedInfo("");
      }
    };
    window.addEventListener("player:minimized", handler as EventListener);
    return () => window.removeEventListener("player:minimized", handler as EventListener);
  }, [currentTrack]);

  // Navigation links for logged-in users
  const loggedInNavLinks = [
    { name: "Browse", href: "/browse", icon: <Music size={20} /> },
    { name: "Trending", href: "/trending", icon: <TrendingUp size={20} /> },
    { name: "Radio", href: "/radio", icon: <Radio size={20} /> },
    { name: "Artists", href: "/artists", icon: <Mic2 size={20} /> },
    { name: "Premium", href: "/premium", icon: <Crown size={20} /> },
  ];

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
    router.push('/');
  };

  // Guest User Navbar
  if (!user) {
    return (
      <>
        {/* Guest User Navbar - Bigger Logo with More Features */}
        <nav className={`relative w-full h-16 transition-all duration-300 z-50 
          ${isScrolled ? "bg-[#240e47] bg-opacity-95 backdrop-blur-lg" : "bg-[#240e47] bg-opacity-90 backdrop-blur-md"}
          border-b border-[#240e47]/30 shadow-lg`}
        >
          <div className="container mx-auto px-4 h-full flex items-center justify-between">
            {/* Left Section - Bigger Logo for Guests */}
            <div className="flex items-center gap-2">
              <Link href="/" className="flex items-center gap-2">
                <div className="shadow-lg">
                  <Image 
                    src="/Fwaya Innovations icon-01.png" 
                    alt="Fwaya Logo" 
                    width={32}
                    height={32}
                    className="rounded-lg"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-white">
                    Fwaya<span className="text-[#ce7f16]"></span>
                  </span>
                </div>
              </Link>
            </div>

            {/* Middle Section - Search (desktop + mobile) */}
            <div className="flex-1 mx-2 md:mx-6">
              <div className="flex items-center w-full justify-center h-full">
                <form
                        onSubmit={(e) => {
                    e.preventDefault();
                    if (searchQuery.trim()) {
                      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                      setShowSearchResults(false);
                    }
                  }}
                  className="w-full h-full flex items-center"
                >
                  <div className="relative h-full flex items-center">
                    <input
                      aria-label="Search"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        if (e.target.value.trim().length > 0) {
                          setShowSearchResults(true);
                          setSearchResults([
                            { id: 1, title: 'Song: ' + e.target.value, type: 'song' },
                            { id: 2, title: 'Artist: ' + e.target.value, type: 'artist' },
                            { id: 3, title: 'Playlist: ' + e.target.value, type: 'playlist' }
                          ]);
                        } else {
                          setShowSearchResults(false);
                        }
                      }}
                      onFocus={() => searchQuery.trim().length > 0 && setShowSearchResults(true)}
                      onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                      placeholder="Search Songs, Artists..."
                        className={`w-full bg-[#240e47]/60 text-white placeholder-gray-400 rounded-full pl-4 sm:pl-4 pr-12 sm:pr-4 h-10 sm:h-8 py-0 border border-[#240e47] text-xs sm:text-base placeholder:text-xs sm:placeholder:text-base focus:outline-none focus:ring-0 leading-none self-center ${showNowPlaying ? 'md:max-w-[150px]' : 'max-w-none md:max-w-xs lg:max-w-2xl'}`}
                    />
                    <button
                      type="submit"
                      disabled={!searchQuery.trim()}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Search size={16} />
                    </button>
                    {/* Search Results Dropdown */}
                    {showSearchResults && searchResults.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-[#240e47] border border-[#ce7f16]/30 rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto"
                      >
                        {searchResults.map((result) => (
                          <button
                            key={result.id}
                            onClick={() => {
                              setSearchQuery(result.title);
                              router.push(`/search?q=${encodeURIComponent(result.title)}`);
                              setShowSearchResults(false);
                            }}
                            className="w-full px-4 py-3 text-left text-sm text-white hover:bg-[#ce7f16]/20 transition-colors border-b border-[#ce7f16]/30 last:border-0"
                          >
                            <div className="flex items-center gap-2">
                              <Search size={14} className="text-gray-400" />
                              <span>{result.title}</span>
                              <span className="text-xs text-gray-500 ml-auto">{result.type}</span>
                            </div>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </div>
                </form>
              </div>
            </div>

            {/* Right Section - Guest Features */}
            <div className="flex items-center gap-1"> {/* Reduced gap from gap-4 to gap-1 */}
              {/* Navigation Icons */}
              <Link href="/" className="p-2 rounded-full hover:bg-[#240e47]/50 text-white transition-colors touch-target">
                <Home size={20} />
              </Link>
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('mobileMenu:open'))}
                className="p-2 rounded-full hover:bg-[#240e47]/50 text-white transition-colors touch-target md:hidden"
              >
                <Menu size={20} />
              </button>
              <Link href="/auth/user/signin" className="p-2 rounded-full hover:bg-[#240e47]/50 text-white transition-colors touch-target">
                <LogIn size={20} />
              </Link>
              
              <AnimatePresence mode="wait">
                {(forcedNowPlaying || (currentTrack && isPlaying)) ? (
                  // Audio Wave + Now Playing text (forced or normal)
                  <motion.div
                    key="playing"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.3 }}
                    className="hidden sm:flex items-center gap-3 px-3 py-1.5 bg-gradient-to-r from-[#ce7f16]/20 to-[#ce7f16]/20 rounded-full border border-[#ce7f16]/30 max-w-[150px]"
                  >
                    <div className="flex items-center gap-0.5">
                      <motion.div
                        animate={{ scaleY: [1, 1.5, 1] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                        className="w-0.5 h-3 bg-[#ce7f16] rounded-full"
                      />
                      <motion.div
                        animate={{ scaleY: [1, 2, 1] }}
                        transition={{ duration: 0.5, repeat: Infinity, delay: 0.1 }}
                        className="w-0.5 h-4 bg-[#ce7f16] rounded-full"
                      />
                      <motion.div
                        animate={{ scaleY: [1, 1.5, 1] }}
                        transition={{ duration: 0.5, repeat: Infinity, delay: 0.2 }}
                        className="w-0.5 h-3 bg-[#ce7f16] rounded-full"
                      />
                    </div>

                    <div className="overflow-hidden w-full">
                      <motion.div
                        className="whitespace-nowrap text-xs text-white font-medium"
                        animate={forcedNowPlaying ? { x: ["0%", "-100%"] } : { x: 0 }}
                        transition={forcedNowPlaying ? { duration: 8, repeat: Infinity, ease: "linear" } : { duration: 0 }}
                      >
                        {forcedNowPlaying ? forcedInfo : `${currentTrack?.title || "Now Playing"}${currentTrack?.artist ? ` — ${currentTrack.artist}` : ""}`}
                      </motion.div>
                    </div>
                  </motion.div>
                ) : (
                  // Now Playing, Search & Earn Icons - Shows when not playing
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center gap-3"
                  >
                    {/* Now Playing Icon */}
                    <Play 
                      size={22} 
                      className="text-[#ce7f16] hover:scale-110 transition-transform cursor-pointer"
                      onClick={() => router.push('/browse')}
                    />
                    
                    {/* Search & Earn hidden on small screens (space given to input) */}
                    <div className="hidden sm:flex items-center gap-3">
                      <Search 
                        size={22} 
                        className="text-white hover:scale-110 transition-transform cursor-pointer"
                        onClick={() => setShowMobileSearch(true)}
                      />
                      <Coins 
                        size={22} 
                        className="text-green-500 hover:scale-110 transition-transform cursor-pointer"
                        onClick={() => router.push('/auth/signin?role=RESELLER')}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </nav>

        {/* Mobile Search Overlay */}
        <AnimatePresence>
          {showMobileSearch && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-start p-4 pt-24"
              onClick={() => setShowMobileSearch(false)}
            >
              <motion.div
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -10, opacity: 0 }}
                className="w-full max-w-md mx-auto bg-[#240e47] rounded-xl p-4 border border-[#ce7f16]/30"
                onClick={(e) => e.stopPropagation()}
              >
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (searchQuery.trim()) {
                      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                      setShowMobileSearch(false);
                    }
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        autoFocus
                        aria-label="Search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search music..."
                        className="w-full bg-[#240e47]/60 text-white placeholder-gray-400 rounded-full pl-4 sm:pl-4 pr-12 sm:pr-4 h-12 sm:h-8 border border-[#240e47] text-xs sm:text-base placeholder:text-xs sm:placeholder:text-base focus:outline-none focus:ring-0"
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-300">
                        <Search size={16} />
                      </div>
                    </div>
                    <button type="submit" className="px-3 py-2 bg-[#ce7f16] rounded-full text-white font-semibold">Search</button>
                    <button type="button" onClick={() => setShowMobileSearch(false)} className="p-2 rounded-full text-gray-300">
                      <X size={18} />
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Invite Popup */}
        <InvitePopup isOpen={showInvitePopup} onClose={() => setShowInvitePopup(false)} />

        {/* Spacer for fixed navbar */}
        
      </>
    );
  }

  // Logged-in User Navbar
  return (
    <>
      {/* Logged-in User Navbar - More Features */}
      <nav className={`relative w-full h-16 transition-all duration-300 z-50 
        ${isScrolled ? "bg-[#240e47] bg-opacity-95 backdrop-blur-lg" : "bg-[#240e47] bg-opacity-90 backdrop-blur-md"}
        border-b border-[#240e47]/30 shadow-lg`}
      >
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          {/* Left Section - Logo with Tagline */}
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="shadow-lg">
                <Image 
                  src="/Fwaya Innovations icon-01.png" 
                  alt="Fwaya Logo" 
                  width={32}
                  height={32}
                  className="rounded"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-white">
                  Fwaya<span className="text-[#ce7f16]"></span>
                </span>
                  <span className="text-xs text-gray-400">Explore & Start Earning</span>
              </div>
            </Link>
          </div>

          {/* Middle Section - Navigation & Search */}
          <div className="flex-1 max-w-2xl mx-2 md:mx-6">
            <div className="flex items-center gap-4 h-full">
              {/* Navigation Links - Hidden on mobile */}
              <div className="hidden lg:flex items-center gap-1">
                {loggedInNavLinks.map((link) => (
                  <Link key={link.name} href={link.href} passHref>
                    <button className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all touch-target group ${
                      pathname.startsWith(link.href) 
                        ? "bg-[#ce7f16] text-white shadow-lg" 
                        : "text-gray-300 hover:text-white hover:bg-[#240e47]/50"
                    }`}>
                      <span className="group-hover:scale-110 transition-transform">
                        {link.icon}
                      </span>
                      <span className="text-sm font-medium">{link.name}</span>
                    </button>
                  </Link>
                ))}
                
                {/* Explore Icon */}
                <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all touch-target group text-gray-300 hover:text-white hover:bg-[#240e47]/50">
                  <Compass size={20} className="group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium">Explore</span>
                </button>
                
                {/* Earn Icon */}
                <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all touch-target group text-gray-300 hover:text-white hover:bg-[#240e47]/50">
                  <DollarSign size={20} className="group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium">Earn</span>
                </button>
              </div>

              {/* Search (visible on mobile and desktop) */}
              <div className="flex-1 max-w-none md:max-w-xs lg:max-w-2xl h-full flex items-center">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (searchQuery.trim()) {
                      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                      setShowSearchResults(false);
                    }
                  }}
                  className="w-full"
                >
                  <div className="relative h-full flex items-center">
                    <input
                      aria-label="Search"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        if (e.target.value.trim().length > 0) {
                          setShowSearchResults(true);
                          setSearchResults([
                            { id: 1, title: 'Song: ' + e.target.value, type: 'song' },
                            { id: 2, title: 'Artist: ' + e.target.value, type: 'artist' },
                            { id: 3, title: 'Playlist: ' + e.target.value, type: 'playlist' }
                          ]);
                        } else {
                          setShowSearchResults(false);
                        }
                      }}
                      onFocus={() => searchQuery.trim().length > 0 && setShowSearchResults(true)}
                      onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                      placeholder="Search music..."
                        className={`w-full bg-[#240e47]/60 text-white placeholder-gray-400 rounded-full pl-4 sm:pl-4 pr-12 sm:pr-4 h-10 sm:h-8 py-0 border border-[#240e47] text-xs sm:text-base placeholder:text-xs sm:placeholder:text-base focus:outline-none focus:ring-0 leading-none self-center ${showNowPlaying ? 'md:max-w-[150px]' : 'max-w-none md:max-w-xs lg:max-w-2xl'}`}
                    />
                    <button
                      type="submit"
                      disabled={!searchQuery.trim()}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Search size={16} />
                    </button>
                    {/* Search Results Dropdown */}
                    {showSearchResults && searchResults.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-[#240e47] border border-[#ce7f16]/30 rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto"
                      >
                        {searchResults.map((result) => (
                          <button
                            key={result.id}
                            onClick={() => {
                              setSearchQuery(result.title);
                              router.push(`/search?q=${encodeURIComponent(result.title)}`);
                              setShowSearchResults(false);
                            }}
                            className="w-full px-4 py-3 text-left text-sm text-white hover:bg-[#ce7f16]/20 transition-colors border-b border-[#ce7f16]/30 last:border-0"
                          >
                            <div className="flex items-center gap-2">
                              <Search size={14} className="text-gray-400" />
                              <span>{result.title}</span>
                              <span className="text-xs text-gray-500 ml-auto">{result.type}</span>
                            </div>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Right Section - User Actions */}
          <div className="flex items-center gap-2"> {/* Reduced gap from gap-3 to gap-2 */}
            {/* Navigation Icons */}
            <Link href="/dashboard" className="p-2 rounded-full hover:bg-[#240e47]/50 text-white transition-colors touch-target">
              <Home size={20} />
            </Link>
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('mobileMenu:open'))}
              className="p-2 rounded-full hover:bg-[#240e47]/50 text-white transition-colors touch-target md:hidden"
            >
              <Menu size={20} />
            </button>
            
            {/* Now Playing Section - Shows when song is playing or player minimized */}
            {currentTrack && (isPlaying || forcedNowPlaying) && (
              <button
                onClick={() => {
                  // Open the bottom header / reveal player when clicked
                  window.dispatchEvent(new CustomEvent('player:openBottomHeader', { detail: { open: true } }));
                }}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#ce7f16]/10 rounded-full border border-[#ce7f16]/20 touch-target"
              >
                {/* Album art */}
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                  {currentTrack.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={currentTrack.imageUrl as string} alt={currentTrack.title || 'cover'} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-[#240e47] flex items-center justify-center text-xs text-gray-300"> 
                      <Play size={12} className="text-[#ce7f16]" />
                    </div>
                  )}
                </div>

                <div className="flex flex-col min-w-0">
                  <span className="text-xs sm:text-sm text-white font-medium truncate">
                    {forcedNowPlaying ? forcedInfo.split(' — ')[0] || currentTrack.title : currentTrack.title}
                  </span>
                  <span className="text-[10px] sm:text-xs text-gray-300 truncate">
                    {forcedNowPlaying ? forcedInfo.split(' — ')[1] || currentTrack.artist : currentTrack.artist}
                  </span>
                </div>
              </button>
            )}

            {/* Earn Badge - Always visible */}
            <div className="hidden md:flex items-center gap-1 px-3 py-1.5 bg-amber-500/20 rounded-full border border-amber-500/30">
              <DollarSign size={16} className="text-amber-400" />
              <span className="text-sm text-amber-400 font-medium">Earn</span>
            </div>

            {/* Quick Actions - Hidden on mobile */}
            <div className="hidden md:flex items-center gap-2">
              {/* Create */}
              <button className="p-2 rounded-full hover:bg-[#240e47]/50 text-white transition-colors touch-target group">
                <Plus size={20} className="group-hover:scale-110 transition-transform" />
              </button>
              
              {/* Favorites */}
              <button className="p-2 rounded-full hover:bg-[#240e47]/50 text-white transition-colors touch-target group">
                <Heart size={20} className="group-hover:scale-110 transition-transform" />
              </button>
              
              {/* Share */}
              <button 
                onClick={() => setShowInvitePopup(true)}
                className="p-2 rounded-full hover:bg-[#240e47]/50 text-white transition-colors touch-target group"
              >
                <Share2 size={20} className="group-hover:scale-110 transition-transform" />
              </button>
            </div>

            {/* Mobile Icons - Premium, Notifications, Account (Visible on mobile) */}
            <div className="flex md:hidden items-center gap-0"> {/* Reduced gap from gap-0.5 to gap-0 */}
              {/* Premium Icon */}
              <button className="p-2.5 rounded-full hover:bg-[#240e47]/50 text-white transition-colors touch-target group">
                <Crown size={22} className="text-amber-400 group-hover:scale-110 transition-transform" />
              </button>

              {/* Notifications */}
              <button className="relative p-2.5 rounded-full hover:bg-[#240e47]/50 text-white transition-colors touch-target group">
                <Bell size={22} className="group-hover:scale-110 transition-transform" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#ce7f16] rounded-full border border-[#240e47]"></div>
              </button>

              {/* User Account */}
              <div className="relative">
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="p-2.5 rounded-full hover:bg-[#240e47]/50 transition-all touch-target group"
                >
                  {user.avatarUrl ? (
                    <Image
                      src={user.avatarUrl}
                      alt={user.displayName || user.username}
                      width={26}
                      height={26}
                      className="rounded-full group-hover:scale-110 transition-transform"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#ce7f16] to-[#240e47] flex items-center justify-center group-hover:scale-110 transition-transform">
                      <User size={16} className="text-white" />
                    </div>
                  )}
                </button>

                {/* Mobile User Dropdown */}
                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-full right-0 mt-2 w-48 bg-[#240e47] border border-[#ce7f16]/30 rounded-xl shadow-2xl py-2 z-50 backdrop-blur-lg"
                    >
                      <div className="px-3 py-2 border-b border-[#ce7f16]/30">
                        <p className="font-semibold text-white text-sm truncate">
                          {user.role === 'ARTIST' ? (user.artistName || user.stageName || user.displayName || user.username) : (user.displayName || user.username)}
                        </p>
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                      </div>

                      {/* Quick Actions */}
                      <div className="px-1 py-1">
                        <Link href="/profile" className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-300 hover:bg-[#ce7f16]/20 hover:text-white transition-colors text-sm">
                          <User size={16} />
                          <span>Profile</span>
                        </Link>
                        <Link href="/settings" className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-300 hover:bg-[#ce7f16]/20 hover:text-white transition-colors text-sm">
                          <Settings size={16} />
                          <span>Settings</span>
                        </Link>
                        <button 
                          onClick={() => {
                            setShowInvitePopup(true);
                            setShowUserMenu(false);
                          }}
                          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-gray-300 hover:bg-[#0a4a5f] hover:text-white transition-colors text-sm"
                        >
                          <Gift size={16} />
                          <span>Invite Friends</span>
                        </button>
                      </div>

                      {/* Divider */}
                      <div className="border-t border-[#0a4a5f] my-1"></div>

                      {/* Sign Out */}
                      <button 
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full px-3 py-2 text-gray-300 hover:bg-[#0a4a5f] hover:text-white transition-colors rounded-lg text-sm"
                      >
                        <LogOut size={16} />
                        <span>Sign Out</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Desktop User Menu */}
            <div className="hidden md:block relative">
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 bg-[#240e47]/70 rounded-full hover:bg-[#240e47] transition-all touch-target group"
              >
                {user.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt={user.displayName || user.username}
                    width={32}
                    height={32}
                    className="rounded-full group-hover:scale-110 transition-transform"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ce7f16] to-[#240e47] flex items-center justify-center group-hover:scale-110 transition-transform">
                    <User size={18} className="text-white" />
                  </div>
                )}
                <span className="text-sm font-medium hidden lg:inline-block text-white max-w-24 truncate">
                  {user.role === 'ARTIST' ? (user.artistName || user.stageName || user.displayName || user.username) : (user.displayName || user.username)}
                </span>
              </button>

              {/* Desktop User Dropdown */}
              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full right-0 mt-2 w-64 bg-[#240e47] border border-[#ce7f16]/30 rounded-xl shadow-2xl py-2 z-50 backdrop-blur-lg"
                  >
                    {/* User Info Header */}
                    <div className="px-4 py-3 border-b border-[#ce7f16]/30">
                      <div className="flex items-center gap-3 mb-2">
                        {user.avatarUrl ? (
                          <Image
                            src={user.avatarUrl}
                            alt={user.displayName || user.username}
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ce7f16] to-[#240e47] flex items-center justify-center">
                            <User size={20} className="text-white" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white truncate">
                            {user.role === 'ARTIST' ? (user.artistName || user.stageName || user.displayName || user.username) : (user.displayName || user.username)}
                          </p>
                          <p className="text-xs text-gray-400 truncate">{user.email}</p>
                        </div>
                      </div>
                      {user.isPremium && (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs">
                          <Crown size={12} />
                          <span>Premium Member</span>
                        </div>
                      )}
                    </div>

                    {/* Quick Actions */}
                    <div className="px-2 py-1">
                      <Link href="/profile" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-[#0a4a5f] hover:text-white transition-colors">
                        <User size={18} />
                        <span>My Profile</span>
                      </Link>
                      <Link href="/library" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-[#0a4a5f] hover:text-white transition-colors">
                        <Music size={18} />
                        <span>My Library</span>
                      </Link>
                      <Link href="/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-[#0a4a5f] hover:text-white transition-colors">
                        <Settings size={18} />
                        <span>Settings</span>
                      </Link>
                      <button 
                        onClick={() => {
                          setShowInvitePopup(true);
                          setShowUserMenu(false);
                        }}
                        className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-gray-300 hover:bg-[#ce7f16]/20 hover:text-white transition-colors"
                      >
                        <Gift size={18} />
                        <span>Invite Friends</span>
                      </button>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-[#ce7f16]/30 my-1"></div>

                    {/* Sign Out */}
                    <button 
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-3 py-2 text-gray-300 hover:bg-[#ce7f16]/20 hover:text-white transition-colors rounded-lg"
                    >
                      <LogOut size={18} />
                      <span>Sign Out</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Search Overlay */}
      <AnimatePresence>
        {showMobileSearch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-start p-4 pt-24"
            onClick={() => setShowMobileSearch(false)}
          >
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              className="w-full max-w-md mx-auto bg-[#240e47] rounded-xl p-4 border border-[#ce7f16]/30"
              onClick={(e) => e.stopPropagation()}
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (searchQuery.trim()) {
                    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                    setShowMobileSearch(false);
                  }
                }}
              >
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      autoFocus
                      aria-label="Search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search songs, artists, playlists..."
                      className="w-full bg-[#07202a]/60 text-white placeholder-gray-400 rounded-full pl-10 pr-4 py-2 border border-[#240e47] focus:outline-none self-center"
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-300">
                      <Search size={16} />
                    </div>
                  </div>
                  <button type="submit" className="px-3 py-2 bg-[#ce7f16] rounded-full text-white font-semibold">Search</button>
                  <button type="button" onClick={() => setShowMobileSearch(false)} className="p-2 rounded-full text-gray-300">
                    <X size={18} />
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Invite Popup */}
      <InvitePopup isOpen={showInvitePopup} onClose={() => setShowInvitePopup(false)} />

      {/* Spacer for fixed navbar */}
      
    </>
  );
}




