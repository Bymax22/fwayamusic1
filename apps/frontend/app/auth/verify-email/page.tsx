"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaCheck, FaTimes, FaSpinner } from 'react-icons/fa';

type VerificationStatus = 'loading' | 'success' | 'error';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<VerificationStatus>('loading');
  const [message, setMessage] = useState('Redirecting you to Fwaya...');

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
    if (status === 'loading') {
      return <FaSpinner className="w-16 h-16 text-primary animate-spin mx-auto mb-4" />;
    }
    return <FaTimes className="w-16 h-16 text-primary mx-auto mb-4" />;
  };

  const getStatusColor = () => {
    return status === 'loading' ? 'text-white' : 'text-white';
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-background rounded-3xl p-8 w-full max-w-md shadow-2xl text-center">
        {getStatusIcon()}

        <h1 className={`text-2xl font-bold mb-4 ${getStatusColor()}`}>
          {status === 'loading' && 'Verifying Email...'}
          {status === 'success' && 'Email Verified!'}
          {status === 'error' && 'Verification Failed'}
        </h1>

        <p className="text-white/90 mb-6">
          {message}
        </p>

        {status === 'success' && (
          <p className="text-sm text-white/60">
            Redirecting you to your dashboard...
          </p>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <p className="text-sm text-white/60">
              If you need a new verification link, please sign in and request a new one.
            </p>
            <button
              onClick={() => router.push('/auth/signin')}
              className="w-full px-6 py-3 bg-card text-white rounded-xl hover:bg-primary transition-colors font-semibold"
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
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-background rounded-3xl p-8 w-full max-w-md shadow-2xl text-center">
          <FaSpinner className="w-16 h-16 text-purple/75 animate-spin mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4 text-purple/60">
            Loading...
          </h1>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}