// app/auth/user/forgot-password/page.tsx
"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { FaUser, FaCheck, FaArrowLeft } from 'react-icons/fa';
import Link from 'next/link';

export default function UserForgotPassword() {
  const { forgotPassword, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    if (!email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email is invalid';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await forgotPassword(email);
      setIsSubmitted(true);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setErrors({ submit: error.message });
      } else {
        setErrors({ submit: "An unexpected error occurred." });
      }
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0f1112] rounded-3xl p-8 w-full max-w-md shadow-2xl"
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-[#0f1112] rounded-full flex items-center justify-center mx-auto mb-4">
              <FaCheck className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">Check Your Email</h1>
            <p className="text-gray-300 mb-6">
              We&lsquo;ve sent a password reset link to <strong>{email}</strong>
            </p>
            <p className="text-gray-400 text-sm mb-6">
              Click the link in the email to reset your password. The link will expire in 1 hour.
            </p>
            <div className="space-y-3">
              <Link
                href="/auth/user/signin"
                className="w-full block px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors font-semibold text-center"
              >
                Back to Sign In
              </Link>
              <button
                onClick={() => setIsSubmitted(false)}
                className="w-full px-4 py-2 bg-[#0f1112] text-white rounded-lg hover:bg-[#1f1f1f] transition-colors"
              >
                Try Another Email
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0f1112] rounded-3xl p-8 w-full max-w-md shadow-2xl"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#0f1112] rounded-full flex items-center justify-center mx-auto mb-4">
            <FaUser className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Reset Your Password</h1>
          <p className="text-gray-300">Enter your email to receive a reset link</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-[#0f1112] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="your@email.com"
            />
            {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
          >
            {loading ? 'Sending Reset Link...' : 'Send Reset Link'}
          </button>

          {errors.submit && (
            <p className="text-red-400 text-sm text-center">{errors.submit}</p>
          )}
        </form>

        <div className="text-center mt-8 pt-6">
          <Link
            href="/auth/user/signin"
            className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 hover:underline font-semibold"
          >
            <FaArrowLeft className="w-4 h-4" />
            Back to Sign In
          </Link>
        </div>
      </motion.div>
    </div>
  );
}




