// app/auth/user/signup/page.tsx
"use client";

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { AvailabilityInput } from '@/components/AvailabilityInput';
import { CountrySelect } from '@/components/CountrySelect';
import { PhoneInput } from '@/components/PhoneInput';
import { AuthErrorInfo, parseAuthError } from '@/lib/auth-error-utils';
import AuthErrorBanner from '@/components/AuthErrorBanner';
import { FaUser, FaEye, FaEyeSlash, FaCamera, FaGoogle, FaTimes } from 'react-icons/fa';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function UserSignUp() {
  const { signUp, signInWithGoogle, loading } = useAuth();
  const router = useRouter();
  const [socialLoading, setSocialLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    displayName: '',
    phoneNumber: '',
    dateOfBirth: '',
    country: 'ZM',
    address: '',
    avatarUrl: '',
    acceptedTerms: false,
    acceptedPrivacy: false,
    marketingEmails: false,
    dataSharing: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [authError, setAuthError] = useState<AuthErrorInfo | null>(null);
  const [usernameStatus, setUsernameStatus] = useState<'unknown'|'checking'|'available'|'taken'>('unknown');
  const [emailStatus, setEmailStatus] = useState<'unknown'|'checking'|'available'|'taken'>('unknown');
  const usernameTimerRef = useRef<number | null>(null);
  const emailTimerRef = useRef<number | null>(null);
  const uploadAvatarToCloudinary = async (file: File): Promise<string> => {
    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append('file', file);
    cloudinaryFormData.append('upload_preset', 'bymaxdev1');

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: cloudinaryFormData,
        }
      );

      if (!response.ok) {
        throw new Error('Avatar upload failed');
      }

      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw error;
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrors({ ...errors, avatar: 'Please select an image file' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors({ ...errors, avatar: 'File size must be less than 5MB' });
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to Cloudinary
    setUploading(true);
    try {
      const avatarUrl = await uploadAvatarToCloudinary(file);
      setFormData({ ...formData, avatarUrl });
      setErrors({ ...errors, avatar: '' });
    } catch {
      setErrors({ ...errors, avatar: 'Failed to upload avatar' });
    } finally {
      setUploading(false);
    }
  };

  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const checkAvailability = async (field: 'username'|'email', value: string) => {
    if (!value) return;
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/check-availability?field=${field}&value=${encodeURIComponent(value)}`);
      if (!res.ok) {
        if (field === 'username') setUsernameStatus('unknown');
        else setEmailStatus('unknown');
        return;
      }
      const json = await res.json();
      const available = Boolean(json.available);
      if (field === 'username') setUsernameStatus(available ? 'available' : 'taken');
      else setEmailStatus(available ? 'available' : 'taken');
    } catch (e) {
      if (field === 'username') setUsernameStatus('unknown');
      else setEmailStatus('unknown');
    }
  };

  const debouncedCheckUsername = (value: string) => {
    setUsernameStatus('checking');
    if (usernameTimerRef.current) window.clearTimeout(usernameTimerRef.current);
    usernameTimerRef.current = window.setTimeout(() => checkAvailability('username', value), 650);
  };

  const debouncedCheckEmail = (value: string) => {
    setEmailStatus('checking');
    if (emailTimerRef.current) window.clearTimeout(emailTimerRef.current);
    emailTimerRef.current = window.setTimeout(() => checkAvailability('email', value), 650);
  };

  const handleGoogleSignUp = async () => {
    setSocialLoading(true);
    setErrors({});
    setAuthError(null);

    try {
      await signInWithGoogle('USER');
      router.push('/dashboard');
    } catch (error: unknown) {
      const parsedError = parseAuthError(error);
      setAuthError(parsedError);
    } finally {
      setSocialLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!formData.username) newErrors.username = 'Username is required';
    if (usernameStatus === 'taken') newErrors.username = 'Username is already taken';
    if (emailStatus === 'taken') newErrors.email = 'Email is already in use';
    if (!formData.acceptedTerms) newErrors.acceptedTerms = 'You must accept the terms and conditions';
    if (!formData.acceptedPrivacy) newErrors.acceptedPrivacy = 'You must accept the privacy policy';
    if (!formData.country) newErrors.country = 'Country is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await signUp({
        ...formData,
        role: 'USER',
      });
      router.push('/dashboard');
    } catch (error: unknown) {
      const parsedError = parseAuthError(error);
      setAuthError(parsedError);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-[#0f1112] w-full max-w-md rounded-3xl p-6 shadow-2xl"
      >
        <button
          type="button"
          onClick={() => router.push('/')}
          className="absolute right-4 top-4 rounded-full bg-[#0f1112] text-white hover:bg-[#1f1f1f] p-2 transition-colors"
        >
          <FaTimes className="w-4 h-4" />
        </button>
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#0d0d0d] rounded-full flex items-center justify-center mx-auto mb-4">
            <FaUser className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Join as Listener</h1>
          <p className="text-gray-400">Create your music listener account</p>
        </div>

        <AuthErrorBanner error={authError} />

        <div className="mb-6">
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={loading || socialLoading}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaGoogle className="w-5 h-5" />
            Continue with Google
          </button>
          <div className="flex items-center gap-3 mt-4 text-xs text-gray-400">
            <span className="h-px flex-1 bg-[#1f1f1f]" />
            <span>or continue with your email</span>
            <span className="h-px flex-1 bg-[#1f1f1f]" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AvailabilityInput
              label="Email Address"
              placeholder="your@email.com"
              value={formData.email}
              onChange={(email) => setFormData({ ...formData, email })}
              field="email"
              status={emailStatus}
              onCheckAvailability={(field, value) => {
                if (field === 'email') debouncedCheckEmail(value);
              }}
              error={errors.email}
            />

            <AvailabilityInput
              label="Username"
              placeholder="username"
              value={formData.username}
              onChange={(username) => setFormData({ ...formData, username })}
              field="username"
              status={usernameStatus}
              onCheckAvailability={(field, value) => {
                if (field === 'username') debouncedCheckUsername(value);
              }}
              error={errors.username}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              className="w-full px-3 py-2 bg-[#0f1112] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Your display name"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-3xl bg-[#101010] ring-1 ring-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-10"
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

            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Confirm Password *
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full px-3 py-2 bg-[#0f1112] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="••••••••"
              />
              {errors.confirmPassword && <p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PhoneInput
              label="Phone Number"
              value={formData.phoneNumber}
              countryCode={formData.country}
              onPhoneChange={(phoneNumber) => setFormData({ ...formData, phoneNumber })}
              onCountryChange={(countryCode) => setFormData({ ...formData, country: countryCode })}
              error={errors.phoneNumber}
            />

            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="w-full px-4 py-3 rounded-3xl bg-[#101010] ring-1 ring-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Avatar Upload */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              Profile Picture
            </label>
            <div className="flex items-center gap-4">
              <div className="relative w-24 h-24 rounded-full bg-[#0f1112] flex items-center justify-center overflow-hidden flex-shrink-0">
                {avatarPreview ? (
                  <Image src={avatarPreview} alt="Avatar preview" fill className="object-cover" />
                ) : (
                  <FaUser className="text-3xl text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  disabled={uploading}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 px-4 py-2 bg-[#e51f48] hover:bg-[#ff4d6d] text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaCamera className="text-sm" />
                  {uploading ? 'Uploading...' : 'Upload Picture'}
                </button>
                <p className="text-xs text-gray-400 mt-2">JPG, PNG or GIF (Max 5MB)</p>
              </div>
            </div>
            {errors.avatar && <p className="text-red-400 text-sm mt-2">{errors.avatar}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CountrySelect
              label="Country"
              value={formData.country}
              onChange={(countryCode) => setFormData({ ...formData, country: countryCode })}
              error={errors.country}
            />

            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-3 rounded-3xl bg-[#0f1112] ring-1 ring-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Street address"
              />
            </div>
          </div>

          {/* Consent Section */}
          <div className="bg-[#0e0e0e] rounded-3xl p-4 space-y-3">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="terms"
                checked={formData.acceptedTerms}
                onChange={(e) => setFormData({ ...formData, acceptedTerms: e.target.checked })}
                className="mt-1 w-4 h-4 text-purple-500 bg-transparent rounded focus:ring-purple-500 focus:ring-2"
              />
              <label htmlFor="terms" className="text-sm text-gray-300">
                I agree to the <a href="/terms" className="text-white/80 hover:text-white hover:underline">Terms of Service</a> and <a href="/privacy" className="text-white/80 hover:text-white hover:underline">Privacy Policy</a> *
              </label>
            </div>
            {errors.acceptedTerms && <p className="text-red-400 text-sm">{errors.acceptedTerms}</p>}

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="privacy"
                checked={formData.acceptedPrivacy}
                onChange={(e) => setFormData({ ...formData, acceptedPrivacy: e.target.checked })}
                className="mt-1 w-4 h-4 text-purple-500 bg-transparent rounded focus:ring-purple-500 focus:ring-2"
              />
              <label htmlFor="privacy" className="text-sm text-gray-300">
                I acknowledge that I have read and understood how my personal data will be processed *
              </label>
            </div>
            {errors.acceptedPrivacy && <p className="text-red-400 text-sm">{errors.acceptedPrivacy}</p>}

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="marketing"
                checked={formData.marketingEmails}
                onChange={(e) => setFormData({ ...formData, marketingEmails: e.target.checked })}
                className="mt-1 w-4 h-4 text-purple-500 bg-transparent rounded focus:ring-purple-500 focus:ring-2"
              />
              <label htmlFor="marketing" className="text-sm text-gray-300">
                I agree to receive marketing emails and promotional offers
              </label>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="dataSharing"
                checked={formData.dataSharing}
                onChange={(e) => setFormData({ ...formData, dataSharing: e.target.checked })}
                className="mt-1 w-4 h-4 text-purple-500 bg-transparent rounded focus:ring-purple-500 focus:ring-2"
              />
              <label htmlFor="dataSharing" className="text-sm text-gray-300">
                I consent to my data being shared with trusted partners for service improvement
              </label>
            </div>
          </div>

          {/* reCAPTCHA temporarily disabled */}
          <button
            type="submit"
            disabled={loading || uploading}
            className="w-full px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold shadow-lg"
          >
            {loading ? 'Creating Account...' : uploading ? 'Uploading Avatar...' : 'Create Account'}
          </button>


        </form>

        <div className="text-center mt-6 pt-4 border-t border-white/10">
          <p className="text-gray-300">
            Already have an account?{' '}
            <Link href="/auth/user/signin" className="text-purple-400 hover:text-purple-300 hover:underline font-semibold">
              Sign In
            </Link>
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm text-white/80">
            <Link href="/auth/artist/signup" className="hover:text-white hover:underline">
              Artist Sign Up
            </Link>
            <Link href="/auth/producer/signup" className="hover:text-white hover:underline">
              Producer Sign Up
            </Link>
            <Link href="/auth/reseller/signup" className="hover:text-white hover:underline">
              Reseller Sign Up
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}




