"use client";

import AuthErrorBanner from '@/components/AuthErrorBanner';
import { AvailabilityInput } from '@/components/AvailabilityInput';
import { CountrySelect } from '@/components/CountrySelect';
import { PhoneInput } from '@/components/PhoneInput';
import { useRouter } from 'next/navigation';
import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { ReCAPTCHA } from '@/components/ReCAPTCHA';
import { AuthErrorInfo, parseAuthError } from '@/lib/auth-error-utils';
import { 
  FaUser, 
  FaMusic, 
  FaStore, 
  FaCheck, 
  FaEye, 
  FaEyeSlash,
  FaGoogle,
  FaFacebook
} from 'react-icons/fa';

type SignupRole = 'USER' | 'ARTIST' | 'RESELLER' | 'PRODUCER';
type UserRole = SignupRole | 'ADMIN' | 'MODERATOR';
type SignupStep = 'role' | 'details' | 'kyc' | 'consent' | 'verification';

export default function SignUp() {
  const { signUp, signInWithGoogle, signInWithFacebook, sendOTP, verificationError, clearVerificationError, loading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<SignupStep>('role');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    displayName: '',
    role: 'USER' as SignupRole,
    phoneNumber: '',
    country: 'ZM',
    dateOfBirth: '',
    artistName: '',
    stageName: '',
    bio: '',
    website: '',
    businessName: '',
    businessType: '',
    acceptedTerms: false,
    acceptedPrivacy: false,
    marketingEmails: false,
    dataSharing: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [resendLoading, setResendLoading] = useState(false);
  const [authError, setAuthError] = useState<AuthErrorInfo | null>(null);

  // availability states
  const [usernameStatus, setUsernameStatus] = useState<'unknown'|'checking'|'available'|'taken'>('unknown');
  const [emailStatus, setEmailStatus] = useState<'unknown'|'checking'|'available'|'taken'>('unknown');
  const usernameTimerRef = useRef<number | null>(null);
  const emailTimerRef = useRef<number | null>(null);

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

  const checkAvailability = async (field: 'username'|'email', value: string) => {
    if (!value) return;
    try {
      const res = await fetch(`/api/auth/check-availability?field=${field}&value=${encodeURIComponent(value)}`);
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

  const roles = [
    {
      id: 'USER',
      title: 'Music Lover',
      description: 'Stream and discover music, create playlists, follow artists',
      icon: FaUser,
    },
    {
      id: 'ARTIST',
      title: 'Artist/Creator',
      description: 'Upload your music, grow your audience, earn from your creations',
      icon: FaMusic,
    },
    {
      id: 'RESELLER',
      title: 'Reseller',
      description: 'Sell music and earn commissions, build your customer base',
      icon: FaStore,
    },
    {
      id: 'PRODUCER',
      title: 'Producer',
      description: 'Create beats, upload productions, and manage sales on the platform',
      icon: FaMusic,
    }
  ];

  const validateStep = (currentStep: SignupStep): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 'details') {
      if (!formData.email) newErrors.email = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
      
      if (!formData.password) newErrors.password = 'Password is required';
      else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
      
      if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
      
      if (!formData.username) newErrors.username = 'Username is required';
      else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) newErrors.username = 'Username can only contain letters, numbers, and underscores';
      else if (usernameStatus === 'taken') newErrors.username = 'Username is already taken';
      else if (usernameStatus === 'checking') newErrors.username = 'Checking username availability — please wait';
      if (emailStatus === 'taken') newErrors.email = 'Email is already in use';
      else if (emailStatus === 'checking') newErrors.email = 'Checking email availability — please wait';
    }

    if (currentStep === 'kyc') {
      if (formData.role === 'ARTIST') {
        if (!formData.artistName) newErrors.artistName = 'Artist name is required';
        if (!formData.stageName) newErrors.stageName = 'Stage name is required';
      }
      
      if (formData.role === 'RESELLER') {
        if (!formData.businessName) newErrors.businessName = 'Business name is required';
        if (!formData.businessType) newErrors.businessType = 'Business type is required';
      }
      
      if (!formData.phoneNumber) newErrors.phoneNumber = 'Phone number is required';
      if (!formData.country) newErrors.country = 'Country is required';
      if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    }

    if (currentStep === 'consent') {
      if (!formData.acceptedTerms) newErrors.acceptedTerms = 'You must accept the terms and conditions';
      if (!formData.acceptedPrivacy) newErrors.acceptedPrivacy = 'You must accept the privacy policy';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      if (step === 'role') {
        if (formData.role === 'PRODUCER') {
          router.push('/auth/producer/signup');
          return;
        }
        setStep('details');
      } else if (step === 'details') setStep('kyc');
      else if (step === 'kyc') setStep('consent');
    }
  };

  const handleBack = () => {
    if (step === 'details') setStep('role');
    else if (step === 'kyc') setStep('details');
    else if (step === 'consent') setStep('kyc');
  };

  const handleSubmit = async () => {
    if (!validateStep('consent') || !recaptchaToken) {
      setErrors({ ...errors, recaptcha: 'Please complete the reCAPTCHA' });
      return;
    }

    try {
      const userData = await signUp({
        ...formData,
        recaptchaToken,
      });
      switch (userData.role) {
        case 'USER':
          router.push('/dashboard');
          break;
        case 'ARTIST':
          router.push('/for-artists');
          break;
        case 'RESELLER':
          router.push('/reseller-dashboard');
          break;
        case 'PRODUCER':
          router.push('/producer');
          break;
        default:
          router.push('/');
      }
      setStep('verification');
    } catch (error: unknown) {
      const parsedError = parseAuthError(error);
      setAuthError(parsedError);
    }
  };

  const getRedirectPath = (role: UserRole) => {
    switch (role) {
      case 'ARTIST':
        return '/for-artists';
      case 'RESELLER':
        return '/reseller-dashboard';
      case 'PRODUCER':
        return '/producer';
      case 'ADMIN':
      case 'MODERATOR':
        return '/admin';
      default:
        return '/dashboard';
    }
  };

  const handleSocialSignIn = async (provider: 'google' | 'facebook') => {
    try {
      const currentUser = provider === 'google'
        ? await signInWithGoogle(formData.role)
        : await signInWithFacebook(formData.role);

      router.push(getRedirectPath(currentUser.role));
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
        className="relative bg-[#111111] w-full max-w-2xl rounded-[32px] p-8 shadow-[0_25px_70px_rgba(0,0,0,0.55)]"
      >
        <button
          type="button"
          onClick={() => router.push('/')}
          className="absolute right-4 top-4 rounded-full bg-white/5 text-gray-200 hover:bg-white/10 p-2 transition-colors"
        >
          ×
        </button>
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Join Fwaya</h1>
          <p className="text-gray-400">Create your account and start your musical journey</p>
        </div>

        <AuthErrorBanner error={authError} />

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {['role', 'details', 'kyc', 'consent', 'verification'].map((s, index, arr) => {
              const currentIndex = arr.indexOf(step);
              const isClickable = index <= currentIndex;
              return (
                <div key={s} className={`flex flex-col items-center ${isClickable ? 'cursor-pointer' : ''}`} onClick={() => isClickable && setStep(s as SignupStep)}>
                  <div
                    className={`w-8 h-8 flex items-center justify-center text-sm font-semibold ${
                      step === s
                        ? 'bg-purple-600 text-white'
                        : index < currentIndex
                        ? 'bg-[#101010] text-white'
                        : 'bg-[#101010] text-gray-400'
                    }`}
                  >
                    {index < currentIndex ? (
                      <FaCheck className="w-4 h-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span className="text-xs text-gray-400 mt-2 capitalize">{s}</span>
                </div>
              );
            })}
          </div>
          <div className="w-full bg-[#1f1f1f] h-1 rounded-full">
            <div
              className="bg-purple-600 h-1 rounded-full transition-all duration-300"
              style={{
                width: `${(['role', 'details', 'kyc', 'consent', 'verification'].indexOf(step) + 1) * 20}%`,
              }}
            />
          </div>
        </div>

        {/* Step 1: Role Selection */}
        {step === 'role' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-semibold text-white text-center mb-8">
              Choose Your Role
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roles.map((role) => {
                const Icon = role.icon;
                return (
                  <button
                    key={role.id}
                    onClick={() => setFormData({ ...formData, role: role.id as SignupRole })}
                    className={`p-6 rounded-3xl transition-all ${
                      formData.role === role.id
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                        : 'bg-[#101010] text-gray-300 hover:bg-[#1f1f1f]'
                    }`}
                  >
                    <Icon className="w-8 h-8 mb-3" />
                    <h3 className="font-semibold mb-2 text-lg">{role.title}</h3>
                    <p className="text-sm">{role.description}</p>
                  </button>
                );
              })}
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleNext}
                className="px-8 py-3 bg-purple-600 text-white hover:bg-purple-700 transition-colors font-semibold"
              >
                Continue
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Basic Details */}
        {step === 'details' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <h2 className="text-2xl font-semibold text-white text-center mb-8">
              Account Details
            </h2>
            
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

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Display Name</label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                placeholder="Your display name"
                className="w-full px-4 py-2.5 rounded-3xl bg-[#101010] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 rounded-3xl bg-[#101010] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-3xl bg-[#101010] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
              </div>
            </div>

            <div className="flex justify-between pt-6">
              <button
                onClick={handleBack}
                className="px-8 py-3 rounded-3xl bg-[#101010] text-gray-300 hover:bg-[#1f1f1f] transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                className="px-8 py-3 bg-purple-600 text-white hover:bg-purple-700 transition-colors font-semibold"
              >
                Continue
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: KYC Information */}
        {step === 'kyc' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <h2 className="text-2xl font-semibold text-white text-center mb-8">
              Additional Information
            </h2>

            <PhoneInput
              label="Phone Number"
              value={formData.phoneNumber}
              countryCode={formData.country}
              onPhoneChange={(phone) => setFormData({ ...formData, phoneNumber: phone })}
              onCountryChange={(country) => setFormData({ ...formData, country })}
              error={errors.phoneNumber}
            />

            <CountrySelect
              label="Country"
              value={formData.country}
              onChange={(country) => setFormData({ ...formData, country })}
              error={errors.country}
            />

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Date of Birth</label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="w-full px-4 py-2.5 rounded-3xl bg-[#101010] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              {errors.dateOfBirth && <p className="text-red-500 text-xs mt-1">{errors.dateOfBirth}</p>}
            </div>

            {formData.role === 'ARTIST' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Artist Name</label>
                    <input
                      type="text"
                      value={formData.artistName}
                      onChange={(e) => setFormData({ ...formData, artistName: e.target.value })}
                      placeholder="Your official artist name"
                      className="w-full px-4 py-2.5 rounded-3xl bg-[#101010] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    {errors.artistName && <p className="text-red-500 text-xs mt-1">{errors.artistName}</p>}
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Stage Name</label>
                    <input
                      type="text"
                      value={formData.stageName}
                      onChange={(e) => setFormData({ ...formData, stageName: e.target.value })}
                      placeholder="Your performance name"
                      className="w-full px-4 py-2.5 rounded-3xl bg-[#101010] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    {errors.stageName && <p className="text-red-500 text-xs mt-1">{errors.stageName}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Bio (Optional)</label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="Tell us about yourself and your music..."
                      rows={3}
                      className="w-full px-4 py-2.5 rounded-3xl bg-[#101010] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Website (Optional)</label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://yourwebsite.com"
                      className="w-full px-4 py-2.5 rounded-3xl bg-[#101010] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </>
            )}

            {formData.role === 'RESELLER' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Business Name</label>
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    placeholder="Your business name"
                    className="w-full px-4 py-2.5 rounded-3xl bg-[#101010] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  {errors.businessName && <p className="text-red-500 text-xs mt-1">{errors.businessName}</p>}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Business Type</label>
                  <select
                    value={formData.businessType}
                    onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-3xl bg-[#101010] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Select business type</option>
                    <option value="INDIVIDUAL">Individual</option>
                    <option value="COMPANY">Company</option>
                    <option value="PARTNERSHIP">Partnership</option>
                    <option value="NON_PROFIT">Non-Profit</option>
                  </select>
                  {errors.businessType && <p className="text-red-500 text-xs mt-1">{errors.businessType}</p>}
                </div>
              </div>
            )}

            <div className="flex justify-between pt-6">
              <button
                onClick={handleBack}
                className="px-8 py-3 rounded-3xl bg-[#101010] text-gray-300 hover:bg-[#1f1f1f] transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                className="px-8 py-3 bg-purple-600 text-white hover:bg-purple-700 transition-colors font-semibold"
              >
                Continue
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 4: Consent */}
        {step === 'consent' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-semibold text-white text-center mb-8">
              Terms & Consent
            </h2>

            <div className="bg-[#101010] p-6 space-y-4 rounded-3xl">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="terms"
                  checked={formData.acceptedTerms}
                  onChange={(e) => setFormData({ ...formData, acceptedTerms: e.target.checked })}
                  className="mt-1 w-4 h-4 text-purple-600 bg-[#101010] border-transparent rounded focus:ring-purple-600"
                />
                <label htmlFor="terms" className="text-gray-300 text-sm">
                  I agree to the <a href="/terms" className="text-purple-500 hover:underline">Terms of Service</a> and <a href="/privacy" className="text-purple-500 hover:underline">Privacy Policy</a>
                </label>
              </div>
              {errors.acceptedTerms && <p className="text-red-500 text-xs">{errors.acceptedTerms}</p>}

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="privacy"
                  checked={formData.acceptedPrivacy}
                  onChange={(e) => setFormData({ ...formData, acceptedPrivacy: e.target.checked })}
                  className="mt-1 w-4 h-4 text-purple-600 bg-[#101010] border-transparent rounded focus:ring-purple-600"
                />
                <label htmlFor="privacy" className="text-gray-300 text-sm">
                  I acknowledge that I have read and understood how my personal data will be processed
                </label>
              </div>
              {errors.acceptedPrivacy && <p className="text-red-500 text-xs">{errors.acceptedPrivacy}</p>}

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="marketing"
                  checked={formData.marketingEmails}
                  onChange={(e) => setFormData({ ...formData, marketingEmails: e.target.checked })}
                  className="mt-1 w-4 h-4 text-purple-600 bg-[#101010] border-transparent rounded focus:ring-purple-600"
                />
                <label htmlFor="marketing" className="text-gray-300 text-sm">
                  I agree to receive marketing emails and promotional offers
                </label>
              </div>

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="dataSharing"
                  checked={formData.dataSharing}
                  onChange={(e) => setFormData({ ...formData, dataSharing: e.target.checked })}
                  className="mt-1 w-4 h-4 text-purple-600 bg-[#101010] border-transparent rounded focus:ring-purple-600"
                />
                <label htmlFor="dataSharing" className="text-gray-300 text-sm">
                  I consent to my data being shared with trusted partners for service improvement
                </label>
              </div>
            </div>

            <div className="flex justify-center">
              <ReCAPTCHA
                onVerify={setRecaptchaToken}
                onExpire={() => setRecaptchaToken('')}
                onError={() => setErrors({ ...errors, recaptcha: 'reCAPTCHA error occurred' })}
              />
            </div>
            {errors.recaptcha && <p className="text-red-500 text-xs text-center">{errors.recaptcha}</p>}

            <div className="flex justify-between pt-6">
              <button
                onClick={handleBack}
                className="px-8 py-3 rounded-3xl bg-[#101010] text-gray-300 hover:bg-[#1f1f1f] transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-8 py-3 bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 5: Verification */}
        {step === 'verification' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-center space-y-6"
          >
            <div className="w-20 h-20 bg-green-600 flex items-center justify-center mx-auto">
              <FaCheck className="w-10 h-10 text-white" />
            </div>
            
            <div>
              <h2 className="text-2xl font-semibold text-white mb-4">
                Check Your Email!
              </h2>
              {verificationError && (
                <div className="bg-red-500/10 rounded-3xl p-3 mb-3 text-left">
                  <p className="text-red-200 text-sm font-semibold">Verification email failed to send.</p>
                  <p className="text-red-100 text-xs break-words">{verificationError}</p>
                </div>
              )}
              <p className="text-gray-300 mb-2">
                We&lsquo;ve sent a verification link to <strong>{formData.email}</strong>
              </p>
              <p className="text-gray-400 text-sm">
                Click the link in the email to verify your account and complete your registration.
              </p>
              <button
                type="button"
                onClick={handleResendVerificationEmail}
                disabled={resendLoading}
                className="mt-4 px-5 py-2 bg-[#1f1f1f] text-white hover:bg-[#2a2a2a] transition-colors disabled:opacity-50"
              >
                {resendLoading ? 'Resending…' : 'Resend verification email'}
              </button>
            </div>

            <div className="bg-yellow-600/10 rounded-3xl p-4">
              <p className="text-yellow-400 text-sm">
                <strong>Note for Artists & Resellers:</strong> After email verification, you&lsquo;ll need to complete KYC document verification to access all platform features.
              </p>
            </div>

            <button
              onClick={() => window.location.href = '/auth/signin'}
              className="px-8 py-3 bg-purple-600 text-white hover:bg-purple-700 transition-colors font-semibold"
            >
              Go to Sign In
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
