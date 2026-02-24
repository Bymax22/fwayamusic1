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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-[#0a1f29] rounded-lg p-6 w-full max-w-md text-white z-10 border border-purple-500/30">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-300 hover:text-white">
          <FaTimes />
        </button>

        <h3 className="text-xl font-semibold mb-2">Enter verification code</h3>
        <p className="text-sm text-gray-300 mb-4">We&apos;ve sent a 6-digit code to <strong>{email}</strong>. Enter it below to continue.</p>

        <input
          type="text"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
          maxLength={6}
          className="w-full text-center text-2xl tracking-widest px-4 py-3 bg-[#07121a] border border-purple-500/40 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 mb-3"
          placeholder="123456"
        />

        {error && <p className="text-red-400 text-sm mb-2">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={onVerify}
            disabled={loading || otp.length < 6}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-white disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify Code'}
          </button>
          <button
            onClick={onResend}
            disabled={loading}
            className="px-4 py-2 bg-transparent border border-purple-500/40 rounded-lg text-white"
          >
            Resend
          </button>
        </div>
      </div>
    </div>
  );
}
