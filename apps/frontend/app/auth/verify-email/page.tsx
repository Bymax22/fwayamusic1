"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaCheck, FaTimes, FaSpinner } from 'react-icons/fa';

type VerificationStatus = 'loading' | 'success' | 'error' | 'expired';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<VerificationStatus>('loading');
  const [message, setMessage] = useState('');
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      const callbackUrl = searchParams.get('callbackUrl');

      if (!token) {
        setStatus('error');
        setMessage('No verification token provided');
        return;
      }

      const backendUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!backendUrl) {
        setStatus('error');
        setMessage('Server configuration missing. Please try again later.');
        return;
      }

      const verifyUrl = `${backendUrl.replace(/\/$/, '')}/api/v1/auth/verify-email?token=${encodeURIComponent(token)}${callbackUrl ? `&redirect=${encodeURIComponent(callbackUrl)}` : ''}`;
      window.location.href = verifyUrl;
    };

    verifyEmail();
  }, [searchParams, router]);

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <FaSpinner className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />;
      case 'success':
        return <FaCheck className="w-16 h-16 text-green-500 mx-auto mb-4" />;
      case 'error':
        return <FaTimes className="w-16 h-16 text-red-500 mx-auto mb-4" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return 'text-blue-400';
      case 'success':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1f29] to-[#0a3747] flex items-center justify-center p-4">
      <div className="bg-white/5 border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl text-center">
        {getStatusIcon()}

        <h1 className={`text-2xl font-bold mb-4 ${getStatusColor()}`}>
          {status === 'loading' && 'Verifying Email...'}
          {status === 'success' && 'Email Verified!'}
          {status === 'error' && 'Verification Failed'}
        </h1>

        <p className="text-gray-300 mb-6">
          {message}
        </p>

        {status === 'success' && (
          <p className="text-sm text-gray-400">
            Redirecting you to your dashboard...
          </p>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-400">
              If you need a new verification link, please sign in and request a new one.
            </p>
            <button
              onClick={() => router.push('/auth/signin')}
              className="w-full px-6 py-3 bg-[#e51f48] text-white rounded-xl hover:bg-[#ff4d6d] transition-colors font-semibold"
            >
              Go to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmail() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-[#0a1f29] to-[#0a3747] flex items-center justify-center p-4">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl text-center">
          <FaSpinner className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4 text-blue-400">
            Loading...
          </h1>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}