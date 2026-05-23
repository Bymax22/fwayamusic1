// app/auth/artist/signup/page.tsx
"use client";

import { useState, useRef, ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { AvailabilityInput } from '@/components/AvailabilityInput';
import { FaMusic, FaEye, FaEyeSlash, FaCheck, FaCamera } from 'react-icons/fa';
import Link from 'next/link';
import Image from 'next/image';

type SignupStep = 'basic' | 'artist' | 'consent' | 'verification';

export default function ArtistSignUp() {
  const { signUp, loading, sendOTP, verificationError, clearVerificationError } = useAuth();
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
  const [resendLoading, setResendLoading] = useState(false);
  const [emailStatus, setEmailStatus] = useState<'unknown' | 'checking' | 'available' | 'taken'>('unknown');
  const [usernameStatus, setUsernameStatus] = useState<'unknown' | 'checking' | 'available' | 'taken'>('unknown');
  const emailTimerRef = useRef<number | null>(null);
  const usernameTimerRef = useRef<number | null>(null);
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

  const validateStep = (currentStep: SignupStep): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 'basic') {
      if (!formData.email) newErrors.email = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
      else if (emailStatus === 'taken') newErrors.email = 'Email is already in use';
      else if (emailStatus === 'checking') newErrors.email = 'Checking email availability — please wait';
      else if (emailStatus !== 'available') newErrors.email = 'Please use an available email address';

      if (!formData.password) newErrors.password = 'Password is required';
      else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';

      if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

      if (!formData.username) newErrors.username = 'Username is required';
      else if (usernameStatus === 'taken') newErrors.username = 'Username is already taken';
      else if (usernameStatus === 'checking') newErrors.username = 'Checking username availability — please wait';
      else if (usernameStatus !== 'available') newErrors.username = 'Please choose an available username';
      if (!formData.artistName) newErrors.artistName = 'Artist name is required';
      if (!formData.stageName) newErrors.stageName = 'Stage/Artist name is required';
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

    if (!file.type.startsWith('image/')) {
      setErrors({ ...errors, avatar: 'Please select an image file' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors({ ...errors, avatar: 'File size must be less than 5MB' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

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

  const checkAvailability = async (field: 'email' | 'username', value: string) => {
    if (!value) return;
    const checkValue = field === 'username' ? value.trim().toLowerCase() : value.trim();
    try {
      console.log('[Artist] checkAvailability ->', field, checkValue);
      const res = await fetch(`/api/auth/check-availability?field=${field}&value=${encodeURIComponent(checkValue)}`);
      if (!res.ok) {
        if (field === 'email') setEmailStatus('unknown');
        else setUsernameStatus('unknown');
        return;
      }
      const json = await res.json();
      console.log('[Artist] availability response', field, json);
      const available = Boolean(json.available);
      if (field === 'email') {
        setEmailStatus(available ? 'available' : 'taken');
      } else {
        setUsernameStatus(available ? 'available' : 'taken');
      }
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

  const handleNext = () => {
    if (step === 'basic') {
      if (emailStatus === 'checking' || usernameStatus === 'checking') {
        setErrors(prev => ({ ...prev, submit: 'Please wait for email and username availability checks to complete.' }));
        return;
      }
      if (emailStatus !== 'available' || usernameStatus !== 'available') {
        setErrors(prev => ({ ...prev, submit: 'Please choose an available email and username before continuing.' }));
        return;
      }
    }

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
      const userData = await signUp({
        ...formData,
        role: 'ARTIST',
      });

      if (userData && userData.role === 'ARTIST') {
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
    <div className="min-h-screen bg-black flex items-center justify-center px-4 pt-4 pb-24 sm:pb-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-black rounded-3xl p-8 w-full max-w-2xl shadow-2xl"
      >
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto rounded-full bg-[#0b0b0b] flex items-center justify-center mb-3">
            <FaMusic className="text-purple-400 w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">Join as Artist</h1>
          <p className="text-gray-400">Create your artist account and start sharing your music.</p>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            {['basic', 'artist', 'consent', 'verification'].map((s, index, arr) => (
              <div key={s} className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 flex items-center justify-center text-sm font-semibold ${
                    step === s
                      ? 'bg-purple-600 text-white'
                      : index < arr.indexOf(step)
                      ? 'bg-[#1f1f1f] text-white'
                      : 'bg-[#1f1f1f] text-gray-400'
                  }`}
                >
                  {index < arr.indexOf(step) ? <FaCheck className="w-4 h-4" /> : index + 1}
                </div>
                <span className="text-xs text-gray-500 mt-1 capitalize">
                  {s === 'basic' && 'Account'}{s === 'artist' && 'Artist Info'}{s === 'consent' && 'Terms'}{s === 'verification' && 'Verify'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {step === 'basic' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <h2 className="text-xl font-semibold text-white text-center mb-4">Account Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  className="w-full px-4 py-3 bg-[#0f1112] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Password *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 bg-[#0f1112] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 pr-12"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
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
                    className="w-full px-4 py-3 bg-[#0f1112] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <Link href="/auth/artist/signin" className="text-sm text-gray-400 hover:text-white">Back to Sign In</Link>
                <button onClick={handleNext} className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-500 transition-colors font-semibold">Continue</button>
              </div>
            </motion.div>
          )}

          {step === 'artist' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <h2 className="text-xl font-semibold text-white text-center mb-4">Artist Profile</h2>

              <div className="rounded-[24px] border border-white/10 bg-[#0f1112] p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative w-24 h-24 rounded-full bg-[#0f1112] border border-[#121517] flex items-center justify-center overflow-hidden">
                    {avatarPreview ? <Image src={avatarPreview} alt="Avatar preview" fill className="object-cover" /> : <FaMusic className="text-3xl text-gray-400" />}
                  </div>
                  <div className="flex-1">
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} disabled={uploading} className="hidden" />
                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                      <FaCamera className="w-4 h-4" />
                      {uploading ? 'Uploading...' : 'Upload Picture'}
                    </button>
                    <p className="text-xs text-gray-400 mt-2">JPG, PNG or GIF (Max 5MB)</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Artist name *</label>
                    <input type="text" value={formData.artistName} onChange={(e) => setFormData({ ...formData, artistName: e.target.value })} className="w-full px-4 py-3 bg-[#0f1112] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Your official artist name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Stage/Artist Name *</label>
                    <input type="text" value={formData.stageName} onChange={(e) => setFormData({ ...formData, stageName: e.target.value })} className="w-full px-4 py-3 bg-[#0f1112] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Your performance name" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Phone Number *</label>
                    <input type="tel" value={formData.phoneNumber} onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })} className="w-full px-4 py-3 bg-[#0f1112] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="+260 96 123 4567" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Date of Birth *</label>
                    <input type="date" value={formData.dateOfBirth} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} className="w-full px-4 py-3 bg-[#0f1112] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Bio</label>
                  <textarea value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} rows={3} className="w-full px-4 py-3 bg-[#0f1112] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Tell us about your music and background..." />
                </div>

                <div className="flex justify-between pt-4">
                  <button onClick={handleBack} className="px-6 py-3 bg-[#0f1112] text-white rounded-xl hover:bg-[#121517]">Back</button>
                  <button onClick={handleNext} className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-500">Continue</button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'consent' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <h2 className="text-xl font-semibold text-white text-center mb-4">Terms & Agreements</h2>

              <div className="bg-[#121517] rounded-xl p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <input type="checkbox" id="terms-artist" checked={formData.acceptedTerms} onChange={(e) => setFormData({ ...formData, acceptedTerms: e.target.checked })} className="mt-1 w-4 h-4 text-purple-600 bg-transparent border-[#121517] rounded focus:ring-purple-500 focus:ring-2" />
                  <label htmlFor="terms-artist" className="text-white text-sm">I agree to the <a href="/terms" className="text-purple-400 hover:text-purple-300 hover:underline">Terms of Service</a> and <a href="/privacy" className="text-purple-400 hover:text-purple-300 hover:underline">Privacy Policy</a> *</label>
                </div>
                {errors.acceptedTerms && <p className="text-red-400 text-sm">{errors.acceptedTerms}</p>}

                <div className="flex items-start gap-3">
                  <input type="checkbox" id="privacy-artist" checked={formData.acceptedPrivacy} onChange={(e) => setFormData({ ...formData, acceptedPrivacy: e.target.checked })} className="mt-1 w-4 h-4 text-purple-600 bg-transparent border-[#121517] rounded focus:ring-purple-500 focus:ring-2" />
                  <label htmlFor="privacy-artist" className="text-white text-sm">I acknowledge how my personal data will be processed *</label>
                </div>

                <button onClick={handleSubmit} disabled={loading || !formData.acceptedTerms || !formData.acceptedPrivacy} className="w-full px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-500">{loading ? 'Creating Account...' : 'Create Account'}</button>
                {errors.submit && <p className="text-sm text-red-400 text-center">{errors.submit}</p>}
              </div>
            </motion.div>
          )}

          {step === 'verification' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20 text-green-300">
                <FaCheck className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold">Verify your email</h3>
              <p className="text-sm text-gray-400">We’ve sent a verification link to <strong className="text-white">{formData.email}</strong>.</p>
              <button type="button" onClick={handleResendVerificationEmail} disabled={resendLoading} className="px-5 py-2 bg-[#121517] rounded-xl text-white hover:bg-[#1f1f1f]">{resendLoading ? 'Resending…' : 'Resend verification email'}</button>
            </motion.div>
          )}

        </div>

        <div className="mt-6 pt-6 border-t border-white/10">
          <div className="text-center text-sm text-gray-400">Already have an artist account? <Link href="/auth/artist/signin" className="font-semibold text-white hover:text-purple-300">Sign In</Link></div>

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Link href="/auth/user/signup" className="flex-1 min-w-[90px] px-3 py-2 bg-[#0f1112] rounded-none text-sm font-semibold text-white text-center hover:bg-[#121517]">Listener Sign Up</Link>
            <Link href="/auth/artist/signup" className="flex-1 min-w-[90px] px-3 py-2 bg-[#0f1112] rounded-none text-sm font-semibold text-white text-center hover:bg-[#121517]">Artist Sign Up</Link>
            <Link href="/auth/reseller/signup" className="flex-1 min-w-[90px] px-3 py-2 bg-[#0f1112] rounded-none text-sm font-semibold text-white text-center hover:bg-[#121517]">Reseller Sign Up</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
