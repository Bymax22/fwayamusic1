"use client";
import { UserPlus, Download, Music, DollarSign, Search, Menu, X, Headphones, User, Bell, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
    { name: "Browse", href: "/browse", icon: <Music size={20} /> },
    { name: "Download", href: "/download", icon: <Download size={20} /> },
    { name: "Artists", href: "/auth/artist/signin", icon: <UserPlus size={20} /> },
    { name: "Reseller", href: "/auth/reseller/signin", icon: <DollarSign size={20} /> },
  ];

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
    // redirect to guest welcome (home)
    router.push('/');
  };

  return (
    <>
      {/* Main Navbar */}
      <nav className={`fixed top-0 left-0 w-full h-16 transition-all duration-300 z-50 
        ${isScrolled ? "bg-[#0a3747] bg-opacity-95 backdrop-blur-lg" : "bg-[#0a3747] bg-opacity-90 backdrop-blur-md"}
        border-b border-[#0a3747]/30 shadow-lg`}
      >
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          {/* Left Section - Logo and Mobile Menu */}
          <div className="flex items-center space-x-3 md:space-x-4">
            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2 text-white rounded-full hover:bg-[#0a3747]/50 transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Logo */}
            <Link href="/" className="flex items-center">
              <Image 
                src="/Fwaya Music Icon-01.png" 
                alt="Fwaya Music Logo" 
                width={32}
                height={32}
              />
              <span className="ml-2 text-lg font-bold text-white hidden sm:block">
                Fwaya<span className="text-[#e51f48]">Music</span>
              </span>
            </Link>
          </div>

          {/* Middle Section - Search (Visible on all screens) */}
          <div className="flex-1 mx-2 sm:mx-4 max-w-2xl">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search artists, songs, albums..."
                className="w-full bg-[#0a3747]/70 text-white rounded-full pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#e51f48] transition-all placeholder-gray-400"
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
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Desktop Navigation Tabs - Hidden on mobile */}
            <div className="hidden md:flex space-x-4">
              {navLinks.map((link) => (
                <Link key={link.name} href={link.href} passHref>
                  <button className={`relative py-1 px-2 text-sm font-medium transition-colors
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
<button
  className="p-2 rounded-full hover:bg-[#0a3747]/50 text-white transition-colors"
  aria-label="Notifications"
>
  <Bell size={20} />
</button>
            {/* User Menu or Auth Button */}
            {user ? (
              <div className="relative">
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1 bg-[#0a3747]/70 rounded-full hover:bg-[#0a3747] transition-all"
                >
                  {user.avatarUrl ? (
                    <Image
                      src={user.avatarUrl}
                      alt={user.displayName || user.username}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#e51f48] to-[#ff4d6d] flex items-center justify-center">
                      <User size={16} className="text-white" />
                    </div>
                  )}
                  <span className="text-sm font-medium hidden sm:inline-block text-white">
                    {user.displayName || user.username}
                  </span>
                </button>

                {/* User Dropdown Menu */}
                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full right-0 mt-2 w-48 bg-[#0a3747] border border-[#0a3747] rounded-lg shadow-lg py-2 z-50"
                    >
                      <div className="px-4 py-2 border-b border-[#0a3747]">
                        <p className="text-sm font-medium text-white">{user.displayName || user.username}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                      
                      <Link href="/profile" className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-[#0a3747]/50 hover:text-white">
                        <User size={16} className="mr-3" />
                        Profile
                      </Link>
                      
                      <Link href="/settings" className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-[#0a3747]/50 hover:text-white">
                        <Settings size={16} className="mr-3" />
                        Settings
                      </Link>
                      
                      <button 
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-[#0a3747]/50 hover:text-white"
                      >
                        <LogOut size={16} className="mr-3" />
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link href="/auth/user/signin" passHref>
                <button 
                  className="flex items-center justify-center p-2 bg-[#0a3747]/70 rounded-full text-white hover:bg-[#0a3747] transition-all sm:px-3 sm:py-1.5 sm:space-x-1"
                  aria-label="Sign in"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#e51f48] to-[#ff4d6d] flex items-center justify-center">
                    <User size={14} className="text-white" />
                  </div>
                  <span className="text-sm font-medium hidden sm:inline-block">Sign In</span>
                </button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-16 left-0 right-0 bg-[#0a3747] shadow-lg z-40 md:hidden border-t border-[#0a3747]/50"
            aria-hidden={!isMobileMenuOpen}
          >
            <div className="container mx-auto px-4 py-3">
              {/* Mobile Navigation Links */}
              <div className="space-y-2">
                {navLinks.map((link) => (
                  <Link key={link.name} href={link.href} passHref>
                    <button 
                      className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors
                        ${pathname.startsWith(link.href) ? "bg-[#e51f48] text-white" : "text-gray-300 hover:bg-[#0a3747]/70 hover:text-white"}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      aria-current={pathname.startsWith(link.href) ? "page" : undefined}
                    >
                      <span className="mr-3">{link.icon}</span>
                      {link.name}
                    </button>
                  </Link>
                ))}
              </div>

              {/* Mobile Auth CTA */}
              {!user && (
                <div className="mt-4 flex space-x-3">
                  <Link href="/auth" className="flex-1" passHref>
                    <button 
                      className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-br from-[#e51f48] to-[#ff4d6d] text-white font-medium rounded-lg"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <User size={16} className="mr-2" />
                      Sign In
                    </button>
                  </Link>
                </div>
              )}

              {/* Additional mobile-only features */}
              <div className="mt-4 pt-4 border-t border-[#0a3747]/50">
                <button className="w-full flex items-center px-4 py-3 text-gray-300 hover:text-white rounded-lg">
                  <Headphones size={16} className="mr-3" />
                  Offline Mode
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer to account for fixed navbar */}
      <div className="h-16"></div>
    </>
  );
}