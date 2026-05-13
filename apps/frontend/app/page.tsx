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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-[#0a1f29] to-[#0a3747]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a1f29] to-[#0a3747]">
        <GuestWelcome />
      </div>
    );
  }

  if (user.role === 'USER') {
    return <UserDashboard />;
  }
}




 