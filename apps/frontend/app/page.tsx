// app/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import GuestWelcome from "@/components/GuestWelcome";
import UserDashboard from "./dashboard/page";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect authenticated users to their appropriate dashboard
  useEffect(() => {
    if (user && !loading) {
      switch (user.role) {
        case 'ARTIST':
          router.push('/for-artists');
          break;
        case 'RESELLER':
          router.push('/reseller-dashboard');
          break;
        case 'ADMIN':
        case 'MODERATOR':
          router.push('/admin');
          break;
        default:
          // USER role stays on home page which shows UserDashboard
          break;
      }
    }
  }, [user, loading, router]);

  // If user is not authenticated, show guest welcome page
  if (!user && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a1f29] to-[#0a3747]">
        <GuestWelcome />
      </div>
    );
  }

  // If user is authenticated and is a regular USER, show user dashboard
  if (user && user.role === 'USER') {
     return <UserDashboard />;
  }

  // Loading state
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1f29] to-[#0a3747] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#e51f48] mx-auto mb-4"></div>
        <p className="text-gray-400">Loading your experience...</p>
      </div>
    </div>
  );
}




 