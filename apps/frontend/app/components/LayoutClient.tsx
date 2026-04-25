"use client";
/* eslint-disable */

import { useState } from "react";
import Sidebar from "../components/Sidebar";
import MobileMenu from "../components/MobileMenu";
import Player from "../components/Player";
import NowPlayingPanel from "../components/NowPlayingPanel";
import BottomNav from "../components/BottomNav";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { useAudioPlayer } from "../hooks/useAudioPlayer";

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { currentTrack, isPlaying, togglePlay, setCurrentTrack } = useAudioPlayer();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  return (
    <div className="w-full text-white bg-transparent lg:pt-14">
      <Navbar currentTrack={currentTrack} />

      {/* =======================
          🧱 MAIN LAYOUT GRID
      ======================== */}
      <div className="flex w-full">

        {/* =======================
            📌 SIDEBAR (LEFT) - DESKTOP
        ======================== */}
        {user && (
          <div className="hidden lg:flex fixed left-0 top-14 h-[calc(100%-56px)] w-[260px] bg-[#0f0f2a]/60 backdrop-blur-xl border-r border-white/10 z-20">
            <Sidebar sidebarExpanded={sidebarExpanded} />
          </div>
        )}

        {/* =======================
            🎧 MAIN CONTENT (CENTER)
        ======================== */}
        <main
          className={`
            flex-1 overflow-y-auto scrollbar-hide
            ${currentTrack ? "pb-40" : ""}
            transition-all duration-300
            ${user ? "lg:ml-[260px]" : ""}
            ${currentTrack ? "lg:mr-[340px]" : ""}
          `}
        >

          {children}
        </main>

        {/* =======================
            🎶 NOW PLAYING (RIGHT) - DESKTOP
        ======================== */}
        {currentTrack && (
          <div className="hidden lg:block fixed right-0 top-14 h-[calc(100%-56px)] w-[340px] bg-[#0f0f2a]/60 backdrop-blur-xl border-l border-white/10 z-20">
            <NowPlayingPanel
              track={currentTrack}
              isPlaying={isPlaying}
              onPlayPause={togglePlay}
            />
          </div>
        )}
      </div>


      {/* =======================
          📱 BOTTOM NAVIGATION
      ======================== */}
      <BottomNav onMoreClick={() => setMobileMenuOpen(true)} />

      {/* =======================
          📱 MOBILE MENU
      ======================== */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* =======================
          ▶️ PLAYER (BOTTOM - GLASS EFFECT)
      ======================== */}
      {currentTrack && (
        <div className="fixed bottom-0 left-0 right-0 z-30">
          <div className="bg-black/80 backdrop-blur-xl border-t border-white/10">
            <Player
              track={currentTrack}
              isPlaying={isPlaying}
              onPlayPause={togglePlay}
              onClose={() => setCurrentTrack(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
