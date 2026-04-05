"use client";
/* eslint-disable */
import { PaymentProvider } from '../context/PaymentContext';
import "../globals.css";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import MobileMenu from "../components/MobileMenu";
import { useState, useEffect } from "react";
import { ThemeProvider } from "../context/ThemeContext";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import Player from "../components/Player";
import { useAudioPlayer } from "../hooks/useAudioPlayer";
const HolographicPreloader = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
        >
          <div className="relative w-32 h-32">
            <motion.div
              animate={{
                rotate: 360,
                scale: [1, 1.1, 1],
              }}
              transition={{
                rotate: {
                  duration: 8,
                  repeat: Infinity,
                  ease: "linear",
                },
                scale: {
                  duration: 3,
                  repeat: Infinity,
                  repeatType: "reverse",
                },
              }}
              className="absolute inset-0 rounded-full border-2 border-opacity-20 border-[#ce7f16]"
              style={{
                background: `conic-gradient(
                  from 0deg at 50% 50%,
                  rgba(206, 127, 22, 0) 0deg,
                  rgba(206, 127, 22, 0.3) 120deg,
                  rgba(206, 127, 22, 0) 240deg
                )`,
              }}
            />
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                boxShadow: [
                  '0 0 0 0 rgba(229, 31, 72, 0.4)',
                  '0 0 0 15px rgba(229, 31, 72, 0)',
                  '0 0 0 30px rgba(229, 31, 72, 0)'
                ]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeOut"
              }}
              className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-gradient-to-br from-[#ce7f16] to-[#240e47] flex items-center justify-center"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white">
                <path 
                  d="M12 3V18M9 5V16M15 7V18M18 9V16" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round"
                />
                <path
                  d="M6 18C6 15.7909 7.79086 14 10 14C12.2091 14 14 15.7909 14 18C14 20.2091 12.2091 22 10 22C7.79086 22 6 20.2091 6 18Z"
                  fill="currentColor"
                />
              </svg>
            </motion.div>
            <motion.span 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="absolute -bottom-6 left-0 right-0 text-center text-sm font-bold text-[#ce7f16]"
            >
              Loading your experience
            </motion.span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const AuthWrapper = ({ children }: { children: React.ReactNode }) => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
        <div className="relative w-32 h-32">
          <motion.div
            animate={{
              rotate: 360,
              scale: [1, 1.1, 1],
            }}
            transition={{
              rotate: {
                duration: 8,
                repeat: Infinity,
                ease: "linear",
              },
              scale: {
                duration: 3,
                repeat: Infinity,
                repeatType: "reverse",
              },
            }}
            className="absolute inset-0 rounded-full border-2 border-opacity-20 border-[#ce7f16]"
            style={{
              background: `conic-gradient(
                from 0deg at 50% 50%,
                rgba(206, 127, 22, 0) 0deg,
                rgba(206, 127, 22, 0.3) 120deg,
                rgba(206, 127, 22, 0) 240deg
              )`,
            }}
          />
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              boxShadow: [
                '0 0 0 0 rgba(229, 31, 72, 0.4)',
                '0 0 0 15px rgba(229, 31, 72, 0)',
                '0 0 0 30px rgba(229, 31, 72, 0)'
              ]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeOut"
            }}
            className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-gradient-to-br from-[#ce7f16] to-[#240e47] flex items-center justify-center"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white">
              <path 
                d="M12 3V18M9 5V16M15 7V18M18 9V16" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round"
              />
              <path
                d="M6 18C6 15.7909 7.79086 14 10 14C12.2091 14 14 15.7909 14 18C14 20.2091 12.2091 22 10 22C7.79086 22 6 20.2091 6 18Z"
                fill="currentColor"
              />
            </svg>
          </motion.div>
          <motion.span 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="absolute -bottom-6 left-0 right-0 text-center text-sm font-bold text-[#ce7f16]"
          >
            Loading your experience
          </motion.span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};


const SidebarWithAuth = ({ sidebarExpanded }: { sidebarExpanded: boolean }) => {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <aside
      id="sidebar"
      className={`sidebar fixed top-0 left-0 h-screen z-40 transition-all duration-300 ease-in-out ${sidebarExpanded ? "w-56" : "w-14"}`}
      style={{ display: sidebarExpanded ? undefined : "none" }}
    >
      <div className="flex items-center gap-2 p-3 border-b border-white/10">
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#ce7f16] to-[#240e47] flex items-center justify-center text-white text-xs font-bold">
          {(user.role === 'ARTIST' ? (user.artistName || user.stageName || user.displayName || user.username) : (user.displayName || user.username))?.charAt(0) || "U"}
        </div>
        <span className="text-white text-sm font-medium truncate mobile-text-sm">
          {user.role === 'ARTIST' ? (user.artistName || user.stageName || user.displayName || user.username) : (user.displayName || user.username)}
        </span>
      </div>
      <Sidebar sidebarExpanded={sidebarExpanded} />
    </aside>
  );
};

// Add this interface for player state
interface Track {
  id: string | number;
  title?: string;
  artist?: string;
  imageUrl?: string;
  audioUrl?: string;
  [key: string]: unknown;
}

interface PlayerState {
  isOpen: boolean;
  track: Track | null;
  isPlaying: boolean;
}

const LayoutContent = ({ children }: { children: React.ReactNode }) => {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [nonce, setNonce] = useState<string | null>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touching, setTouching] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const { currentTrack, isPlaying, togglePlay, setCurrentTrack } = useAudioPlayer();
  const [bottomHeaderOpenOverride, setBottomHeaderOpenOverride] = useState(false);

  // Responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarExpanded(false);
      } else {
        setSidebarExpanded(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Listen for player events to open/close bottom header when minimized
  useEffect(() => {
    const handler = (e: any) => {
      const open = e?.detail?.open;
      setBottomHeaderOpenOverride(!!open);
    };
    window.addEventListener("player:openBottomHeader", handler);
    return () => window.removeEventListener("player:openBottomHeader", handler);
  }, []);

  // Listen for mobile menu open events
  useEffect(() => {
    const handler = () => {
      setIsMobileMenuOpen(true);
    };
    window.addEventListener("mobileMenu:open", handler);
    return () => window.removeEventListener("mobileMenu:open", handler);
  }, []);

  // Fetch nonce for CSP
  useEffect(() => {
    const fetchNonce = async () => {
      try {
        const response = await fetch("/api/generate-nonce");
        if (!response.ok) throw new Error(`Failed to fetch nonce: ${response.statusText}`);
        const data = await response.json();
        setNonce(data.nonce);
      } catch (error) {
        console.error("Failed to fetch nonce:", error);
        setNonce(null);
      }
    };
    fetchNonce();
  }, []);

  // Remove swipe/touch logic for sidebar
  const showSidebar = !!user && sidebarExpanded;

  // Mobile menu handlers
  const handleMobileMenuOpen = () => {
    setIsMobileMenuOpen(true);
  };

  const handleMobileMenuClose = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="bg-background text-foreground antialiased">
          <HolographicPreloader />
          <PaymentProvider>
            <AuthWrapper>
              <div className="flex flex-col h-screen">
                {/* Top Accent Bar - Made thinner */}
                <div style={{ backgroundColor: "rgb(var(--primary-accent))" }} className="w-full h-0.5 z-[9999]"></div>
                
                {/* Compact Navbar */}
                <Navbar />
                
                {/* Main content area */}
                <div className="flex flex-1"> {/* Navbar is fixed; spacing handled by .main-content margin-top */}
                  {user && (
                    <SidebarWithAuth sidebarExpanded={sidebarExpanded} />
                  )}
                  
                  <main
                    className={`main-content flex-1 overflow-y-auto transition-all duration-300 ease-in-out ${
                      showSidebar ? (sidebarExpanded ? "ml-56" : "ml-14") : "no-sidebar"
                    }`}
                    style={{ 
                      paddingBottom: currentTrack && !bottomHeaderOpenOverride ? '1.5rem' : '3.5rem',
                      transition: 'padding-bottom 0.3s ease'
                    }}
                  >
                    {children}
                  </main>
                </div>

                {/* Mobile Menu - Beautiful glassmorphic popup */}
                <MobileMenu 
                  isOpen={isMobileMenuOpen}
                  onClose={handleMobileMenuClose}
                />

                {/* Player - Now with auto-hide functionality */}
                {currentTrack && (
                  <Player
                    track={{
                      ...currentTrack,
                      imageUrl: currentTrack.imageUrl || currentTrack.coverArt,
                      audioUrl: currentTrack.audioUrl || currentTrack.url,
                    }}
                    isPlaying={isPlaying}
                    onPlayPause={togglePlay}
                    onClose={() => {
                      setCurrentTrack(null);
                    }}
                  />
                )}
              </div>
            </AuthWrapper>
          </PaymentProvider>
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  return <LayoutContent>{children}</LayoutContent>;
}




