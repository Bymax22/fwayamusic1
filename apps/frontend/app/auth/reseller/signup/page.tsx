// app/auth/reseller/signup/page.tsx
"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { ReCAPTCHA } from '@/components/ReCAPTCHA';
import { FaStore, FaEye, FaEyeSlash, FaCheck, FaArrowLeft } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type SignupStep = 'basic' | 'business' | 'consent' | 'verification';

export default function ResellerSignUp() {
  const { signUp, loading } = useAuth();
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
    businessName: '',
    businessType: '',
    taxNumber: '',
    acceptedTerms: false,
    acceptedPrivacy: false,
    marketingEmails: false,
    dataSharing: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const businessTypes = [
    'INDIVIDUAL',
    'COMPANY',
    'PARTNERSHIP',
    'NON_PROFIT',
    'SOLE_PROPRIETORSHIP'
  ];

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

    if (currentStep === 'business') {
      if (!formData.businessName) newErrors.businessName = 'Business name is required';
      if (!formData.businessType) newErrors.businessType = 'Business type is required';
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

  const handleNext = () => {
    if (validateStep(step)) {
      if (step === 'basic') setStep('business');
      else if (step === 'business') setStep('consent');
    }
  };

  const handleBack = () => {
    if (step === 'business') setStep('basic');
    else if (step === 'consent') setStep('business');
  };

  const handleSubmit = async () => {
    if (!validateStep('consent') || !recaptchaToken) {
      setErrors({ ...errors, recaptcha: 'Please complete the reCAPTCHA' });
      return;
    }

    try {
      await signUp({
        ...formData,
        role: 'RESELLER',
        recaptchaToken,
      });
      setStep('verification');
    } catch (error: unknown) {
      if (error instanceof Error) {
        setErrors({ submit: error.message });
      } else {
        setErrors({ submit: 'An unexpected error occurred.' });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-8 w-full max-w-2xl border border-gray-200 shadow-xl"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaStore className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Join as Reseller</h1>
          <p className="text-gray-600">Start your music reselling business and earn commissions</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {['basic', 'business', 'consent', 'verification'].map((s, index) => (
              <div key={s} className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    step === s
                      ? 'bg-green-600 text-white'
                      : index < ['basic', 'business', 'consent', 'verification'].indexOf(step)
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {index < ['basic', 'business', 'consent', 'verification'].indexOf(step) ? (
                    <FaCheck className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span className="text-xs text-gray-500 mt-1 capitalize">
                  {s === 'basic' && 'Account'}
                  {s === 'business' && 'Business'}
                  {s === 'consent' && 'Terms'}
                  {s === 'verification' && 'Verify'}
                </span>
              </div>
            ))}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${(['basic', 'business', 'consent', 'verification'].indexOf(step) + 1) * 25}%`,
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
            <h2 className="text-xl font-semibold text-gray-900 text-center mb-6">
              Account Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="your@email.com"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username *
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="username"
                />
                {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Your display name"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent pr-12"
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password *
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="••••••••"
                />
                {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Link
                href="/auth/reseller/signin"
                className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <FaArrowLeft className="w-4 h-4" />
                Back to Sign In
              </Link>
              <button
                onClick={handleNext}
                className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-semibold"
              >
                Continue
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Business Information */}
        {step === 'business' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <h2 className="text-xl font-semibold text-gray-900 text-center mb-6">
              Business Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Name *
                </label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Your business name"
                />
                {errors.businessName && <p className="text-red-500 text-sm mt-1">{errors.businessName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Type *
                </label>
                <select
                  value={formData.businessType}
                  onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select business type</option>
                  {businessTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
                {errors.businessType && <p className="text-red-500 text-sm mt-1">{errors.businessType}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="+260 96 123 4567"
                />
                {errors.phoneNumber && <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                {errors.dateOfBirth && <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tax Identification Number
              </label>
              <input
                type="text"
                value={formData.taxNumber}
                onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Tax ID or VAT number"
              />
              <p className="text-gray-500 text-sm mt-1">
                Required for commission payments and tax reporting
              </p>
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={handleBack}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-semibold"
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
            <h2 className="text-xl font-semibold text-gray-900 text-center mb-6">
              Reseller Agreements
            </h2>

            <div className="bg-gray-50 rounded-xl p-6 space-y-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="terms-reseller"
                  checked={formData.acceptedTerms}
                  onChange={(e) => setFormData({ ...formData, acceptedTerms: e.target.checked })}
                  className="mt-1 w-4 h-4 text-green-600 bg-white border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                />
                <label htmlFor="terms-reseller" className="text-gray-700 text-sm">
                  I agree to the <a href="/terms" className="text-green-600 hover:underline">Reseller Terms of Service</a> and <a href="/privacy" className="text-green-600 hover:underline">Privacy Policy</a> *
                </label>
              </div>
              {errors.acceptedTerms && <p className="text-red-500 text-sm">{errors.acceptedTerms}</p>}

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="privacy-reseller"
                  checked={formData.acceptedPrivacy}
                  onChange={(e) => setFormData({ ...formData, acceptedPrivacy: e.target.checked })}
                  className="mt-1 w-4 h-4 text-green-600 bg-white border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                />
                <label htmlFor="privacy-reseller" className="text-gray-700 text-sm">
                  I acknowledge that I have read and understood how my personal and business data will be processed *
                </label>
              </div>
              {errors.acceptedPrivacy && <p className="text-red-500 text-sm">{errors.acceptedPrivacy}</p>}

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="marketing-reseller"
                  checked={formData.marketingEmails}
                  onChange={(e) => setFormData({ ...formData, marketingEmails: e.target.checked })}
                  className="mt-1 w-4 h-4 text-green-600 bg-white border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                />
                <label htmlFor="marketing-reseller" className="text-gray-700 text-sm">
                  I agree to receive marketing emails and promotional offers
                </label>
              </div>

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="dataSharing-reseller"
                  checked={formData.dataSharing}
                  onChange={(e) => setFormData({ ...formData, dataSharing: e.target.checked })}
                  className="mt-1 w-4 h-4 text-green-600 bg-white border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                />
                <label htmlFor="dataSharing-reseller" className="text-gray-700 text-sm">
                  I consent to my data being shared with trusted partners for service improvement
                </label>
              </div>
            </div>

            {/* reCAPTCHA */}
            <div className="flex justify-center">
              <ReCAPTCHA
                onVerify={setRecaptchaToken}
                onExpire={() => setRecaptchaToken('')}
                onError={() => setErrors({ ...errors, recaptcha: 'reCAPTCHA error occurred' })}
              />
            </div>
            {errors.recaptcha && <p className="text-red-500 text-sm text-center">{errors.recaptcha}</p>}

            <div className="flex justify-between pt-4">
              <button
                onClick={handleBack}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
              >
                {loading ? 'Creating Account...' : 'Create Reseller Account'}
              </button>
            </div>

            {errors.submit && (
              <p className="text-red-500 text-sm text-center">{errors.submit}</p>
            )}
          </motion.div>
        )}

        {/* Step 4: Verification */}
        {step === 'verification' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-center space-y-6"
          >
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto">
              <FaCheck className="w-10 h-10 text-white" />
            </div>
            
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Verify Your Email!
              </h2>
              <p className="text-gray-600 mb-2">
                We&lsquo;ve sent a verification link to <strong>{formData.email}</strong>
              </p>
              <p className="text-gray-500 text-sm">
                Click the link in the email to verify your account and complete your reseller registration.
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <p className="text-yellow-800 text-sm">
                <strong>Important:</strong> After email verification, you&lsquo;ll need to complete KYC and business verification to start reselling and receiving commissions.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => router.push('/auth/reseller/signin')}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-semibold"
              >
                Go to Reseller Sign In
              </button>
              <button
                onClick={() => setStep('basic')}
                className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Create Another Account
              </button>
            </div>
          </motion.div>
        )}

        {/* Navigation Links */}
        <div className="text-center mt-8 pt-6 border-t border-gray-200">
          <p className="text-gray-600">
            Already have a reseller account?{' '}
            <Link href="/auth/reseller/signin" className="text-green-600 hover:underline font-semibold">
              Sign In
            </Link>
          </p>
          <div className="mt-4 flex gap-4 justify-center">
            <Link href="/auth/user/signup" className="text-sm text-blue-600 hover:underline">
              Listener Sign Up
            </Link>
            <Link href="/auth/artist/signup" className="text-sm text-purple-600 hover:underline">
              Artist Sign Up
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}