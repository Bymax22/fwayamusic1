"use client";
import { PaymentProvider } from '../context/PaymentContext';
import "../globals.css";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { useState, useEffect } from "react";
import { ThemeProvider } from "../context/ThemeContext";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";



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
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a1f29]"
        >
          <div className="relative w-48 h-48">
            {/* Holographic Ring */}
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
              className="absolute inset-0 rounded-full border-2 border-opacity-20 border-[#e51f48]"
              style={{
                background: `conic-gradient(
                  from 0deg at 50% 50%,
                  rgba(229, 31, 72, 0) 0deg,
                  rgba(229, 31, 72, 0.3) 120deg,
                  rgba(229, 31, 72, 0) 240deg
                )`,
              }}
            />

            {/* Pulsing Core */}
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                boxShadow: [
                  '0 0 0 0 rgba(229, 31, 72, 0.4)',
                  '0 0 0 20px rgba(229, 31, 72, 0)',
                  '0 0 0 40px rgba(229, 31, 72, 0)'
                ]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeOut"
              }}
              className="absolute inset-0 m-auto w-24 h-24 rounded-full bg-gradient-to-br from-[#e51f48] to-[#ff4d6d] flex items-center justify-center"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-white">
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

            {/* Floating Particles */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{
                  opacity: [0, 0.8, 0],
                  x: Math.cos(i * 45 * (Math.PI / 180)) * 60,
                  y: Math.sin(i * 45 * (Math.PI / 180)) * 60,
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.1,
                  repeat: Infinity,
                  repeatDelay: 0.5
                }}
                className="absolute w-2 h-2 rounded-full bg-[#e51f48]"
              />
            ))}

            <motion.span 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="absolute bottom-0 left-0 right-0 text-center text-xl font-bold text-[#e51f48]"
            >
              Fwaya Music
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#e51f48]"></div>
      </div>
    );
  }

  return <>{children}</>;
};

const SidebarWithAuth = ({
  sidebarExpanded,
  sidebarOpen,
  setSidebarOpen,
  onSidebarHandleTouchStart,
  onSidebarHandleTouchMove,
  onSidebarHandleTouchEnd,
}: {
  sidebarExpanded: boolean;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  onSidebarHandleTouchStart?: (e: React.TouchEvent) => void;
  onSidebarHandleTouchMove?: (e: React.TouchEvent) => void;
  onSidebarHandleTouchEnd?: (e: React.TouchEvent) => void;
}) => {
  const { user } = useAuth();
  if (!user) return null;
  // Use user for accessibility and display
  return (
    <>
      {/* Sidebar handle for mobile */}
      {!sidebarExpanded && !sidebarOpen && (
        <div
          className="sidebar-handle"
          onClick={() => setSidebarOpen(true)}
          aria-label={`Open sidebar for ${user.displayName || user.username || "user"}`}
          title={user.displayName || user.username || "Open sidebar"}
          onTouchStart={onSidebarHandleTouchStart}
          onTouchMove={onSidebarHandleTouchMove}
          onTouchEnd={onSidebarHandleTouchEnd}
        >
          <div className="w-1 h-8 bg-gradient-to-b from-[#e51f48] to-[#ff4d6d] rounded-full" />
        </div>
      )}

      {/* Sidebar for desktop and mobile */}
      <aside
        id="sidebar"
        className={`sidebar fixed top-16 left-0 h-[calc(100vh-4rem)] z-40 transition-all duration-300 ease-in-out ${
          sidebarExpanded || sidebarOpen ? "w-56" : "w-16"
        } ${sidebarOpen ? "sidebar--open" : ""}`}
        style={{ display: sidebarExpanded || sidebarOpen ? undefined : "none" }}
      >
        {/* Show user info at the top of the sidebar */}
        <div className="flex items-center gap-2 p-4">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#e51f48] to-[#ff4d6d] flex items-center justify-center text-white font-bold">
            {user.displayName?.charAt(0) || user.username?.charAt(0) || "U"}
          </div>
          <span className="text-white font-medium truncate">{user.displayName || user.username}</span>
        </div>
        <Sidebar sidebarExpanded={sidebarExpanded || sidebarOpen} />
      </aside>
    </>
  );
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [nonce, setNonce] = useState<string | null>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touching, setTouching] = useState(false);
  const { user } = useAuth();
  // Responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarExpanded(false);
      } else {
        setSidebarExpanded(true);
        setSidebarOpen(false);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
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

  // Touch handlers for swipe sidebar (mobile)
  const handleSidebarHandleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setTouching(true);
  };

  const handleSidebarHandleTouchMove = (e: React.TouchEvent) => {
    if (!touching || touchStartX === null) return;
    const deltaX = e.touches[0].clientX - touchStartX;
    // If swipe right more than 40px, open sidebar
    if (deltaX > 40) {
      setSidebarOpen(true);
      setTouching(false);
      setTouchStartX(null);
    }
  };

  const handleSidebarHandleTouchEnd = () => {
    setTouching(false);
    setTouchStartX(null);
  };

const showSidebar = !!user && (sidebarExpanded || sidebarOpen);

  return (
    <ThemeProvider>
      <AuthProvider>
        <html lang="en" suppressHydrationWarning>
          <head>
            <title>FwayaMusic | Modern Music Experience</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <meta name="description" content="Discover and stream your favorite music" />
            <link rel="icon" href="/logo4.png" />
            {/* removed in-file CSP meta — CSP must be delivered by server headers (next.config.ts) */}
            {nonce && (
              <script
                nonce={nonce}
                dangerouslySetInnerHTML={{
                  __html: `console.log("Secure script execution enabled");`,
                }}
              />
            )}
          </head>
        <body className="bg-background text-foreground antialiased">
          <HolographicPreloader />
          <PaymentProvider>
            <AuthWrapper>
              <div className="flex flex-col h-screen">
                {/* Top Accent Bar */}
                <div style={{ backgroundColor: "rgb(var(--primary-accent))" }} className="w-full h-1 z-[9999]"></div>
                {/* Navbar */}
                <header className="fixed top-0 left-0 right-0 h-16 z-50">
                  <Navbar />
                </header>
                {/* Main content area */}
    <div className="flex flex-1">
      {user && (
        <SidebarWithAuth
          sidebarExpanded={sidebarExpanded}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          onSidebarHandleTouchStart={handleSidebarHandleTouchStart}
          onSidebarHandleTouchMove={handleSidebarHandleTouchMove}
          onSidebarHandleTouchEnd={handleSidebarHandleTouchEnd}
        />
      )}
<main
  className={`main-content flex-1 overflow-y-auto transition-all duration-300 ease-in-out ${
    showSidebar ? (sidebarExpanded ? "ml-56" : "ml-16") : "no-sidebar"
  }`}
>
  {children}
</main>
                
                </div>
              </div>
            </AuthWrapper>
          </PaymentProvider>
        </body>
      </html>
    </AuthProvider>
  </ThemeProvider>
);
}