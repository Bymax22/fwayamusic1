// app/auth/artist/signup/page.tsx
"use client";

import { useState, useRef, ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import AuthErrorBanner from '@/components/AuthErrorBanner';
import { AvailabilityInput } from '@/components/AvailabilityInput';
import { AuthErrorInfo, parseAuthError } from '@/lib/auth-error-utils';
import { FaMusic, FaEye, FaEyeSlash, FaCheck, FaCamera } from 'react-icons/fa';
import Link from 'next/link';
import Image from 'next/image';

type SignupStep = 'basic' | 'artist' | 'consent' | 'verification';

type AvailabilityResponse = {
  emailTaken: boolean;
  usernameTaken: boolean;
};

export default function ArtistSignUp() {
  const { signUp, loading, sendOTP, verificationError, clearVerificationError } = useAuth();
  const [step, setStep] = useState<SignupStep>('basic');
  const [authError, setAuthError] = useState<AuthErrorInfo | null>(null);
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
  const [resendLoading, setResendLoading] = useState(false);
  const [emailStatus, setEmailStatus] = useState<'unknown' | 'checking' | 'available' | 'taken'>('unknown');
  const [usernameStatus, setUsernameStatus] = useState<'unknown' | 'checking' | 'available' | 'taken'>('unknown');
  const emailTimerRef = useRef<number | null>(null);
  const usernameTimerRef = useRef<number | null>(null);
  
  // removed combined availabilityLoading/combined check - using field-level checks below
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleResendVerificationEmail = async () => {
    clearVerificationError();
    setResendLoading(true);
    try {
      await sendOTP('link', formData.email);
    } catch (error) {
      console.error('Resend verification email failed:', error);
    } finally {
      setResendLoading(false);
    }
  };

  const checkAvailability = async (field: 'email' | 'username', value: string) => {
    if (!value) return;
    try {
      const res = await fetch(`/api/auth/check-availability?field=${field}&value=${encodeURIComponent(value)}`);
      if (!res.ok) {
        if (field === 'email') setEmailStatus('unknown');
        else setUsernameStatus('unknown');
        return;
      }
      const json = await res.json();
      const available = Boolean(json.available);
      if (field === 'email') setEmailStatus(available ? 'available' : 'taken');
      else setUsernameStatus(available ? 'available' : 'taken');
    } catch (error) {
      if (field === 'email') setEmailStatus('unknown');
      else setUsernameStatus('unknown');
    }
  };

  const debouncedCheckEmail = (value: string) => {
    if (!value) {
      setEmailStatus('unknown');
      return;
    }
    setEmailStatus('checking');
    if (emailTimerRef.current) window.clearTimeout(emailTimerRef.current);
    emailTimerRef.current = window.setTimeout(() => checkAvailability('email', value), 400);
  };

  const debouncedCheckUsername = (value: string) => {
    if (!value) {
      setUsernameStatus('unknown');
      return;
    }
    setUsernameStatus('checking');
    if (usernameTimerRef.current) window.clearTimeout(usernameTimerRef.current);
    usernameTimerRef.current = window.setTimeout(() => checkAvailability('username', value), 400);
  };

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

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
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

  const handleNext = async () => {
    if (step === 'basic') {
      if (!validateStep(step)) return;

      if (emailStatus === 'checking' || usernameStatus === 'checking') {
        setErrors(prev => ({ ...prev, submit: 'Please wait for email and username availability checks to complete.' }));
        return;
      }
      if (emailStatus !== 'available' || usernameStatus !== 'available') {
        setErrors(prev => ({ ...prev, submit: 'Please choose an available email and username before continuing.' }));
        return;
      }

      setStep('artist');
      return;
    }

    if (validateStep(step)) {
      if (step === 'artist') setStep('consent');
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
    <div className="min-h-screen bg-black text-white">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-purple-700/20 to-transparent blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 py-10 lg:px-8 lg:py-14">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] items-start">
            <section className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.28em] text-purple-300 shadow-sm shadow-purple-500/10">
                Artist Signup
              </div>

              <div className="space-y-6">
                <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Build your artist presence on Fwaya.</h1>
                <p className="max-w-2xl text-gray-400 text-lg leading-8">
                  Upload your profile, verify your email, and setup your artist brand with a modern, purple-forward experience that matches Fwaya’s library and search styling.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.15)]">
                  <p className="text-xs uppercase tracking-[0.3em] text-purple-300">Start strong</p>
                  <h2 className="mt-3 text-xl font-semibold">Artist-first onboarding</h2>
                  <p className="mt-3 text-sm text-gray-400">One flow for your profile picture, artist identity, and verification steps.</p>
                </div>
                <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.15)]">
                  <p className="text-xs uppercase tracking-[0.3em] text-purple-300">Verified trust</p>
                  <h2 className="mt-3 text-xl font-semibold">Secure email verification</h2>
                  <p className="mt-3 text-sm text-gray-400">Maintain the same working verification flow while freshening the presentation.</p>
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.15)]">
                <p className="text-xs uppercase tracking-[0.3em] text-purple-300">What to expect</p>
                <ul className="mt-4 space-y-3 text-sm text-gray-400">
                  <li>• Avatar upload with Cloudinary support</li>
                  <li>• Artist name, stage name, and bio setup</li>
                  <li>• Mobile friendly stepper with clear progress</li>
                  <li>• Email verification and resend support</li>
                </ul>
              </div>
            </section>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#09090b] shadow-[0_40px_120px_rgba(0,0,0,0.55)]"
            >
              <div className="pointer-events-none absolute -right-20 top-10 h-52 w-52 rounded-full bg-purple-500/10 blur-3xl" />
              <div className="relative px-6 py-8 sm:px-8 sm:py-10">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="max-w-xl">
                    <p className="text-sm uppercase tracking-[0.3em] text-purple-300">Artist Registration</p>
                    <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">One signup flow for your creative brand.</h2>
                    <p className="mt-3 text-sm text-gray-400 sm:text-base">
                      Keep the working signup and upload logic while giving artists a premium, modern onboarding experience.
                    </p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-300">
                    Step {['basic', 'artist', 'consent', 'verification'].indexOf(step) + 1} of 4
                  </div>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-[1fr_0.95fr]">
                  <div className="space-y-4">
                    {['Account', 'Artist Info', 'Terms', 'Verify'].map((label, index) => {
                      const active = index === ['basic', 'artist', 'consent', 'verification'].indexOf(step);
                      const completed = index < ['basic', 'artist', 'consent', 'verification'].indexOf(step);
                      return (
                        <div
                          key={label}
                          className={`flex items-center gap-3 rounded-3xl border px-4 py-4 transition ${
                            active
                              ? 'border-purple-500/40 bg-purple-500/10 text-white'
                              : completed
                              ? 'border-white/10 bg-white/5 text-gray-300'
                              : 'border-white/10 bg-[#080809] text-gray-400'
                          }`}
                        >
                          <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${active ? 'bg-purple-500 text-black' : 'bg-white/10 text-gray-300'}`}>
                            {completed ? <FaCheck className="h-4 w-4" /> : index + 1}
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{label}</p>
                            <p className="text-xs text-gray-400">
                              {index === 0 ? 'Email + username' : index === 1 ? 'Profile details' : index === 2 ? 'Consent' : 'Verification'}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="space-y-6">
                    <AuthErrorBanner error={authError} />

                    {step === 'basic' && (
                      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        <div className="rounded-[28px] border border-white/10 bg-[#0f1112] p-6 shadow-sm">
                          <h3 className="text-xl font-semibold text-white">Account basics</h3>
                          <p className="mt-2 text-sm text-gray-400">Start with your email, username and secure password.</p>

                          <div className="mt-6 grid gap-4">
                            <div>
                              <AvailabilityInput
                                label="Email address *"
                                placeholder="your@email.com"
                                value={formData.email}
                                onChange={(value) => setFormData({ ...formData, email: value })}
                                field="email"
                                status={emailStatus}
                                onCheckAvailability={(field, value) => { if (field === 'email') debouncedCheckEmail(value); }}
                                error={errors.email}
                              />
                            </div>

                            <div>
                              <AvailabilityInput
                                label="Username *"
                                placeholder="artistname"
                                value={formData.username}
                                onChange={(value) => setFormData({ ...formData, username: value })}
                                field="username"
                                status={usernameStatus}
                                onCheckAvailability={(field, value) => { if (field === 'username') debouncedCheckUsername(value); }}
                                error={errors.username}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">Display name</label>
                              <input
                                type="text"
                                value={formData.displayName}
                                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                placeholder="Your artist name"
                                className="w-full rounded-[24px] border border-white/10 bg-[#0b0c0f] px-4 py-3 text-white placeholder:text-gray-500 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                              />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Password *</label>
                                <div className="relative">
                                  <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="••••••••"
                                    className="w-full rounded-[24px] border border-white/10 bg-[#0b0c0f] px-4 py-3 pr-12 text-white placeholder:text-gray-500 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                  >
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                  </button>
                                </div>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Confirm password *</label>
                                <input
                                  type={showPassword ? 'text' : 'password'}
                                  value={formData.confirmPassword}
                                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                  placeholder="••••••••"
                                  className="w-full rounded-[24px] border border-white/10 bg-[#0b0c0f] px-4 py-3 text-white placeholder:text-gray-500 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <Link href="/auth/artist/signin" className="text-sm text-gray-400 hover:text-white">
                            Back to Sign In
                          </Link>
                          <button
                            onClick={handleNext}
                            className="inline-flex items-center justify-center rounded-full bg-purple-600 px-6 py-3 text-sm font-semibold text-black shadow-lg shadow-purple-500/20 transition hover:bg-purple-500"
                          >
                            Continue
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {step === 'artist' && (
                      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        <div className="rounded-[28px] border border-white/10 bg-[#0f1112] p-6 shadow-sm">
                          <h3 className="text-xl font-semibold text-white">Artist profile</h3>
                          <p className="mt-2 text-sm text-gray-400">Upload your avatar and share the details fans need to know.</p>

                          <div className="mt-6 space-y-6">
                            <div className="rounded-[24px] border border-white/10 bg-[#09090c] p-4">
                              <label className="block text-sm font-medium text-gray-300">Profile Picture</label>
                              <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
                                <div className="relative h-24 w-24 overflow-hidden rounded-full bg-[#121217] border border-white/10">
                                  {avatarPreview ? (
                                    <Image src={avatarPreview} alt="Avatar preview" fill className="object-cover" />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center text-gray-500">
                                      <FaMusic className="h-8 w-8" />
                                    </div>
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
                                    className="inline-flex items-center gap-2 rounded-full bg-purple-600 px-5 py-3 text-sm font-semibold text-black transition hover:bg-purple-500 disabled:opacity-60 disabled:cursor-not-allowed"
                                  >
                                    <FaCamera className="h-4 w-4" />
                                    {uploading ? 'Uploading...' : 'Upload avatar'}
                                  </button>
                                  <p className="mt-3 text-xs text-gray-500">JPG, PNG, GIF • max 5MB</p>
                                </div>
                              </div>
                              {errors.avatar && <p className="mt-3 text-sm text-red-400">{errors.avatar}</p>}
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Artist name *</label>
                                <input
                                  type="text"
                                  value={formData.artistName}
                                  onChange={(e) => setFormData({ ...formData, artistName: e.target.value })}
                                  placeholder="Your official artist name"
                                  className="w-full rounded-[24px] border border-white/10 bg-[#0b0c0f] px-4 py-3 text-white placeholder:text-gray-500 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                                />
                                {errors.artistName && <p className="mt-2 text-sm text-red-400">{errors.artistName}</p>}
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Stage name *</label>
                                <input
                                  type="text"
                                  value={formData.stageName}
                                  onChange={(e) => setFormData({ ...formData, stageName: e.target.value })}
                                  placeholder="Your performance name"
                                  className="w-full rounded-[24px] border border-white/10 bg-[#0b0c0f] px-4 py-3 text-white placeholder:text-gray-500 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                                />
                                {errors.stageName && <p className="mt-2 text-sm text-red-400">{errors.stageName}</p>}
                              </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Phone number *</label>
                                <input
                                  type="tel"
                                  value={formData.phoneNumber}
                                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                  placeholder="+260 96 123 4567"
                                  className="w-full rounded-[24px] border border-white/10 bg-[#0b0c0f] px-4 py-3 text-white placeholder:text-gray-500 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                                />
                                {errors.phoneNumber && <p className="mt-2 text-sm text-red-400">{errors.phoneNumber}</p>}
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Date of birth *</label>
                                <input
                                  type="date"
                                  value={formData.dateOfBirth}
                                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                                  className="w-full rounded-[24px] border border-white/10 bg-[#0b0c0f] px-4 py-3 text-white outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                                />
                                {errors.dateOfBirth && <p className="mt-2 text-sm text-red-400">{errors.dateOfBirth}</p>}
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
                              <textarea
                                value={formData.bio}
                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                rows={3}
                                placeholder="Tell us about your music and artistic journey..."
                                className="w-full rounded-[24px] border border-white/10 bg-[#0b0c0f] px-4 py-3 text-white placeholder:text-gray-500 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">Website</label>
                              <input
                                type="url"
                                value={formData.website}
                                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                placeholder="https://yourwebsite.com"
                                className="w-full rounded-[24px] border border-white/10 bg-[#0b0c0f] px-4 py-3 text-white placeholder:text-gray-500 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <button
                            onClick={handleBack}
                            className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm text-gray-300 transition hover:bg-white/10"
                          >
                            Back
                          </button>
                          <button
                            onClick={handleNext}
                            className="inline-flex items-center justify-center rounded-full bg-purple-600 px-6 py-3 text-sm font-semibold text-black shadow-lg shadow-purple-500/20 transition hover:bg-purple-500"
                          >
                            Continue
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {step === 'consent' && (
                      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        <div className="rounded-[28px] border border-white/10 bg-[#0f1112] p-6 shadow-sm">
                          <h3 className="text-xl font-semibold text-white">Permissions & consent</h3>
                          <p className="mt-2 text-sm text-gray-400">Review the terms that allow Fwaya to help you upload music safely.</p>

                          <div className="mt-6 space-y-4">
                            {[
                              {
                                id: 'terms-artist',
                                label: 'I agree to the Terms of Service and Privacy Policy *',
                                value: formData.acceptedTerms,
                                onChange: (checked: boolean) => setFormData({ ...formData, acceptedTerms: checked }),
                              },
                              {
                                id: 'privacy-artist',
                                label: 'I acknowledge how my personal data will be processed *',
                                value: formData.acceptedPrivacy,
                                onChange: (checked: boolean) => setFormData({ ...formData, acceptedPrivacy: checked }),
                              },
                              {
                                id: 'marketing-artist',
                                label: 'I agree to receive marketing emails and promotional offers',
                                value: formData.marketingEmails,
                                onChange: (checked: boolean) => setFormData({ ...formData, marketingEmails: checked }),
                              },
                              {
                                id: 'dataSharing-artist',
                                label: 'I consent to my data being shared with trusted partners for service improvement',
                                value: formData.dataSharing,
                                onChange: (checked: boolean) => setFormData({ ...formData, dataSharing: checked }),
                              },
                            ].map((item) => (
                              <label key={item.id} className="flex cursor-pointer items-start gap-3 rounded-3xl border border-white/10 bg-[#09090c] p-4">
                                <input
                                  type="checkbox"
                                  checked={item.value}
                                  onChange={(e) => item.onChange(e.target.checked)}
                                  className="mt-1 h-4 w-4 rounded border-white/20 bg-[#0f1112] text-purple-500 focus:ring-purple-500"
                                />
                                <span className="text-sm text-gray-300">{item.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <button
                          onClick={handleSubmit}
                          disabled={loading || !formData.acceptedTerms || !formData.acceptedPrivacy}
                          className="w-full rounded-full bg-purple-600 px-6 py-3 text-sm font-semibold text-black shadow-lg shadow-purple-500/20 transition hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading ? 'Creating Account...' : 'Create Account'}
                        </button>
                        {errors.submit && <p className="text-center text-sm text-red-400">{errors.submit}</p>}
                      </motion.div>
                    )}

                    {step === 'verification' && (
                      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-500/20 text-green-300">
                          <FaCheck className="h-6 w-6" />
                        </div>
                        <h3 className="text-2xl font-semibold">Verify your email</h3>
                        {verificationError && (
                          <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-4 text-left text-sm text-red-100">
                            <p className="font-semibold">Verification email failed to send.</p>
                            <p className="mt-2 text-xs text-red-200 break-words">{verificationError}</p>
                          </div>
                        )}
                        <p className="text-sm text-gray-400">
                          We’ve sent a verification link to <strong className="text-white">{formData.email}</strong>.
                        </p>
                        <p className="text-sm text-gray-500">Click that link to activate your artist account.</p>
                        <button
                          type="button"
                          onClick={handleResendVerificationEmail}
                          disabled={resendLoading}
                          className="mx-auto rounded-full bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
                        >
                          {resendLoading ? 'Resending…' : 'Resend verification email'}
                        </button>
                        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-xs text-gray-400">
                          After verification, you can continue to complete your KYC and start uploading music.
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t border-white/10 pt-6 text-center text-sm text-gray-400">
                Already have an artist account?{' '}
                <Link href="/auth/artist/signin" className="font-semibold text-white hover:text-purple-300">
                  Sign In
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
