"use client";

import { Crown, LogIn, X } from 'lucide-react';

interface SubscriptionPromptModalProps {
  isOpen: boolean;
  isLoggedIn: boolean;
  onClose: () => void;
  onSubscribe: () => void;
  onLogin: () => void;
}

export default function SubscriptionPromptModal({
  isOpen,
  isLoggedIn,
  onClose,
  onSubscribe,
  onLogin,
}: SubscriptionPromptModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[65] flex items-start justify-center bg-black/45 px-4 pt-20 backdrop-blur-[2px] sm:pt-24">
      <div className="relative w-full max-w-sm rounded-2xl border border-purple-400/20 bg-[#151522] p-5 text-white shadow-2xl shadow-black/40">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close subscription offer"
          className="absolute right-3 top-3 rounded-full p-1.5 text-white/50 transition hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-start gap-3 pr-5">
          <div className="rounded-xl bg-purple-500/15 p-2.5 text-purple-300">
            <Crown className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Make more of Fwaya</h2>
            <p className="mt-1 text-sm leading-5 text-white/60">
              Enjoy premium listening with no sponsored ads and access to premium tracks.
            </p>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          {isLoggedIn ? (
            <button
              type="button"
              onClick={onSubscribe}
              className="flex-1 rounded-xl bg-purple-600 px-3 py-2.5 text-sm font-semibold transition hover:bg-purple-500"
            >
              Subscribe
            </button>
          ) : (
            <button
              type="button"
              onClick={onLogin}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-3 py-2.5 text-sm font-semibold transition hover:bg-purple-500"
            >
              <LogIn className="h-4 w-4" /> Sign in to subscribe
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 px-3 py-2.5 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}