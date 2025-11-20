"use client";
import { 
  UserPlus, Download, Music, DollarSign, Search, User, Bell, 
  LogOut, Settings, Headphones, Share2, Crown, TrendingUp, 
  Heart, Plus, Radio, Mic2, Users, Gift
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";

interface NavbarProps {}

export default function Navbar(_: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
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
                <Image 
                  src="/Fwaya Music Icon-01.png" 
                  alt="Fwaya Music Logo" 
                  width={44}
                  height={44}
                  className="rounded-lg animate-pulse"
                />
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-white">
                    Fwaya<span className="text-[#e51f48]">Music</span>
                  </span>
                  <span className="text-xs text-gray-400 -mt-1">Stream & Discover</span>
                </div>
              </Link>
            </div>

            {/* Middle Section - Search & Features for Guests */}
            <div className="flex-1 max-w-lg mx-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Discover music, artists, beats..."
                  className="w-full bg-[#0a1f29] bg-opacity-70 rounded-full py-2.5 pl-10 pr-4 text-base focus:outline-none focus:ring-2 focus:ring-[#e51f48] text-white placeholder-gray-400"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search"
                />
                {searchQuery && (
                  <button 
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Right Section - Guest Features */}
            <div className="flex items-center gap-4">
              {/* Now Playing Preview */}
              <button className="flex items-center gap-2 px-3 py-1.5 bg-[#e51f48] bg-opacity-20 rounded-full hover:bg-opacity-30 transition-all group">
                <Headphones size={18} className="text-[#e51f48] group-hover:animate-pulse" />
                <span className="text-sm font-medium text-white">Now Playing</span>
              </button>

              {/* Invite Friends */}
              <button className="flex items-center gap-2 px-3 py-1.5 bg-[#0a1f29] rounded-full hover:bg-[#0a3747] transition-all group">
                <Gift size={18} className="text-green-400 group-hover:text-green-300" />
                <span className="text-sm font-medium text-white">Invite & Earn</span>
              </button>

              {/* Sign In Button */}
              <Link href="/auth/user/signin" passHref>
                <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#e51f48] to-[#ff4d6d] rounded-full text-white font-semibold hover:shadow-lg transition-all">
                  <User size={18} />
                  <span>Sign In</span>
                </button>
              </Link>
            </div>
          </div>
        </nav>
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
          {/* Left Section - Logo */}
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Image 
                src="/Fwaya Music Icon-01.png" 
                alt="Fwaya Music Logo" 
                width={36}
                height={36}
                className="rounded"
              />
              <span className="text-xl font-bold text-white">
                Fwaya<span className="text-[#e51f48]">Music</span>
              </span>
            </Link>
          </div>

          {/* Middle Section - Navigation & Search */}
          <div className="flex-1 max-w-2xl mx-6">
            <div className="flex items-center gap-4">
              {/* Navigation Links */}
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
              </div>

              {/* Search Bar */}
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search music, artists..."
                  className="w-full bg-[#0a1f29] bg-opacity-70 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#e51f48] text-white placeholder-gray-400"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search"
                />
              </div>
            </div>
          </div>

          {/* Right Section - User Actions */}
          <div className="flex items-center gap-3">
            {/* Quick Actions */}
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
              <button className="p-2 rounded-full hover:bg-[#0a3747]/50 text-white transition-colors touch-target group">
                <Share2 size={20} className="group-hover:scale-110 transition-transform" />
              </button>
            </div>

            {/* Notifications */}
            <button className="relative p-2 rounded-full hover:bg-[#0a3747]/50 text-white transition-colors touch-target group">
              <Bell size={22} className="group-hover:scale-110 transition-transform" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#e51f48] rounded-full border-2 border-[#0a3747]"></div>
            </button>

            {/* User Menu - KEEP THIS FOR LOGOUT */}
            <div className="relative">
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

              {/* Enhanced User Dropdown */}
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
      {/* Spacer for fixed navbar */}
      <div className="h-16"></div>
    </>
  );
}