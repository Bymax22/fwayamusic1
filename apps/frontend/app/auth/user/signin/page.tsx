// app/auth/user/signin/page.tsx
"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { FaGoogle, FaFacebook, FaEye, FaEyeSlash, FaUser } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import AuthErrorBanner from '@/components/AuthErrorBanner';
import { parseAuthError, AuthErrorInfo } from '@/lib/auth-error-utils';

export default function UserSignIn() {
  const router = useRouter();
  const { signIn, signInWithGoogle, signInWithFacebook, loading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [authError, setAuthError] = useState<AuthErrorInfo | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await signIn(formData.email, formData.password, 'USER');
      router.push('/dashboard');
    } catch (error: unknown) {
      const parsed = parseAuthError(error);
      setAuthError(parsed);
      setErrors({ submit: parsed.message });
    }
  };

  const handleSocialSignIn = async (provider: 'google' | 'facebook') => {
    setSocialLoading(true);
    try {
      if (provider === 'google') {
        await signInWithGoogle('USER');
      } else {
        await signInWithFacebook('USER');
      }
      router.push('/dashboard');
    } catch (error: unknown) {
      const parsed = parseAuthError(error);
      setAuthError(parsed);
      setErrors({ submit: parsed.message });
    } finally {
      setSocialLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-black rounded-3xl p-8 w-full max-w-md shadow-2xl"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-purple-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaUser className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-gray-400">Sign in to your music listener account</p>
        </div>

        <AuthErrorBanner error={authError} />

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 bg-[#0f1112] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                  className="w-full px-4 py-3 bg-[#0f1112] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 pr-12"
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
                className="w-4 h-4 text-purple-500 bg-transparent rounded focus:ring-purple-500 focus:ring-2"
              />
              <label htmlFor="remember" className="ml-2 text-sm text-white">
                Remember me
              </label>
            </div>
            <a href="/auth/user/forgot-password" className="text-sm text-white hover:underline">
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>

          
        </form>

        <div className="mt-8 pt-6">
          <div className="text-center mb-4">
            <span className="text-gray-400 text-sm">Or continue with</span>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => handleSocialSignIn('google')}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#0f1112] text-white rounded-xl hover:bg-[#18191a] transition-colors font-medium"
            >
              <FaGoogle className="w-5 h-5" />
              Google
            </button>
            <button
              onClick={() => handleSocialSignIn('facebook')}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#0f1112] text-white rounded-xl hover:bg-[#18191a] transition-colors font-medium"
            >
              <FaFacebook className="w-5 h-5" />
              Facebook
            </button>
          </div>
        </div>

        <div className="text-center mt-8 pt-6 border-t border-white/10">
          <p className="text-gray-300">
            Don&lsquo;t have an account?{' '}
            <a href="/auth/user/signup" className="text-[#e51f48] hover:underline font-semibold">
              Sign Up
            </a>
          </p>
          <div className="mt-4 flex gap-4 justify-center">
            <a href="/auth/artist/signin" className="text-sm text-white/80 hover:text-white hover:underline">
              Artist Sign In
            </a>
            <a href="/auth/reseller/signin" className="text-sm text-white/80 hover:text-white hover:underline">
              Reseller Sign In
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}




