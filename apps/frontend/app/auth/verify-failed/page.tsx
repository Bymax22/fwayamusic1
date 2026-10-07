"use client";

import { useRouter } from 'next/navigation';
import { FaTimes, FaRedo } from 'react-icons/fa';

export default function VerifyFailed() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-background rounded-[32px] p-8 w-full max-w-md shadow-[0_28px_90px_rgba(var(--primary-accent), 0.18)] text-center">
        <FaTimes className="w-16 h-16 text-primary mx-auto mb-4" />

        <h1 className="text-3xl font-bold text-white mb-4">
          Verification Failed
        </h1>

        <p className="text-white/90 mb-6">
          The verification link is invalid, expired, or has already been used.
        </p>

        <div className="bg-background rounded-3xl p-4 mb-6">
          <h3 className="text-purple/45 font-semibold mb-2">What to do next:</h3>
          <ul className="text-sm text-white/90 text-left space-y-2">
            <li>• Sign in to your account</li>
            <li>• Request a new verification email</li>
            <li>• Check your spam/junk folder</li>
            <li>• Make sure you're using the latest link</li>
          </ul>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => router.push('/auth/signin')}
            className="w-full px-6 py-3 bg-gradient-to-r from-primary to-primary text-white rounded-3xl hover:opacity-95 transition-all font-semibold flex items-center justify-center gap-2"
          >
            <FaRedo className="w-4 h-4" />
            Sign In & Request New Link
          </button>

          <button
            onClick={() => router.push('/')}
            className="w-full px-6 py-3 bg-background text-purple/30 rounded-3xl hover:bg-background transition-colors"
          >
            Go to Landing Page
          </button>
        </div>
      </div>
    </div>
  );
}