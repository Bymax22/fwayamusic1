"use client";
/* eslint-disable */
import { UserPlus, Download, Music, DollarSign, Search, User, Bell, LogOut, Settings } from "lucide-react";
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

  // Hide navbar for guest users — show only when logged in
  if (!user) return null;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Browse", href: "/browse", icon: <Music size={22} /> },
    { name: "Download", href: "/download", icon: <Download size={22} /> },
    { name: "Artists", href: "/auth/artist/signin", icon: <UserPlus size={22} /> },
    { name: "Reseller", href: "/auth/reseller/signin", icon: <DollarSign size={22} /> },
  ];

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
    router.push('/');
  };

  return (
    <>
      {/* Compact Main Navbar - No Menu Button */}
      <nav className={`fixed top-0 left-0 w-full h-16 transition-all duration-300 z-50 
        ${isScrolled ? "bg-[#0a3747] bg-opacity-95 backdrop-blur-lg" : "bg-[#0a3747] bg-opacity-90 backdrop-blur-md"}
        border-b border-[#0a3747]/30 shadow-lg`}
      >
        <div className="container mx-auto px-3 h-full flex items-center justify-between">
          {/* Left Section - Full Logo Only */}
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center">
              <Image 
                src="/Fwaya Music Icon-01.png" 
                alt="Fwaya Music Logo" 
                width={36}
                height={36}
                className="rounded animate-pulse"
              />
              <span className="ml-2 text-xl font-bold text-white mobile-text-lg">
                Fwaya<span className="text-[#e51f48]">Music</span>
              </span>
            </Link>
          </div>

          {/* Middle Section - Compact Search */}
          <div className="relative flex-1 max-w-xs mx-2">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search..."
              className="w-full bg-[#0a1f29] bg-opacity-70 rounded-full py-2 pl-8 pr-3 text-base focus:outline-none focus:ring-1 focus:ring-[#e51f48] text-white placeholder-gray-400 mobile-text-base"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search"
            />
            {searchQuery && (
              <button 
                className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            )}
          </div>

          {/* Right Section - Compact Actions */}
          <div className="flex items-center gap-2">
            {/* Desktop Navigation - Hidden on mobile */}
            <div className="hidden md:flex space-x-2">
              {navLinks.map((link) => (
                <Link key={link.name} href={link.href} passHref>
                  <button className={`relative py-1 px-1.5 text-xs font-medium transition-colors touch-target
                    ${pathname.startsWith(link.href) ? "text-white" : "text-gray-300 hover:text-white"}`}
                    aria-current={pathname.startsWith(link.href) ? "page" : undefined}
                  >
                    {link.icon}
                    {link.name}
                    {pathname.startsWith(link.href) && (
                      <motion.div 
                        className="absolute bottom-0 left-0 w-full h-0.5 bg-[#e51f48]"
                        layoutId="navIndicator"
                      />
                    )}
                  </button>
                </Link>
              ))}
            </div>
            {/* Notifications */}
            <button
              className="p-2 rounded-full hover:bg-[#0a3747]/50 text-white transition-colors touch-target"
              aria-label="Notifications"
            >
              <Bell size={22} />
            </button>
            {/* User Menu or Auth Button */}
            {user ? (
              <div className="relative">
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-1.5 p-1 bg-[#0a3747]/70 rounded-full hover:bg-[#0a3747] transition-all touch-target"
                >
                  {user.avatarUrl ? (
                    <Image
                      src={user.avatarUrl}
                      alt={user.displayName || user.username}
                      width={24}
                      height={24}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#e51f48] to-[#ff4d6d] flex items-center justify-center">
                      <User size={16} className="text-white" />
                    </div>
                  )}
                  <span className="text-sm font-medium hidden sm:inline-block text-white mobile-text-sm">
                    {user.displayName || user.username}
                  </span>
                </button>
                {/* Compact User Dropdown */}
                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute top-full right-0 mt-1 w-40 bg-[#0a3747] border border-[#0a3747] rounded-lg shadow-lg py-1 z-50"
                    >
                      <div className="px-3 py-2 border-b border-[#0a3747]">
                        <p className="text-sm font-medium text-white mobile-text-sm">{user.displayName || user.username}</p>
                        <p className="text-xs text-gray-400 mobile-text-xs truncate">{user.email}</p>
                      </div>
                      <Link href="/profile" className="flex items-center px-3 py-2 text-sm text-gray-300 hover:bg-[#0a3747]/50 hover:text-white mobile-text-sm">
                        <User size={18} className="mr-2" />
                        Profile
                      </Link>
                      <Link href="/settings" className="flex items-center px-3 py-2 text-sm text-gray-300 hover:bg-[#0a3747]/50 hover:text-white mobile-text-sm">
                        <Settings size={18} className="mr-2" />
                        Settings
                      </Link>
                      <button 
                        onClick={handleLogout}
                        className="flex items-center w-full px-3 py-2 text-sm text-gray-300 hover:bg-[#0a3747]/50 hover:text-white mobile-text-sm"
                      >
                        <LogOut size={18} className="mr-2" />
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link href="/auth/user/signin" passHref>
                <button 
                  className="flex items-center justify-center p-2 bg-[#0a3747]/70 rounded-full text-white hover:bg-[#0a3747] transition-all touch-target"
                  aria-label="Sign in"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#e51f48] to-[#ff4d6d] flex items-center justify-center">
                    <User size={16} className="text-white" />
                  </div>
                </button>
              </Link>
            )}
          </div>
        </div>
      </nav>
      {/* Spacer for fixed navbar */}
      <div className="h-16"></div>
    </>
  );
}