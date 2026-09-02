"use client";
/* eslint-disable */

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "../components/Sidebar";
import MobileMenu from "../components/MobileMenu";
// MobileFooter removed — using BottomNav + Need Help modal instead
import Player from "../components/Player";
import MobilePlayer from "../components/MobilePlayer";
import PlaylistPickerModal from "../components/PlaylistPickerModal";
import NowPlayingPanel from "../components/NowPlayingPanel";
import BottomNav from "../components/BottomNav";
import Navbar from "../components/Navbar";
import VideoMiniPlayer from "../components/VideoMiniPlayer";
import { useAuth } from "../context/AuthContext";
import AuthErrorBanner from "../components/AuthErrorBanner";
import { useAudioPlayer } from "../hooks/useAudioPlayer";
import { isVideoTrack } from "@/lib/utils";
import { ServiceWorkerProvider } from "../components/ServiceWorkerProvider";
import SubscriptionModal from "../components/modal/SubscriptionModal";
import FreeUserAdBanner from "../components/FreeUserAdBanner";
import { MobileMoneyPaymentPreviewModal } from "../components/modal/MobileMoneyPaymentPreviewModal";
import SubscriptionPromptModal from "../components/SubscriptionPromptModal";

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const { user, loading, authError, clearAuthError, verificationError } = useAuth();
  const { currentTrack, isPlaying, togglePlay, playTrack, stopTrack, currentTime, duration, volume, isMuted, isLoading, seekTo, setVolume, toggleMute, nextTrack, previousTrack, toggleRepeat, repeatMode } = useAudioPlayer();
  const pathname = usePathname();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [playlistPickerOpen, setPlaylistPickerOpen] = useState(false);
  const [pickerMediaId, setPickerMediaId] = useState<number | null>(null);
  const [subscriptionOpen, setSubscriptionOpen] = useState(false);
  const [subscriptionPromptOpen, setSubscriptionPromptOpen] = useState(false);
  const hasActivePremium = Boolean(user?.isPremium && user.premiumUntil && new Date(user.premiumUntil) > new Date());
  const [payPerViewTrack, setPayPerViewTrack] = useState<any | null>(null);

  const isVideoWatchPage = currentTrack ? (isVideoTrack(currentTrack)
    && pathname?.startsWith('/videos/')
    && String(currentTrack.id) === pathname.split('/videos/')[1]) : false;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOpenPlaylistPicker = (event: Event) => {
      const customEvent = event as CustomEvent<Record<string, unknown>>;
      const mediaId = Number(customEvent.detail?.mediaId ?? customEvent.detail?.id ?? 0);
      if (!mediaId) return;
      setPickerMediaId(mediaId);
      setPlaylistPickerOpen(true);
    };

    window.addEventListener('fwaya:open-playlist-picker', handleOpenPlaylistPicker as EventListener);
    return () => {
      window.removeEventListener('fwaya:open-playlist-picker', handleOpenPlaylistPicker as EventListener);
    };
  }, []);

  useEffect(() => {
    const openPayPerView = (event: Event) => setPayPerViewTrack((event as CustomEvent).detail ?? null);
    window.addEventListener('fwaya:open-pay-per-view', openPayPerView);
    return () => window.removeEventListener('fwaya:open-pay-per-view', openPayPerView);
  }, []);

  useEffect(() => {
    const openSubscription = () => setSubscriptionOpen(true);
    window.addEventListener('fwaya:open-subscription', openSubscription);
    return () => window.removeEventListener('fwaya:open-subscription', openSubscription);
  }, []);

  useEffect(() => {
    if (loading || pathname?.startsWith('/auth') || pathname === '/premium') return;
    setSubscriptionPromptOpen(true);
  }, [loading, pathname]);

  return (
    <div className="w-full text-white bg-transparent lg:pt-14">
      <ServiceWorkerProvider />
      {/* Global auth error banner (shows verification and other auth errors) */}
      {(() => {
        const bannerError = authError ?? (verificationError ? { message: verificationError } : null);
        return <AuthErrorBanner error={bannerError} />;
      })()}
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
          <FreeUserAdBanner />
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
      <SubscriptionModal isOpen={subscriptionOpen} onClose={() => setSubscriptionOpen(false)} />
      <SubscriptionPromptModal
        isOpen={subscriptionPromptOpen && !hasActivePremium}
        isLoggedIn={Boolean(user)}
        onClose={() => setSubscriptionPromptOpen(false)}
        onSubscribe={() => {
          setSubscriptionPromptOpen(false);
          setSubscriptionOpen(true);
        }}
        onLogin={() => {
          setSubscriptionPromptOpen(false);
          window.location.href = '/auth/user/signin';
        }}
      />
      {payPerViewTrack && (
        <MobileMoneyPaymentPreviewModal
          isOpen
          onClose={() => setPayPerViewTrack(null)}
          media={{
            id: Number(payPerViewTrack.id),
            title: payPerViewTrack.title || 'Pay-per-view content',
            artist: payPerViewTrack.artist || 'Unknown artist',
            price: Number(payPerViewTrack.price || 0),
            currency: payPerViewTrack.currency || 'ZMW',
          }}
          onSuccess={() => {
            const purchasedTrack = payPerViewTrack;
            setPayPerViewTrack(null);
            if (purchasedTrack) playTrack(purchasedTrack);
          }}
        />
      )}

        {/* Mobile footer removed — replaced by BottomNav Need Help modal */}

      {/* =======================
          ▶️ PLAYER (BOTTOM - GLASS EFFECT)
      ======================== */}
      {currentTrack && (
        <div className="fixed bottom-0 left-0 right-0 z-30">
          {/* Mobile Player - audio only on small screens */}
          {!isVideoWatchPage && currentTrack && !isVideoTrack(currentTrack) && (
            <div className="lg:hidden">
              <MobilePlayer
                track={currentTrack}
                isPlaying={isPlaying}
                currentTime={currentTime}
                duration={duration}
                volume={volume}
                isMuted={isMuted}
                isLoading={isLoading}
                onPlayPause={togglePlay}
                onClose={stopTrack}
                onNext={nextTrack}
                onPrevious={previousTrack}
                onRepeat={toggleRepeat}
                repeatMode={repeatMode}
                onSeek={seekTo}
                onVolumeChange={setVolume}
                onToggleMute={toggleMute}
              />
            </div>
          )}
          
          {/* Desktop Player - shows on large screens */}
          <div className="hidden lg:block bg-black/80 backdrop-blur-xl border-t border-white/10">
            <Player
              track={currentTrack}
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={duration}
              volume={volume}
              isMuted={isMuted}
              isLoading={isLoading}
              onPlayPause={togglePlay}
              onClose={stopTrack}
              onNext={nextTrack}
              onPrevious={previousTrack}
              onRepeat={toggleRepeat}
              repeatMode={repeatMode}
              onSeek={seekTo}
              onVolumeChange={setVolume}
              onToggleMute={toggleMute}
            />
          </div>
        </div>
      )}

      <VideoMiniPlayer />

      <PlaylistPickerModal
        open={playlistPickerOpen}
        mediaId={pickerMediaId ?? 0}
        onClose={() => {
          setPlaylistPickerOpen(false);
          setPickerMediaId(null);
        }}
        onSuccess={() => {
          setPlaylistPickerOpen(false);
          setPickerMediaId(null);
        }}
      />
    </div>
  );
}
