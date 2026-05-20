// app/auth/producer/signin/page.tsx
"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { FaGoogle, FaFacebook, FaEye, FaEyeSlash } from 'react-icons/fa';
import { Music2 } from 'lucide-react';
import OtpModal from '@/components/otp-modal';
import { useRouter } from 'next/navigation';

export default function ProducerSignIn() {
  const router = useRouter();
  const { signIn, signInWithGoogle, signInWithFacebook, loading, verifyOTP, sendOTP, user } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    otp: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showOtpModal, setShowOtpModal] = useState(false);

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
      console.log('Starting sign in for:', formData.email);
      await signIn(formData.email, formData.password, 'PRODUCER');
      console.log('Sign in successful, current user:', user?.email, 'role:', user?.role);
      
      // Send OTP for additional verification
      console.log('Sending OTP...');
      await sendOTP('email', formData.email);
      console.log('OTP sent, setting showOtpModal to true');
      setShowOtpModal(true);
      console.log('OTP modal state updated');
    } catch (error: unknown) {
      console.error('handleCredentialsSubmit error', error);
      if (error instanceof Error) {
        setErrors({ submit: error.message });
      } else {
        setErrors({ submit: "An unexpected error occurred." });
      }
    }
  };

  const handleOTPSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!formData.otp) {
      setErrors({ otp: 'OTP is required' });
      return;
    }

    try {
      console.log('Verifying OTP...', formData.otp);
      const isValid = await verifyOTP('email', formData.otp);
      console.log('OTP verification result:', isValid);
      
      if (isValid) {
        console.log('OTP valid, redirecting to /producer');
        console.log('Current user state:', { user: user?.email, role: user?.role });
        // OTP verified successfully - redirect to producer dashboard
        router.push('/producer');
        console.log('Router.push called');
        setShowOtpModal(false);
      } else {
        console.log('OTP verification failed');
        setErrors({ otp: 'Invalid OTP code' });
      }
    } catch (error: unknown) {
      console.error('OTP verification error:', error);
      if (error instanceof Error) {
        setErrors({ submit: error.message });
      } else {
        setErrors({ submit: "An unexpected error occurred." });
      }
    }
  };

  const handleSocialSignIn = async (provider: 'google' | 'facebook') => {
    try {
      console.log('Starting social signin with:', provider);
      if (provider === 'google') {
        await signInWithGoogle('PRODUCER');
      } else {
        await signInWithFacebook('PRODUCER');
      }
      console.log('Social signin successful, redirecting to /producer');
      router.push('/producer');
    } catch (error: unknown) {
      console.error('Social signin error:', error);
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
      setShowOtpModal(true);
    } catch (error) {
       console.error('resendOTP error', error);
      setErrors({ submit: 'Failed to resend OTP' });
    }
  };

  return (
    <>
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl"
        >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Music2 className="w-8 h-8 text-purple-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Producer Portal</h1>
          <p className="text-gray-300">Sign in to your producer account</p>
        </div>

        {!showOtpModal ? (
          <form onSubmit={handleCredentialsSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="your@email.com"
              />
              {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password}</p>}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="remember"
                  className="w-4 h-4 text-purple-500 bg-transparent border-white/10 rounded focus:ring-purple-500 focus:ring-2"
                />
                <label htmlFor="remember" className="ml-2 text-sm text-white">
                  Remember me
                </label>
              </div>
              <a href="/auth/producer/forgot-password" className="text-sm text-white hover:underline">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>

            {errors.submit && (
              <p className="text-red-400 text-sm text-center">{errors.submit}</p>
            )}
          </form>
        ) : null}

        {!showOtpModal && (
          <>
            <div className="mt-8 pt-6 border-t border-purple-500/20">
              <div className="text-center mb-4">
                <span className="text-gray-300 text-sm">Or continue with</span>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => handleSocialSignIn('google')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/10 text-white rounded-xl hover:bg-white/15 transition-colors font-medium border border-white/10"
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

            <div className="text-center mt-8 pt-6 border-t border-purple-500/20">
              <p className="text-gray-300">
                Don&lsquo;t have a producer account?{' '}
                <a href="/auth/producer/signup" className="text-purple-400 hover:underline font-semibold">
                  Sign Up
                </a>
              </p>
              <div className="mt-4 flex gap-4 justify-center">
                <a href="/auth/user/signin" className="text-sm text-blue-400 hover:underline">
                  Listener Sign In
                </a>
                <a href="/auth/artist/signin" className="text-sm text-purple-400 hover:underline">
                  Artist Sign In
                </a>
                <a href="/auth/reseller/signin" className="text-sm text-green-400 hover:underline">
                  Reseller Sign In
                </a>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>

    <OtpModal
      isOpen={showOtpModal}
      email={formData.email}
      otp={formData.otp}
      setOtp={(v) => setFormData({ ...formData, otp: v })}
      onVerify={() => handleOTPSubmit()}
      onResend={resendOTP}
      onClose={() => setShowOtpModal(false)}
      loading={loading}
      error={errors.otp}
    />
  </>
  );
}
