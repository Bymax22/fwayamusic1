"use client";
import { UserPlus, Download, Music, DollarSign, Search, User, Bell, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";

interface NavbarProps {
  onPlayerOpen?: (track: any) => void;
}

export default function Navbar({ onPlayerOpen }: NavbarProps) {
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

  const navLinks = [
    { name: "Browse", href: "/browse", icon: <Music size={18} /> },
    { name: "Download", href: "/download", icon: <Download size={18} /> },
    { name: "Artists", href: "/auth/artist/signin", icon: <UserPlus size={18} /> },
    { name: "Reseller", href: "/auth/reseller/signin", icon: <DollarSign size={18} /> },
  ];

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
    router.push('/');
  };

  return (
    <>
      {/* Compact Main Navbar - No Menu Button */}
      <nav className={`fixed top-0 left-0 w-full h-12 transition-all duration-300 z-50 
        ${isScrolled ? "bg-[#0a3747] bg-opacity-95 backdrop-blur-lg" : "bg-[#0a3747] bg-opacity-90 backdrop-blur-md"}
        border-b border-[#0a3747]/30 shadow-lg`}
      >
        <div className="container mx-auto px-3 h-full flex items-center justify-between">
          {/* Left Section - Full Logo Only */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Image 
                src="/Fwaya Music Icon-01.png" 
                alt="Fwaya Music Logo" 
                width={32}
                height={32}
                className="rounded animate-pulse"
              />
              <span className="ml-2 text-lg font-bold text-white mobile-text-lg">
                Fwaya<span className="text-[#e51f48]">Music</span>
              </span>
            </Link>
          </div>

          {/* Middle Section - Compact Search */}
          <div className="flex-1 mx-2 max-w-xs">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search..."
                className="w-full bg-[#0a3747]/70 text-white rounded-full pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#e51f48] transition-all placeholder-gray-400 mobile-text-sm"
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
          </div>

          {/* Right Section - Compact Actions */}
          <div className="flex items-center space-x-1">
            {/* Desktop Navigation - Hidden on mobile */}
            <div className="hidden md:flex space-x-2">
              {navLinks.map((link) => (
                <Link key={link.name} href={link.href} passHref>
                  <button className={`relative py-1 px-1.5 text-xs font-medium transition-colors touch-target
                    ${pathname.startsWith(link.href) ? "text-white" : "text-gray-300 hover:text-white"}`}
                    aria-current={pathname.startsWith(link.href) ? "page" : undefined}
                  >
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
              className="p-1.5 rounded-full hover:bg-[#0a3747]/50 text-white transition-colors touch-target"
              aria-label="Notifications"
            >
              <Bell size={18} />
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
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#e51f48] to-[#ff4d6d] flex items-center justify-center">
                      <User size={12} className="text-white" />
                    </div>
                  )}
                  <span className="text-xs font-medium hidden sm:inline-block text-white mobile-text-xs">
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
                        <User size={14} className="mr-2" />
                        Profile
                      </Link>
                      
                      <Link href="/settings" className="flex items-center px-3 py-2 text-sm text-gray-300 hover:bg-[#0a3747]/50 hover:text-white mobile-text-sm">
                        <Settings size={14} className="mr-2" />
                        Settings
                      </Link>
                      
                      <button 
                        onClick={handleLogout}
                        className="flex items-center w-full px-3 py-2 text-sm text-gray-300 hover:bg-[#0a3747]/50 hover:text-white mobile-text-sm"
                      >
                        <LogOut size={14} className="mr-2" />
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link href="/auth/user/signin" passHref>
                <button 
                  className="flex items-center justify-center p-1.5 bg-[#0a3747]/70 rounded-full text-white hover:bg-[#0a3747] transition-all touch-target"
                  aria-label="Sign in"
                >
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#e51f48] to-[#ff4d6d] flex items-center justify-center">
                    <User size={12} className="text-white" />
                  </div>
                </button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Spacer for fixed navbar */}
      <div className="h-12"></div>
    </>
  );
}