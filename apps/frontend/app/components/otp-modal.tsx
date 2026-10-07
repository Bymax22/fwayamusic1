"use client";

import React from 'react';
import { FaTimes } from 'react-icons/fa';

interface Props {
  isOpen: boolean;
  email: string;
  otp: string;
  setOtp: (v: string) => void;
  onVerify: () => Promise<void>;
  onResend: () => Promise<void>;
  onClose: () => void;
  loading?: boolean;
  error?: string | null;
}

export default function OtpModal({ isOpen, email, otp, setOtp, onVerify, onResend, onClose, loading, error }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm px-4">
      <div className="relative bg-purple/85 rounded-[32px] p-6 sm:p-7 w-full max-w-md text-white z-10 shadow-[0_32px_120px_rgba(var(--primary-accent), 0.22)] border border-purple/30 max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-white/90 hover:text-white text-xl">
          <FaTimes />
        </button>

        <h3 className="text-xl sm:text-2xl font-semibold mb-2 text-white">Enter verification code</h3>
        <p className="text-sm sm:text-base text-white/90 mb-5">
          We&apos;ve sent a 6-digit code to <strong className="text-white">{email}</strong>. Enter it below to continue.
        </p>

        <input
          type="text"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
          maxLength={6}
          className="w-full text-2xl tracking-[0.4em] px-4 py-3 bg-background/60 border border-white/10 rounded-3xl text-white placeholder:text-white/40 placeholder:italic focus:outline-none focus:ring-2 focus:ring-purple/60 mb-3"
          placeholder="e.g. 123456"
          autoComplete="off"
        />

        {error && <p className="text-purple/60 text-sm sm:text-base mb-3">{error}</p>}

        <div className="flex gap-3 flex-col sm:flex-row">
          <button
            onClick={onVerify}
            disabled={loading || otp.length < 6}
            className="flex-1 px-4 py-3 bg-background text-white rounded-3xl border border-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-sm sm:text-base hover:bg-white/5"
          >
            {loading ? 'Verifying' : 'Verify Code'}
          </button>
          <button
            onClick={onResend}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-background text-white rounded-3xl border border-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-sm sm:text-base hover:bg-white/5"
          >
            Resend
          </button>
        </div>
      </div>
    </div>
  );
}
