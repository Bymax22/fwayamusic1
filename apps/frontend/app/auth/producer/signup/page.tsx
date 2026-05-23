// app/auth/producer/signup/page.tsx
"use client";

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { Music2, Eye, EyeOff, Check, ArrowLeft, Camera } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

type SignupStep = 'basic' | 'producer' | 'consent' | 'verification';

export default function ProducerSignUp() {
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
    producerName: '',
    stageName: '',
    bio: '',
    website: '',
    avatarUrl: '',
    acceptedTerms: false,
    acceptedPrivacy: false,
    marketingEmails: false,
    dataSharing: false,
    avatarFile: null as File | null,
    genres: [] as string[],
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const producerGenres = [
    'Hip-Hop/Rap',
    'R&B/Soul',
    'Electronic/EDM',
    'Pop',
    'Rock',
    'Afrobeat',
    'Amapiano',
    'Jazz',
    'Reggae',
    'Country',
    'Drill',
    'Trap',
    'House',
    'Techno',
    'Other'
  ];

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
      
      if (!formData.password) newErrors.password = 'Password is required';
      else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
      
      if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
      
      if (!formData.username) newErrors.username = 'Username is required';
    }

    if (currentStep === 'producer') {
      if (!formData.producerName) newErrors.producerName = 'Producer name is required';
      if (!formData.stageName) newErrors.stageName = 'Stage/Artist name is required';
      if (!formData.phoneNumber) newErrors.phoneNumber = 'Phone number is required';
      if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
      if (formData.genres.length === 0) newErrors.genres = 'Please select at least one genre';
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

  const checkAvailability = async (type: 'email' | 'username', value: string) => {
    if (!value) return;
    try {
      if (type === 'email') {
        setEmailChecking(true);
        setEmailAvailable(null);
      } else {
        setUsernameChecking(true);
        setUsernameAvailable(null);
      }

      const res = await fetch(`/api/auth/check-availability?type=${type}&value=${encodeURIComponent(value)}`);
      const data = await res.json();
      const available = !!data?.available;

      if (type === 'email') {
        setEmailAvailable(available);
        setEmailChecking(false);
        setErrors(prev => {
          const copy = { ...prev };
          if (!available) copy.email = 'Email is already taken';
          else delete copy.email;
          return copy;
        });
      } else {
        setUsernameAvailable(available);
        setUsernameChecking(false);
        setErrors(prev => {
          const copy = { ...prev };
          if (!available) copy.username = 'Username is already taken';
          else delete copy.username;
          return copy;
        });
      }
    } catch (err) {
      if (type === 'email') {
        setEmailChecking(false);
        setErrors(prev => ({ ...prev, email: 'Availability check failed' }));
      } else {
        setUsernameChecking(false);
        setErrors(prev => ({ ...prev, username: 'Availability check failed' }));
      }
    }
  };

  const handleGenreChange = (genre: string) => {
    setFormData(prev => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter(g => g !== genre)
        : [...prev.genres, genre]
    }));
  };

  const handleNext = () => {
    if (step === 'basic') {
      // Ensure in-field availability checks have passed
      if (emailAvailable !== true || usernameAvailable !== true) {
        setErrors(prev => ({ ...prev, submit: 'Please verify email and username availability before continuing.' }));
        return;
      }
    }

    if (validateStep(step)) {
      if (step === 'basic') setStep('producer');
      else if (step === 'producer') setStep('consent');
    }
  };

  const handleBack = () => {
    if (step === 'producer') setStep('basic');
    else if (step === 'consent') setStep('producer');
  };

  const handleSubmit = async () => {
    if (!validateStep('consent')) {
      return;
    }

    try {
      console.log('Starting producer signup...');
      const userData = await signUp({
        ...formData,
        role: 'PRODUCER',
      });
      
      console.log('Signup completed. Returned userData:', userData);
      
      // Verify the role is PRODUCER
      if (userData && userData.role === 'PRODUCER') {
        console.log('Producer signup successful, moving to OTP verification step');
        setStep('verification');
      } else {
        setErrors({ submit: `User role was not set to PRODUCER. Got: ${userData?.role || 'undefined'}` });
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
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
            <Music2 className="w-8 h-8 text-purple-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Join as Producer</h1>
          <p className="text-gray-300">Create your producer account and share your beats with the world</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {['basic', 'producer', 'consent', 'verification'].map((s, index) => (
              <div key={s} className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    step === s
                      ? 'bg-purple-600 text-white'
                      : index < ['basic', 'producer', 'consent', 'verification'].indexOf(step)
                      ? 'bg-[#121517] text-white'
                      : 'bg-[#121517] text-gray-400'
                  }`}
                >
                  {index < ['basic', 'producer', 'consent', 'verification'].indexOf(step) ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span className="text-xs text-gray-500 mt-1 capitalize">
                  {s === 'basic' && 'Account'}
                  {s === 'producer' && 'Producer Info'}
                  {s === 'consent' && 'Terms'}
                  {s === 'verification' && 'Verify'}
                </span>
              </div>
            ))}
          </div>
          <div className="w-full bg-[#121517] rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${(['basic', 'producer', 'consent', 'verification'].indexOf(step) + 1) * 25}%`,
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
                <div className="relative">
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => { setFormData({ ...formData, email: e.target.value }); setEmailAvailable(null); }}
                    onBlur={() => checkAvailability('email', formData.email)}
                    className="w-full px-4 py-3 bg-[#0f1112] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-12"
                    placeholder="your@email.com"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {emailChecking ? (
                      <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-transparent animate-spin" />
                    ) : emailAvailable ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : null}
                  </div>
                </div>
                {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
              </div>

                <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Username *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => { setFormData({ ...formData, username: e.target.value }); setUsernameAvailable(null); }}
                    onBlur={() => checkAvailability('username', formData.username)}
                    className="w-full px-4 py-3 bg-[#0f1112] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-12"
                    placeholder="username"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {usernameChecking ? (
                      <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-transparent animate-spin" />
                    ) : usernameAvailable ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : null}
                  </div>
                </div>
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
                className="w-full px-4 py-3 bg-[#0f1112] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                    className="w-full px-4 py-3 bg-[#0f1112] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-12"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                  className="w-full px-4 py-3 bg-[#0f1112] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="••••••••"
                />
                {errors.confirmPassword && <p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>}
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Link
                href="/auth/producer/signin"
                className="flex items-center gap-2 px-6 py-3 bg-[#0f1112] text-white rounded-xl hover:bg-[#121517] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </Link>
              <button
                onClick={handleNext}
                className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-500 transition-colors font-semibold"
              >
                Continue
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Producer Information */}
        {step === 'producer' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <h2 className="text-xl font-semibold text-white text-center mb-6">
              Producer Profile
            </h2>

            {/* Avatar Upload */}
            <div>
              <label className="block text-sm font-medium text-white mb-3">
                Profile Picture
              </label>
              <div className="flex items-center gap-4">
                <div className="relative w-24 h-24 rounded-full bg-[#0f1112] border border-[#121517] flex items-center justify-center overflow-hidden flex-shrink-0">
                  {avatarPreview ? (
                    <Image src={avatarPreview} alt="Avatar preview" fill className="object-cover" />
                  ) : (
                    <Music2 className="text-3xl text-gray-400" />
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
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Camera className="w-4 h-4" />
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
                  Producer Name *
                </label>
                <input
                  type="text"
                  value={formData.producerName}
                  onChange={(e) => setFormData({ ...formData, producerName: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0f1112] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Your official producer name"
                />
                {errors.producerName && <p className="text-red-400 text-sm mt-1">{errors.producerName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Stage/Artist Name *
                </label>
                <input
                  type="text"
                  value={formData.stageName}
                  onChange={(e) => setFormData({ ...formData, stageName: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0f1112] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Your production stage name"
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
                  className="w-full px-4 py-3 bg-[#0f1112] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                  className="w-full px-4 py-3 bg-[#0f1112] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                className="w-full px-4 py-3 bg-[#0f1112] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Tell us about your production style and background..."
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
                className="w-full px-4 py-3 bg-[#0f1112] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="https://yourwebsite.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-3">
                Music Genres *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {producerGenres.map(genre => (
                  <label key={genre} className="flex items-center gap-2 px-3 py-2 bg-[#0f1112] rounded-lg border border-[#121517] hover:bg-[#121517] cursor-pointer transition">
                    <input
                      type="checkbox"
                      checked={formData.genres.includes(genre)}
                      onChange={() => handleGenreChange(genre)}
                      className="w-4 h-4 text-purple-600 bg-transparent rounded focus:ring-purple-500"
                    />
                    <span className="text-sm text-white">{genre}</span>
                  </label>
                ))}
              </div>
              {errors.genres && <p className="text-red-400 text-sm mt-2">{errors.genres}</p>}
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={handleBack}
                className="px-6 py-3 bg-[#0f1112] text-white rounded-xl hover:bg-[#121517] transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-500 transition-colors font-semibold"
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

            <div className="bg-[#121517] rounded-xl p-6 space-y-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="terms-producer"
                  checked={formData.acceptedTerms}
                  onChange={(e) => setFormData({ ...formData, acceptedTerms: e.target.checked })}
                  className="mt-1 w-4 h-4 text-purple-600 bg-transparent border-[#121517] rounded focus:ring-purple-500 focus:ring-2"
                />
                <label htmlFor="terms-producer" className="text-white text-sm">
                  I agree to the <a href="/terms" className="text-purple-400 hover:text-purple-300 hover:underline">Terms of Service</a> and <a href="/privacy" className="text-purple-400 hover:text-purple-300 hover:underline">Privacy Policy</a> *
                </label>
              </div>
              {errors.acceptedTerms && <p className="text-red-400 text-sm">{errors.acceptedTerms}</p>}

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="privacy-producer"
                  checked={formData.acceptedPrivacy}
                  onChange={(e) => setFormData({ ...formData, acceptedPrivacy: e.target.checked })}
                  className="mt-1 w-4 h-4 text-purple-600 bg-transparent border-white/10 rounded focus:ring-purple-500 focus:ring-2"
                />
                <label htmlFor="privacy-producer" className="text-white text-sm">
                  I acknowledge that I have read and understood how my personal data will be processed *
                </label>
              </div>
              {errors.acceptedPrivacy && <p className="text-red-400 text-sm">{errors.acceptedPrivacy}</p>}

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="marketing-producer"
                  checked={formData.marketingEmails}
                  onChange={(e) => setFormData({ ...formData, marketingEmails: e.target.checked })}
                  className="mt-1 w-4 h-4 text-purple-600 bg-transparent border-white/10 rounded focus:ring-purple-500 focus:ring-2"
                />
                <label htmlFor="marketing-producer" className="text-white text-sm">
                  I agree to receive marketing emails and promotional offers
                </label>
              </div>

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="dataSharing-producer"
                  checked={formData.dataSharing}
                  onChange={(e) => setFormData({ ...formData, dataSharing: e.target.checked })}
                  className="mt-1 w-4 h-4 text-purple-600 bg-transparent border-white/10 rounded focus:ring-purple-500 focus:ring-2"
                />
                <label htmlFor="dataSharing-producer" className="text-white text-sm">
                  I consent to my data being shared with trusted partners for service improvement
                </label>
              </div>
            </div>

            <button
              onClick={() => handleSubmit()}
              disabled={loading || !formData.acceptedTerms || !formData.acceptedPrivacy}
              className="w-full px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
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
              <Check className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white">Check Your Email</h3>
            {verificationError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-3 text-left">
                <p className="text-red-200 text-sm font-semibold">Verification email failed to send.</p>
                <p className="text-red-100 text-xs break-words">{verificationError}</p>
              </div>
            )}
            <p className="text-sm text-gray-300">We&apos;ve sent a verification link to <strong>{formData.email}</strong></p>
            <p className="text-sm text-gray-400">Click the link in your email to verify your account and get started.</p>
            <button
              type="button"
              onClick={handleResendVerificationEmail}
              disabled={resendLoading}
              className="mt-4 px-5 py-2 bg-[#121517] rounded-xl text-white hover:bg-[#1f1f1f] transition-colors disabled:opacity-50"
            >
              {resendLoading ? 'Resending…' : 'Resend verification email'}
            </button>
            <div className="bg-[#121517] border border-[#121517] rounded-lg p-3 mt-4">
              <p className="text-gray-400 text-xs">
                <strong>Note:</strong> After email verification, you&apos;ll need to complete KYC document verification to upload beats.
              </p>
            </div>
          </motion.div>
        )}

        {/* Navigation Links */}
        <div className="text-center mt-8 pt-6 border-t border-white/10">
          <p className="text-gray-300">
            Already have a producer account?{' '}
            <Link href="/auth/producer/signin" className="text-purple-400 hover:text-purple-300 hover:underline font-semibold">
              Sign In
            </Link>
          </p>
          <div className="mt-4 flex gap-4 justify-center">
            <Link href="/auth/user/signup" className="text-sm text-blue-400 hover:underline">
              Listener Sign Up
            </Link>
            <Link href="/auth/artist/signup" className="text-sm text-purple-400 hover:underline">
              Artist Sign Up
            </Link>
            <Link href="/auth/reseller/signup" className="text-sm text-purple-400 hover:underline">
              Reseller Sign Up
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
