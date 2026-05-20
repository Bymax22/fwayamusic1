// app/auth/user/signin/page.tsx
"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { FaGoogle, FaFacebook, FaEye, FaEyeSlash, FaUser } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

export default function UserSignIn() {
  const router = useRouter();
  const { signIn, signInWithGoogle, signInWithFacebook, loading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
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
      if (error instanceof Error) {
        setErrors({ submit: error.message });
      } else {
        setErrors({ submit: "An unexpected error occurred." });
      }
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
      if (error instanceof Error) {
        setErrors({ submit: error.message });
      } else {
        setErrors({ submit: "An unexpected error occurred." });
      }
    } finally {
      setSocialLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="backdrop-blur-md bg-white/5 rounded-2xl p-8 w-full max-w-md border border-white/10 shadow-2xl"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaUser className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-gray-300">Sign in to your music listener account</p>
        </div>

        <div className="mb-6">
          <button
            type="button"
            onClick={() => handleSocialSignIn('google')}
            disabled={loading || socialLoading}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#4285F4] text-white font-semibold hover:bg-[#357ae8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaGoogle className="w-5 h-5" />
            Sign in with Google
          </button>
          <div className="flex items-center gap-3 mt-4 text-xs text-gray-400">
            <span className="h-px flex-1 bg-white/10" />
            <span>or sign in with your email</span>
            <span className="h-px flex-1 bg-white/10" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#e51f48] focus:border-transparent"
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
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#e51f48] focus:border-transparent pr-12"
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
                className="w-4 h-4 text-[#e51f48] bg-white/5 border-white/10 rounded focus:ring-[#e51f48] focus:ring-2"
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
            className="w-full px-6 py-3 bg-[#e51f48] text-white rounded-xl hover:bg-[#ff4d6d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>

          {errors.submit && (
            <p className="text-red-400 text-sm text-center">{errors.submit}</p>
          )}
        </form>

        <div className="mt-8 pt-6 border-t border-white/10">
          <div className="text-center mb-4">
            <span className="text-gray-400 text-sm">Or continue with</span>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => handleSocialSignIn('google')}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 backdrop-blur-md bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors font-medium border border-white/20"
            >
              <FaGoogle className="w-5 h-5" />
              Google
            </button>
            <button
              onClick={() => handleSocialSignIn('facebook')}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 backdrop-blur-md bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors font-medium border border-white/20"
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




