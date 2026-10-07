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
  defaultRole?: 'USER' | 'ARTIST' | 'RESELLER' | 'PRODUCER';
}

export default function SignInPopup({ isOpen, onClose, onSuccess, defaultRole = 'USER' }: SignInPopupProps) {
  const { signIn, signInWithGoogle, signInWithFacebook, loading } = useAuth();
  const [formData, setFormData] = useState<{ email: string; password: string; role: 'USER' | 'ARTIST' | 'RESELLER' | 'PRODUCER' }>({
    email: '',
    password: '',
    role: defaultRole as 'USER' | 'ARTIST' | 'RESELLER' | 'PRODUCER',
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
            <div className="bg-white rounded-2xl p-6 shadow-xl border border-white/20">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-charcoal">Sign In</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <FaTimes className="w-5 h-5 text-white/60" />
                </button>
              </div>

              {/* Role Selector */}
              <div className="flex gap-2 mb-6 p-1 bg-white/10 rounded-lg">
                {(['USER', 'ARTIST', 'RESELLER', 'PRODUCER'] as const).map((role) => (
                  <button
                    key={role}
                    onClick={() => setFormData({ ...formData, role })}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                      formData.role === role
                        ? 'bg-white text-charcoal shadow-sm'
                        : 'text-white/60 hover:text-charcoal'
                    }`}
                  >
                    {role === 'USER' && 'Listener'}
                    {role === 'ARTIST' && 'Artist'}
                    {role === 'RESELLER' && 'Reseller'}
                    {role === 'PRODUCER' && 'Producer'}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-charcoal placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple/75 focus:border-transparent"
                    placeholder="your@email.com"
                  />
                  {errors.email && <p className="text-purple/75 text-sm mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-charcoal placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple/75 focus:border-transparent pr-10"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white/80"
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {errors.password && <p className="text-purple/75 text-sm mt-1">{errors.password}</p>}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="remember-popup"
                      className="w-4 h-4 text-purple/85 bg-white/10 border-white/20 rounded focus:ring-purple/75 focus:ring-2"
                    />
                    <label htmlFor="remember-popup" className="ml-2 text-white/80">
                      Remember me
                    </label>
                  </div>
                  <a href={`/auth/${formData.role.toLowerCase()}/forgot-password`} className="text-purple/85 hover:underline">
                    Forgot password?
                  </a>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-2 bg-purple/85 text-white rounded-lg hover:bg-purple/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </button>

                {errors.submit && (
                  <p className="text-purple/75 text-sm text-center">{errors.submit}</p>
                )}
              </form>

              <div className="mt-6 pt-4 border-t border-white/20">
                <div className="text-center mb-3">
                  <span className="text-white/60 text-sm">Or continue with</span>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleSocialSignIn('google')}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white text-charcoal rounded-lg hover:bg-white/5 transition-colors font-medium border border-white/20 text-sm"
                  >
                    <FaGoogle className="w-4 h-4" />
                    Google
                  </button>
                  <button
                    onClick={() => handleSocialSignIn('facebook')}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple/85 text-white rounded-lg hover:bg-purple/90 transition-colors font-medium text-sm"
                  >
                    <FaFacebook className="w-4 h-4" />
                    Facebook
                  </button>
                </div>
              </div>

              <div className="text-center mt-6 pt-4 border-t border-white/20">
                <p className="text-white/60 text-sm">
                  Don&lsquo;t have an account?{' '}
                  <a 
                    href={`/auth/${formData.role.toLowerCase()}/signup`}
                    className="text-purple/85 hover:underline font-semibold"
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




