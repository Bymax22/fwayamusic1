// components/SignInPopup.tsx
"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { FaTimes, FaEye, FaEyeSlash, FaGoogle, FaFacebook } from 'react-icons/fa';

interface SignInPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultRole?: 'USER' | 'ARTIST' | 'RESELLER';
}

export default function SignInPopup({ isOpen, onClose, onSuccess, defaultRole = 'USER' }: SignInPopupProps) {
  const { signIn, signInWithGoogle, signInWithFacebook, loading } = useAuth();
  const [formData, setFormData] = useState<{ email: string; password: string; role: 'USER' | 'ARTIST' | 'RESELLER' }>({
    email: '',
    password: '',
    role: defaultRole as 'USER' | 'ARTIST' | 'RESELLER',
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
      await signIn(formData.email, formData.password, formData.role);
      onSuccess?.();
      onClose();
      // Reset form
      setFormData({ email: '', password: '', role: defaultRole });
      setErrors({});
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
        await signInWithGoogle(formData.role);
      } else {
        await signInWithFacebook(formData.role);
      }
      onSuccess?.();
      onClose();
    } catch (error: unknown) {
      if (error instanceof Error) {
        setErrors({ submit: error.message });
      } else {
        setErrors({ submit: "An unexpected error occurred." });
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Blurry Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          
          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md p-6"
          >
            <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-200">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Sign In</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <FaTimes className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Role Selector */}
              <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-lg">
                {(['USER', 'ARTIST', 'RESELLER'] as const).map((role) => (
                  <button
                    key={role}
                    onClick={() => setFormData({ ...formData, role })}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                      formData.role === role
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {role === 'USER' && 'Listener'}
                    {role === 'ARTIST' && 'Artist'}
                    {role === 'RESELLER' && 'Reseller'}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="your@email.com"
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
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

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="remember-popup"
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <label htmlFor="remember-popup" className="ml-2 text-gray-700">
                      Remember me
                    </label>
                  </div>
                  <a href={`/auth/${formData.role.toLowerCase()}/forgot-password`} className="text-blue-600 hover:underline">
                    Forgot password?
                  </a>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </button>

                {errors.submit && (
                  <p className="text-red-500 text-sm text-center">{errors.submit}</p>
                )}
              </form>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="text-center mb-3">
                  <span className="text-gray-600 text-sm">Or continue with</span>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleSocialSignIn('google')}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white text-gray-800 rounded-lg hover:bg-gray-50 transition-colors font-medium border border-gray-300 text-sm"
                  >
                    <FaGoogle className="w-4 h-4" />
                    Google
                  </button>
                  <button
                    onClick={() => handleSocialSignIn('facebook')}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                  >
                    <FaFacebook className="w-4 h-4" />
                    Facebook
                  </button>
                </div>
              </div>

              <div className="text-center mt-6 pt-4 border-t border-gray-200">
                <p className="text-gray-600 text-sm">
                  Don&lsquo;t have an account?{' '}
                  <a 
                    href={`/auth/${formData.role.toLowerCase()}/signup`}
                    className="text-blue-600 hover:underline font-semibold"
                  >
                    Sign Up
                  </a>
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}