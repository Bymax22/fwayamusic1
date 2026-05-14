"use client";

import { useRouter } from 'next/navigation';
import { FaTimes, FaRedo } from 'react-icons/fa';

export default function VerifyFailed() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1f29] to-[#0a3747] flex items-center justify-center p-4">
      <div className="bg-white/5 border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl text-center">
        <FaTimes className="w-16 h-16 text-red-500 mx-auto mb-4" />

        <h1 className="text-2xl font-bold text-red-400 mb-4">
          Verification Failed
        </h1>

        <p className="text-gray-300 mb-6">
          The verification link is invalid, expired, or has already been used.
        </p>

        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-6">
          <h3 className="text-yellow-400 font-semibold mb-2">What to do next:</h3>
          <ul className="text-sm text-gray-300 text-left space-y-1">
            <li>• Sign in to your account</li>
            <li>• Request a new verification email</li>
            <li>• Check your spam/junk folder</li>
            <li>• Make sure you're using the latest link</li>
          </ul>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => router.push('/auth/signin')}
            className="w-full px-6 py-3 bg-[#e51f48] text-white rounded-xl hover:bg-[#ff4d6d] transition-colors font-semibold flex items-center justify-center gap-2"
          >
            <FaRedo className="w-4 h-4" />
            Sign In & Request New Link
          </button>

          <button
            onClick={() => router.push('/')}
            className="w-full px-6 py-3 border border-white/20 text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    </div>
  );
}