// app/auth/artist/signup/page.tsx
"use client";

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { FaMusic, FaEye, FaEyeSlash, FaCheck, FaArrowLeft, FaCamera } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

type SignupStep = 'basic' | 'artist' | 'consent' | 'verification';

export default function ArtistSignUp() {
  const { signUp, loading, verifyOTP } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<SignupStep>('basic');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    displayName: '',
    phoneNumber: '',
    dateOfBirth: '',
    artistName: '',
    stageName: '',
    bio: '',
    website: '',
    avatarUrl: '',
    acceptedTerms: false,
    acceptedPrivacy: false,
    marketingEmails: false,
    dataSharing: false,
    avatarFile: null as File | null,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateStep = (currentStep: SignupStep): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 'basic') {
      if (!formData.email) newErrors.email = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
      
      if (!formData.password) newErrors.password = 'Password is required';
      else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
      
      if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
      
      if (!formData.username) newErrors.username = 'Username is required';
    }

    if (currentStep === 'artist') {
      if (!formData.artistName) newErrors.artistName = 'Artist name is required';
      if (!formData.stageName) newErrors.stageName = 'Stage name is required';
      if (!formData.phoneNumber) newErrors.phoneNumber = 'Phone number is required';
      if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    }

    if (currentStep === 'consent') {
      if (!formData.acceptedTerms) newErrors.acceptedTerms = 'You must accept the terms and conditions';
      if (!formData.acceptedPrivacy) newErrors.acceptedPrivacy = 'You must accept the privacy policy';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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

  const handleNext = () => {
    if (validateStep(step)) {
      if (step === 'basic') setStep('artist');
      else if (step === 'artist') setStep('consent');
    }
  };

  const handleBack = () => {
    if (step === 'artist') setStep('basic');
    else if (step === 'consent') setStep('artist');
  };

  const handleSubmit = async () => {
    if (!validateStep('consent')) {
      return;
    }

    try {
      console.log('Starting artist signup...');
      const userData = await signUp({
        ...formData,
        role: 'ARTIST',
      });
      
      console.log('Signup completed. Returned userData:', userData);
      
      // Verify the role is ARTIST
      if (userData && userData.role === 'ARTIST') {
        console.log('Artist signup successful, moving to OTP verification step');
        // Move to verification step instead of redirecting immediately
        setStep('verification');
      } else {
        setErrors({ submit: `User role was not set to ARTIST. Got: ${userData?.role || 'undefined'}` });
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setErrors({ submit: error.message });
      } else {
        setErrors({ submit: 'An unexpected error occurred.' });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1f29] to-[#0a3747] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-[#1a2e3d] to-[#051420] rounded-2xl p-8 w-full max-w-2xl border border-purple-500/30 shadow-2xl"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaMusic className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Join as Artist</h1>
          <p className="text-gray-300">Create your artist account and share your music with the world</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {['basic', 'artist', 'consent', 'verification'].map((s, index) => (
              <div key={s} className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    step === s
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                      : index < ['basic', 'artist', 'consent', 'verification'].indexOf(step)
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  {index < ['basic', 'artist', 'consent', 'verification'].indexOf(step) ? (
                    <FaCheck className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span className="text-xs text-gray-500 mt-1 capitalize">
                  {s === 'basic' && 'Account'}
                  {s === 'artist' && 'Artist Info'}
                  {s === 'consent' && 'Terms'}
                  {s === 'verification' && 'Verify'}
                </span>
              </div>
            ))}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${(['basic', 'artist', 'consent', 'verification'].indexOf(step) + 1) * 25}%`,
              }}
            />
          </div>
        </div>

        {/* Step 1: Basic Information */}
        {step === 'basic' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <h2 className="text-xl font-semibold text-white text-center mb-6">
              Account Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0a3747] border border-purple-500/40 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="your@email.com"
                />
                {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Username *
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0a3747] border border-purple-500/40 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="username"
                />
                {errors.username && <p className="text-red-400 text-sm mt-1">{errors.username}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                className="w-full px-4 py-3 bg-[#0a3747] border border-purple-500/40 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Your display name"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0a3747] border border-purple-500/40 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-12"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-white"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Confirm Password *
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0a3747] border border-purple-500/40 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="••••••••"
                />
                {errors.confirmPassword && <p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>}
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Link
                href="/auth/artist/signin"
                className="flex items-center gap-2 px-6 py-3 border border-purple-500/40 text-white rounded-xl hover:bg-[#0a3747] transition-colors"
              >
                <FaArrowLeft className="w-4 h-4" />
                Back to Sign In
              </Link>
              <button
                onClick={handleNext}
                className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-semibold"
              >
                Continue
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Artist Information */}
        {step === 'artist' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <h2 className="text-xl font-semibold text-white text-center mb-6">
              Artist Profile
            </h2>

            {/* Avatar Upload */}
            <div>
              <label className="block text-sm font-medium text-white mb-3">
                Profile Picture
              </label>
              <div className="flex items-center gap-4">
                <div className="relative w-24 h-24 rounded-full bg-[#0a3747] border-2 border-purple-500/40 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {avatarPreview ? (
                    <Image src={avatarPreview} alt="Avatar preview" fill className="object-cover" />
                  ) : (
                    <FaMusic className="text-3xl text-gray-400" />
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
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Artist Name *
                </label>
                <input
                  type="text"
                  value={formData.artistName}
                  onChange={(e) => setFormData({ ...formData, artistName: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0a3747] border border-purple-500/40 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Your official artist name"
                />
                {errors.artistName && <p className="text-red-400 text-sm mt-1">{errors.artistName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Stage Name *
                </label>
                <input
                  type="text"
                  value={formData.stageName}
                  onChange={(e) => setFormData({ ...formData, stageName: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0a3747] border border-purple-500/40 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Your performance name"
                />
                {errors.stageName && <p className="text-red-400 text-sm mt-1">{errors.stageName}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0a3747] border border-purple-500/40 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="+260 96 123 4567"
                />
                {errors.phoneNumber && <p className="text-red-400 text-sm mt-1">{errors.phoneNumber}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0a3747] border border-purple-500/40 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                {errors.dateOfBirth && <p className="text-red-400 text-sm mt-1">{errors.dateOfBirth}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Bio
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 bg-[#0a3747] border border-purple-500/40 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Tell us about your music and artistic journey..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Website
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-4 py-3 bg-[#0a3747] border border-purple-500/40 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="https://yourwebsite.com"
              />
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={handleBack}
                className="px-6 py-3 border border-purple-500/40 text-white rounded-xl hover:bg-[#0a3747] transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-semibold"
              >
                Continue
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Consent */}
        {step === 'consent' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <h2 className="text-xl font-semibold text-white text-center mb-6">
              Terms & Agreements
            </h2>

            <div className="bg-[#0a3747] rounded-xl p-6 space-y-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="terms-artist"
                  checked={formData.acceptedTerms}
                  onChange={(e) => setFormData({ ...formData, acceptedTerms: e.target.checked })}
                  className="mt-1 w-4 h-4 text-purple-500 bg-[#0a3747] border-purple-500/40 rounded focus:ring-purple-500 focus:ring-2"
                />
                <label htmlFor="terms-artist" className="text-white text-sm">
                  I agree to the <a href="/terms" className="text-purple-400 hover:text-purple-300 hover:underline">Terms of Service</a> and <a href="/privacy" className="text-purple-400 hover:text-purple-300 hover:underline">Privacy Policy</a> *
                </label>
              </div>
              {errors.acceptedTerms && <p className="text-red-400 text-sm">{errors.acceptedTerms}</p>}

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="privacy-artist"
                  checked={formData.acceptedPrivacy}
                  onChange={(e) => setFormData({ ...formData, acceptedPrivacy: e.target.checked })}
                  className="mt-1 w-4 h-4 text-purple-500 bg-[#0a3747] border-purple-500/40 rounded focus:ring-purple-500 focus:ring-2"
                />
                <label htmlFor="privacy-artist" className="text-white text-sm">
                  I acknowledge that I have read and understood how my personal data will be processed *
                </label>
              </div>
              {errors.acceptedPrivacy && <p className="text-red-400 text-sm">{errors.acceptedPrivacy}</p>}

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="marketing-artist"
                  checked={formData.marketingEmails}
                  onChange={(e) => setFormData({ ...formData, marketingEmails: e.target.checked })}
                  className="mt-1 w-4 h-4 text-purple-500 bg-[#0a3747] border-purple-500/40 rounded focus:ring-purple-500 focus:ring-2"
                />
                <label htmlFor="marketing-artist" className="text-white text-sm">
                  I agree to receive marketing emails and promotional offers
                </label>
              </div>

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="dataSharing-artist"
                  checked={formData.dataSharing}
                  onChange={(e) => setFormData({ ...formData, dataSharing: e.target.checked })}
                  className="mt-1 w-4 h-4 text-purple-500 bg-[#0a3747] border-purple-500/40 rounded focus:ring-purple-500 focus:ring-2"
                />
                <label htmlFor="dataSharing-artist" className="text-white text-sm">
                  I consent to my data being shared with trusted partners for service improvement
                </label>
              </div>
            </div>

            <button
              onClick={() => handleSubmit()}
              disabled={loading || !formData.acceptedTerms || !formData.acceptedPrivacy}
              className="w-full px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>

            {errors.submit && (
              <p className="text-red-400 text-sm text-center">{errors.submit}</p>
            )}
          </motion.div>
        )}

        {/* Step 4: Verification */}
        {step === 'verification' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4 text-center"
          >
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaCheck className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white">Check Your Email</h3>
            <p className="text-sm text-gray-300">We&apos;ve sent a verification link to <strong>{formData.email}</strong></p>
            <p className="text-sm text-gray-400">Click the link in your email to verify your account and get started.</p>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mt-4">
              <p className="text-yellow-400 text-xs">
                <strong>Note:</strong> After email verification, you&apos;ll need to complete KYC document verification to upload music.
              </p>
            </div>
          </motion.div>
        )}

        {/* Navigation Links */}
        <div className="text-center mt-8 pt-6 border-t border-gray-200">
          <p className="text-gray-300">
            Already have an artist account?{' '}
            <Link href="/auth/artist/signin" className="text-purple-400 hover:text-purple-300 hover:underline font-semibold">
              Sign In
            </Link>
          </p>
          <div className="mt-4 flex gap-4 justify-center">
            <Link href="/auth/user/signup" className="text-sm text-blue-600 hover:underline">
              Listener Sign Up
            </Link>
            <Link href="/auth/reseller/signup" className="text-sm text-green-600 hover:underline">
              Reseller Sign Up
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}




