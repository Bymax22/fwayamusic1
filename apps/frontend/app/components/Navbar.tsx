"use client";

import Link from "next/link";
import { User, ChevronDown, Settings, Crown } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Image from "next/image";
import NotificationBell from "./NotificationBell";

export default function Navbar({ currentTrack }: { currentTrack: any }) {
  const { user } = useAuth();

  return (
    <nav className="hidden lg:flex fixed top-0 left-0 right-0 w-full h-14 items-center bg-[#0f0f2a]/60 backdrop-blur-xl border-b border-white/10 z-50">
      <div className="flex items-center w-full h-full max-w-7xl mx-auto">
        <div className="w-[260px] flex items-center h-full px-6 border-r border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Image
                src="/Fwaya Innovations icon-01.png"
                alt="Fwaya Logo"
                width={40}
                height={40}
                className="rounded-lg"
              />
              <span className="font-bold text-xl">Fwaya</span>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center h-full px-6">
          <div className="flex-1 max-w-2xl">
            <input
              type="text"
              placeholder="Search for songs, artists or albums..."
              className="search-box w-full"
            />
          </div>
        </div>

        <div className="w-[340px] flex items-center h-full justify-end px-6 gap-4">
          <NotificationBell />
          <Link href="/settings" className="text-gray-400 hover:text-white transition" aria-label="Settings">
            <Settings size={20} />
          </Link>
          {/* Premium CTA: full button for guests, icon-only stroke for logged-in users */}
          {user ? (
            <Link href="/premium" aria-label="Premium" className="p-2 rounded-full border border-purple-500 text-purple-500 hover:bg-purple-500/10 transition mr-2">
              <Crown size={18} />
            </Link>
          ) : (
            <Link href="/premium" className="px-4 py-2 bg-purple-600 rounded-full text-sm font-medium hover:bg-purple-700 transition mr-2">
              Go Premium
            </Link>
          )}
          {user ? (
            <div className="flex items-center gap-2 cursor-pointer hover:bg-white/10 px-3 py-1.5 rounded-full transition">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <User size={16} />
              </div>
              <span className="text-sm font-medium hidden xl:inline">
                {user.displayName || user.username || "John Doe"}
              </span>
              <ChevronDown size={16} className="hidden xl:block" />
            </div>
          ) : (
            <button className="px-4 py-2 bg-purple-600 rounded-full text-sm font-medium hover:bg-purple-700 transition">
              Sign In
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}