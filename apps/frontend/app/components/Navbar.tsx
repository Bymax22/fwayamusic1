"use client";
import { 
  Music, User, Bell, LogOut, Settings, Share2, Crown, TrendingUp, 
  Heart, Plus, Radio, Mic2, Gift, Compass, DollarSign, X
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";

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
        className="bg-gradient-to-br from-[#0a3747] to-[#0a1f29] rounded-2xl p-6 max-w-md w-full border border-[#0a4a5f] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#e51f48] to-[#ff4d6d] rounded-lg flex items-center justify-center">
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
              className="w-full bg-[#e51f48] hover:bg-[#ff4d6d] text-white py-2 rounded-lg font-semibold transition-colors"
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
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
        <nav className={`fixed top-0 left-0 w-full h-16 transition-all duration-300 z-50 
          ${isScrolled ? "bg-[#0a3747] bg-opacity-95 backdrop-blur-lg" : "bg-[#0a3747] bg-opacity-90 backdrop-blur-md"}
          border-b border-[#0a3747]/30 shadow-lg`}
        >
          <div className="container mx-auto px-4 h-full flex items-center justify-between">
            {/* Left Section - Bigger Logo for Guests */}
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="shadow-lg"
                >
                  <Image 
                    src="/Fwaya Innovations icon-01.png" 
                    alt="Fwaya Music Logo" 
                    width={44}
                    height={44}
                    className="rounded-lg"
                  />
                </motion.div>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-white">
                    Fwaya<span className="text-[#e51f48]">Music</span>
                  </span>
                  <span className="text-xs text-gray-400 -mt-1">Stream & Discover</span>
                </div>
              </Link>
            </div>

            {/* Middle Section - reserved spacing */}
            <div className="flex-1 max-w-lg mx-6" />

            {/* Right Section - Guest Features */}
            <div className="flex items-center gap-4">
              {/* Invite Friends - Text Only Button */}
              <button 
                onClick={() => setShowInvitePopup(true)}
                className="px-3 py-1.5 text-sm bg-[#e51f48] hover:bg-[#ff4d6d] rounded-full text-white font-semibold transition-all touch-target md:px-4 md:py-2 md:text-base"
              >
                Invite
              </button>
            </div>
          </div>
        </nav>

        {/* Invite Popup */}
        <InvitePopup isOpen={showInvitePopup} onClose={() => setShowInvitePopup(false)} />

        {/* Spacer for fixed navbar */}
        <div className="h-16"></div>
      </>
    );
  }

  // Logged-in User Navbar
  return (
    <>
      {/* Logged-in User Navbar - More Features */}
      <nav className={`fixed top-0 left-0 w-full h-16 transition-all duration-300 z-50 
        ${isScrolled ? "bg-[#0a3747] bg-opacity-95 backdrop-blur-lg" : "bg-[#0a3747] bg-opacity-90 backdrop-blur-md"}
        border-b border-[#0a3747]/30 shadow-lg`}
      >
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          {/* Left Section - Logo with Tagline */}
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="shadow-lg"
              >
                <Image 
                  src="/Fwaya Innovations icon-01.png" 
                  alt="Fwaya Music Logo" 
                  width={36}
                  height={36}
                  className="rounded"
                />
              </motion.div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-white">
                  Fwaya<span className="text-[#e51f48]">Music</span>
                </span>
                <span className="text-xs text-gray-400 -mt-1">Explore & Start Earning</span>
              </div>
            </Link>
          </div>

          {/* Middle Section - Navigation & Search */}
          <div className="flex-1 max-w-2xl mx-6">
            <div className="flex items-center gap-4">
              {/* Navigation Links - Hidden on mobile */}
              <div className="hidden lg:flex items-center gap-1">
                {loggedInNavLinks.map((link) => (
                  <Link key={link.name} href={link.href} passHref>
                    <button className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all touch-target group ${
                      pathname.startsWith(link.href) 
                        ? "bg-[#e51f48] text-white shadow-lg" 
                        : "text-gray-300 hover:text-white hover:bg-[#0a3747]/50"
                    }`}>
                      <span className="group-hover:scale-110 transition-transform">
                        {link.icon}
                      </span>
                      <span className="text-sm font-medium">{link.name}</span>
                    </button>
                  </Link>
                ))}
                
                {/* Explore Icon */}
                <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all touch-target group text-gray-300 hover:text-white hover:bg-[#0a3747]/50">
                  <Compass size={20} className="group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium">Explore</span>
                </button>
                
                {/* Earn Icon */}
                <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all touch-target group text-gray-300 hover:text-white hover:bg-[#0a3747]/50">
                  <DollarSign size={20} className="group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium">Earn</span>
                </button>
              </div>

              {/* Search removed: reserved spacing left */}
              <div className="flex-1 max-w-xs" />
            </div>
          </div>

          {/* Right Section - User Actions */}
          <div className="flex items-center gap-2"> {/* Reduced gap from gap-3 to gap-2 */}
            {/* Quick Actions - Hidden on mobile */}
            <div className="hidden md:flex items-center gap-2">
              {/* Create */}
              <button className="p-2 rounded-full hover:bg-[#0a3747]/50 text-white transition-colors touch-target group">
                <Plus size={20} className="group-hover:scale-110 transition-transform" />
              </button>
              
              {/* Favorites */}
              <button className="p-2 rounded-full hover:bg-[#0a3747]/50 text-white transition-colors touch-target group">
                <Heart size={20} className="group-hover:scale-110 transition-transform" />
              </button>
              
              {/* Share */}
              <button 
                onClick={() => setShowInvitePopup(true)}
                className="p-2 rounded-full hover:bg-[#0a3747]/50 text-white transition-colors touch-target group"
              >
                <Share2 size={20} className="group-hover:scale-110 transition-transform" />
              </button>
            </div>

            {/* Mobile Icons - Premium, Notifications, Account (Visible on mobile) */}
            <div className="flex md:hidden items-center gap-0.5"> {/* Reduced gap from gap-2 to gap-0.5 */}
              {/* Premium Icon */}
              <button className="p-2.5 rounded-full hover:bg-[#0a3747]/50 text-white transition-colors touch-target group">
                <Crown size={22} className="text-amber-400 group-hover:scale-110 transition-transform" />
              </button>

              {/* Notifications */}
              <button className="relative p-2.5 rounded-full hover:bg-[#0a3747]/50 text-white transition-colors touch-target group">
                <Bell size={22} className="group-hover:scale-110 transition-transform" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#e51f48] rounded-full border border-[#0a3747]"></div>
              </button>

              {/* User Account */}
              <div className="relative">
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="p-2.5 rounded-full hover:bg-[#0a3747]/50 transition-all touch-target group"
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
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#e51f48] to-[#ff4d6d] flex items-center justify-center group-hover:scale-110 transition-transform">
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
                      className="absolute top-full right-0 mt-2 w-48 bg-[#0a3747] border border-[#0a4a5f] rounded-xl shadow-2xl py-2 z-50 backdrop-blur-lg"
                    >
                      {/* User Info */}
                      <div className="px-3 py-2 border-b border-[#0a4a5f]">
                        <p className="font-semibold text-white text-sm truncate">{user.displayName || user.username}</p>
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                      </div>

                      {/* Quick Actions */}
                      <div className="px-1 py-1">
                        <Link href="/profile" className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-300 hover:bg-[#0a4a5f] hover:text-white transition-colors text-sm">
                          <User size={16} />
                          <span>Profile</span>
                        </Link>
                        <Link href="/settings" className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-300 hover:bg-[#0a4a5f] hover:text-white transition-colors text-sm">
                          <Settings size={16} />
                          <span>Settings</span>
                        </Link>
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
                className="flex items-center gap-2 p-1.5 bg-[#0a3747]/70 rounded-full hover:bg-[#0a3747] transition-all touch-target group"
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
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#e51f48] to-[#ff4d6d] flex items-center justify-center group-hover:scale-110 transition-transform">
                    <User size={18} className="text-white" />
                  </div>
                )}
                <span className="text-sm font-medium hidden lg:inline-block text-white max-w-24 truncate">
                  {user.displayName || user.username}
                </span>
              </button>

              {/* Desktop User Dropdown */}
              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full right-0 mt-2 w-64 bg-[#0a3747] border border-[#0a4a5f] rounded-xl shadow-2xl py-2 z-50 backdrop-blur-lg"
                  >
                    {/* User Info Header */}
                    <div className="px-4 py-3 border-b border-[#0a4a5f]">
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
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#e51f48] to-[#ff4d6d] flex items-center justify-center">
                            <User size={20} className="text-white" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white truncate">{user.displayName || user.username}</p>
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
                    </div>

                    {/* Divider */}
                    <div className="border-t border-[#0a4a5f] my-1"></div>

                    {/* Sign Out */}
                    <button 
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-3 py-2 text-gray-300 hover:bg-[#0a4a5f] hover:text-white transition-colors rounded-lg"
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

      {/* Invite Popup */}
      <InvitePopup isOpen={showInvitePopup} onClose={() => setShowInvitePopup(false)} />

      {/* Spacer for fixed navbar */}
      <div className="h-16"></div>
    </>
  );
}