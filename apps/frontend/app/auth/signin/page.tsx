"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { FaGoogle, FaFacebook, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useRouter } from 'next/navigation';


export default function SignIn() {
  const router = useRouter();
  const { signIn, signInWithGoogle, signInWithFacebook, loading, user } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
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
    await signIn(formData.email, formData.password);

    // wait for auth context to populate user (small poll)
    const waitForUser = async (timeout = 3000) => {
      const start = Date.now();
      while (!user && Date.now() - start < timeout) {
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 100));
      }
      return user;
    };

    const currentUser = await waitForUser(3000);

    // fallback: if signIn returns user or user is immediately available, use it
    const role = currentUser?.role;

    if (role === 'ARTIST') {
      router.push('/for-artists');
    } else if (role === 'RESELLER') {
      router.push('/reseller-dashboard');
    } else {
      // default user dashboard
      router.push('/');
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
      await signInWithGoogle();
    } else {
      await signInWithFacebook();
    }
  } catch (error: unknown) { // <-- use unknown
    if (error instanceof Error) {
      setErrors({ submit: error.message });
    } else {
      setErrors({ submit: "An unexpected error occurred." });
    }
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1f29] via-[#0a3747] to-[#0a1f29] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0a1f29] rounded-2xl p-8 w-full max-w-md border border-[#0a3747] shadow-xl"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-gray-400">Sign in to your Fwaya Music account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 bg-[#0a3747] border border-[#0a4a5f] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#e51f48] focus:border-transparent"
              placeholder="your@email.com"
            />
            {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 bg-[#0a3747] border border-[#0a4a5f] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#e51f48] focus:border-transparent pr-12"
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
                className="w-4 h-4 text-[#e51f48] bg-[#0a3747] border-[#0a4a5f] rounded focus:ring-[#e51f48] focus:ring-2"
              />
              <label htmlFor="remember" className="ml-2 text-sm text-gray-300">
                Remember me
              </label>
            </div>
            <a href="/auth/forgot-password" className="text-sm text-[#e51f48] hover:underline">
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

        <div className="mt-8 pt-6 border-t border-[#0a3747]">
          <div className="text-center mb-4">
            <span className="text-gray-400 text-sm">Or continue with</span>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => handleSocialSignIn('google')}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white text-gray-800 rounded-xl hover:bg-gray-100 transition-colors font-medium"
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

        <div className="text-center mt-8 pt-6 border-t border-[#0a3747]">
          <p className="text-gray-400">
            Don&lsquo;t have an account?{' '}
            <a href="/auth/signup" className="text-[#e51f48] hover:underline font-semibold">
              Sign Up
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}