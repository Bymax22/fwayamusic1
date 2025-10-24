// app/auth/reseller/signin/page.tsx
"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { FaGoogle, FaFacebook, FaEye, FaEyeSlash, FaStore } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ResellerSignIn() {
  const router = useRouter();
  const { signIn, signInWithGoogle, signInWithFacebook, loading, verifyOTP, sendOTP } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    otp: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [otpSent, setOtpSent] = useState(false);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await signIn(formData.email, formData.password, 'RESELLER');
      // Send OTP for additional verification
      await sendOTP('email', formData.email);
      setOtpSent(true);
      setStep('otp');
    } catch (error: unknown) {
        console.error('handleCredentialsSubmit error', error);
      if (error instanceof Error) {
        setErrors({ submit: error.message });
      } else {
        setErrors({ submit: "An unexpected error occurred." });
      }
    }
  };

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.otp) {
      setErrors({ otp: 'OTP is required' });
      return;
    }

    try {
      const isValid = await verifyOTP('email', formData.otp);
      if (isValid) {
        router.push('/reseller-dashboard');
      } else {
        setErrors({ otp: 'Invalid OTP code' });
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setErrors({ submit: error.message });
      } else {
        setErrors({ submit: "An unexpected error occurred." });
      }
    }
  };

  const handleSocialSignIn = async (provider: 'google' | 'facebook') => {
    try {
      if (provider === 'google') {
        await signInWithGoogle('RESELLER');
      } else {
        await signInWithFacebook('RESELLER');
      }
      router.push('/reseller-dashboard');
    } catch (error: unknown) {
      if (error instanceof Error) {
        setErrors({ submit: error.message });
      } else {
        setErrors({ submit: "An unexpected error occurred." });
      }
    }
  };

  const resendOTP = async () => {
    try {
      await sendOTP('email', formData.email);
      setOtpSent(true);
    } catch (error) {
        console.error('resendOTP error', error);
      setErrors({ submit: 'Failed to resend OTP' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-8 w-full max-w-md border border-gray-200 shadow-xl"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaStore className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reseller Portal</h1>
          <p className="text-gray-600">Sign in to your reseller account</p>
        </div>

        {step === 'credentials' ? (
          <form onSubmit={handleCredentialsSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="your@email.com"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="remember-reseller"
                  className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                />
                <label htmlFor="remember-reseller" className="ml-2 text-sm text-gray-700">
                  Remember me
                </label>
              </div>
              <Link href="/auth/reseller/forgot-password" className="text-sm text-green-600 hover:underline">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>

            {errors.submit && (
              <p className="text-red-500 text-sm text-center">{errors.submit}</p>
            )}
          </form>
        ) : (
          <form onSubmit={handleOTPSubmit} className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Business Verification</h2>
              <p className="text-gray-600 mb-4">
                We sent a verification code to {formData.email}
              </p>
              <p className="text-green-600 text-sm bg-green-50 p-3 rounded-lg">
                Enhanced security for business accounts
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter OTP Code
              </label>
              <input
                type="text"
                value={formData.otp}
                onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-center text-lg font-mono"
                placeholder="123456"
                maxLength={6}
              />
              {errors.otp && <p className="text-red-500 text-sm mt-1">{errors.otp}</p>}
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={resendOTP}
                className="text-sm text-green-600 hover:underline"
                disabled={otpSent}
              >
                {otpSent ? 'OTP Sent!' : 'Resend OTP'}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
            >
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </button>

            <button
              type="button"
              onClick={() => setStep('credentials')}
              className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Back to Sign In
            </button>
          </form>
        )}

        {step === 'credentials' && (
          <>
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="text-center mb-4">
                <span className="text-gray-600 text-sm">Or continue with</span>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => handleSocialSignIn('google')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white text-gray-800 rounded-xl hover:bg-gray-50 transition-colors font-medium border border-gray-300"
                >
                  <FaGoogle className="w-5 h-5" />
                  Google
                </button>
                <button
                  onClick={() => handleSocialSignIn('facebook')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                >
                  <FaFacebook className="w-5 h-5" />
                  Facebook
                </button>
              </div>
            </div>

            <div className="text-center mt-8 pt-6 border-t border-gray-200">
              <p className="text-gray-600">
                Don&lsquo;t have a reseller account?{' '}
                <Link href="/auth/reseller/signup" className="text-green-600 hover:underline font-semibold">
                  Sign Up
                </Link>
              </p>
              <div className="mt-4 flex gap-4 justify-center text-sm">
                <Link href="/auth/user/signin" className="text-blue-600 hover:underline">
                  Listener Sign In
                </Link>
                <Link href="/auth/artist/signin" className="text-purple-600 hover:underline">
                  Artist Sign In
                </Link>
              </div>
            </div>
          </>
        )}

        {/* Business Benefits Section */}
        {step === 'credentials' && (
          <div className="mt-8 bg-green-50 border border-green-200 rounded-xl p-4">
            <h3 className="font-semibold text-green-800 mb-2">Reseller Benefits</h3>
            <ul className="text-green-700 text-sm space-y-1">
              <li>• Earn commissions on music sales</li>
              <li>• Access exclusive reseller tools</li>
              <li>• Track your sales performance</li>
              <li>• Manage your customer base</li>
            </ul>
          </div>
        )}
      </motion.div>
    </div>
  );
}