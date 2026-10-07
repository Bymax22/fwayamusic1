// app/auth/artist/signin/page.tsx
"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { FaGoogle, FaFacebook, FaEye, FaEyeSlash, FaMusic } from 'react-icons/fa';
import OtpModal from '@/components/otp-modal';
import { useRouter } from 'next/navigation';
import AuthErrorBanner from '@/components/AuthErrorBanner';
import { parseAuthError, AuthErrorInfo } from '@/lib/auth-error-utils';

export default function ArtistSignIn() {
  const router = useRouter();
  const { signIn, signInWithGoogle, signInWithFacebook, loading, verifyOTP, sendOTP, user } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    otp: '',
  });
  const [authError, setAuthError] = useState<AuthErrorInfo | null>(null);
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
      await signIn(formData.email, formData.password, 'ARTIST');
      console.log('Sign in successful, current user:', user?.email, 'role:', user?.role);
      
      // Send OTP for additional verification
      console.log('Sending OTP...');
      await sendOTP('email', formData.email);
      console.log('OTP sent, setting showOtpModal to true');
      setShowOtpModal(true);
      console.log('OTP modal state updated');
    } catch (error: unknown) {
      console.error('handleCredentialsSubmit error', error);
      const parsed = parseAuthError(error);
      setAuthError(parsed);
      setErrors({ submit: parsed.message });
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
        console.log('OTP valid, redirecting to /for-artists');
        console.log('Current user state:', { user: user?.email, role: user?.role });
        // OTP verified successfully - redirect to artist dashboard
        // RoleGuard on the page will verify the user is actually an ARTIST
        router.push('/for-artists');
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
        await signInWithGoogle('ARTIST');
      } else {
        await signInWithFacebook('ARTIST');
      }
      console.log('Social signin successful, redirecting to /for-artists');
      router.push('/for-artists');
    } catch (error: unknown) {
      console.error('Social signin error:', error);
      const parsed = parseAuthError(error);
      setAuthError(parsed);
      setErrors({ submit: parsed.message });
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
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-background rounded-3xl p-8 w-full max-w-md shadow-2xl"
          >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-purple/90 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaMusic className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Artist Portal</h1>
          <p className="text-white/90">Sign in to your artist account</p>
        </div>

        <AuthErrorBanner error={authError} />

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
                  className="w-full px-4 py-3 bg-background rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple/75"
                  placeholder="your@email.com"
                />
              {errors.email && <p className="text-purple/60 text-sm mt-1">{errors.email}</p>}
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
                  className="w-full px-4 py-3 bg-background rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple/75 pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.password && <p className="text-purple/60 text-sm mt-1">{errors.password}</p>}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="remember"
                  className="w-4 h-4 text-card-foreground bg-transparent border-white/10 rounded focus:ring-ring focus:ring-2"
                />
                <label htmlFor="remember" className="ml-2 text-sm text-white">
                  Remember me
                </label>
              </div>
              <a href="/auth/artist/forgot-password" className="text-sm text-white hover:underline">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-purple/75 text-white rounded-xl hover:bg-purple/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>

            
          </form>
        ) : null}

        {!showOtpModal && (
          <>
            <div className="mt-8 pt-6 border-t border-purple/20">
              <div className="text-center mb-4">
                <span className="text-white/90 text-sm">Or continue with</span>
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
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple/85 text-white rounded-xl hover:bg-purple/90 transition-colors font-medium"
                >
                  <FaFacebook className="w-5 h-5" />
                  Facebook
                </button>
              </div>
            </div>

            <div className="text-center mt-8 pt-6 border-t border-purple/20">
              <p className="text-white/90">
                Don&lsquo;t have an artist account?{' '}
                <a href="/auth/artist/signup" className="text-card-foreground hover:underline font-semibold">
                  Sign Up
                </a>
              </p>
              <div className="mt-4 flex gap-4 justify-center">
                <a href="/auth/user/signin" className="text-sm text-purple/85 hover:underline">
                  Listener Sign In
                </a>
                <a href="/auth/reseller/signin" className="text-sm text-purple/85 hover:underline">
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




