"use client";
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { ReCAPTCHA } from '@/components/ReCAPTCHA';
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

type UserRole = 'USER' | 'ARTIST' | 'RESELLER';
type SignupStep = 'role' | 'details' | 'kyc' | 'consent' | 'verification';

export default function SignUp() {
  const { signUp, signInWithGoogle, signInWithFacebook, loading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<SignupStep>('role');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    displayName: '',
    role: 'USER' as UserRole,
    phoneNumber: '',
    dateOfBirth: '',
    artistName: '',
    stageName: '',
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

  const roles = [
    {
      id: 'USER',
      title: 'Music Lover',
      description: 'Stream and discover music, create playlists, follow artists',
      icon: FaUser,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'ARTIST',
      title: 'Artist/Creator',
      description: 'Upload your music, grow your audience, earn from your creations',
      icon: FaMusic,
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'RESELLER',
      title: 'Reseller',
      description: 'Sell music and earn commissions, build your customer base',
      icon: FaStore,
      color: 'from-green-500 to-emerald-500'
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
      if (step === 'role') setStep('details');
      else if (step === 'details') setStep('kyc');
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
      // Redirect based on user role
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
        default:
          router.push('/');
      }
      setStep('verification');
    } catch (error: unknown) {
      if (error instanceof Error) {
        setErrors({ submit: error.message });
      } else {
        setErrors({ submit: 'An unexpected error occurred.' });
      }
    }
  };

  const handleSocialSignIn = async (provider: 'google' | 'facebook') => {
    try {
      if (provider === 'google') {
        await signInWithGoogle();
      } else {
        await signInWithFacebook();
      }
  } catch (error: unknown) { // <-- use unknown
    if (error instanceof Error) {
      setErrors({ submit: error.message });
    } else {
      setErrors({ submit: 'An unexpected error occurred.' });
    }
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1f29] via-[#0a3747] to-[#0a1f29] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0a1f29] rounded-2xl p-8 w-full max-w-2xl border border-[#0a3747] shadow-xl"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Join Fwaya Music</h1>
          <p className="text-gray-400">Create your account and start your musical journey</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {['role', 'details', 'kyc', 'consent', 'verification'].map((s, index) => (
              <div key={s} className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    step === s
                      ? 'bg-[#e51f48] text-white'
                      : index < ['role', 'details', 'kyc', 'consent', 'verification'].indexOf(step)
                      ? 'bg-green-500 text-white'
                      : 'bg-[#0a3747] text-gray-400'
                  }`}
                >
                  {index < ['role', 'details', 'kyc', 'consent', 'verification'].indexOf(step) ? (
                    <FaCheck className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span className="text-xs text-gray-400 mt-1 capitalize">{s}</span>
              </div>
            ))}
          </div>
          <div className="w-full bg-[#0a3747] rounded-full h-2">
            <div
              className="bg-[#e51f48] h-2 rounded-full transition-all duration-300"
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
            <h2 className="text-xl font-semibold text-white text-center mb-6">
              Choose Your Role
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {roles.map((role) => {
                const Icon = role.icon;
                return (
                  <button
                    key={role.id}
                    onClick={() => setFormData({ ...formData, role: role.id as UserRole })}
                    className={`p-6 rounded-xl border-2 transition-all ${
                      formData.role === role.id
                        ? `border-[#e51f48] bg-gradient-to-br ${role.color}`
                        : 'border-[#0a3747] bg-[#0a3747] hover:border-[#e51f48]'
                    }`}
                  >
                    <Icon className={`w-8 h-8 mb-3 ${
                      formData.role === role.id ? 'text-white' : 'text-[#e51f48]'
                    }`} />
                    <h3 className="font-semibold text-white mb-2">{role.title}</h3>
                    <p className="text-sm text-gray-300">{role.description}</p>
                  </button>
                );
              })}
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleNext}
                className="px-6 py-3 bg-[#e51f48] text-white rounded-xl hover:bg-[#ff4d6d] transition-colors font-semibold"
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
            <h2 className="text-xl font-semibold text-white text-center mb-6">
              Account Details
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0a3747] border border-[#0a4a5f] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#e51f48] focus:border-transparent"
                  placeholder="your@email.com"
                />
                {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0a3747] border border-[#0a4a5f] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#e51f48] focus:border-transparent"
                  placeholder="username"
                />
                {errors.username && <p className="text-red-400 text-sm mt-1">{errors.username}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                className="w-full px-4 py-3 bg-[#0a3747] border border-[#0a4a5f] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#e51f48] focus:border-transparent"
                placeholder="Your display name"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0a3747] border border-[#0a4a5f] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#e51f48] focus:border-transparent pr-12"
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
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0a3747] border border-[#0a4a5f] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#e51f48] focus:border-transparent"
                  placeholder="••••••••"
                />
                {errors.confirmPassword && <p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>}
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={handleBack}
                className="px-6 py-3 border border-gray-600 text-gray-300 rounded-xl hover:bg-[#0a3747] transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                className="px-6 py-3 bg-[#e51f48] text-white rounded-xl hover:bg-[#ff4d6d] transition-colors font-semibold"
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
            <h2 className="text-xl font-semibold text-white text-center mb-6">
              Additional Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0a3747] border border-[#0a4a5f] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#e51f48] focus:border-transparent"
                  placeholder="+260 96 123 4567"
                />
                {errors.phoneNumber && <p className="text-red-400 text-sm mt-1">{errors.phoneNumber}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0a3747] border border-[#0a4a5f] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#e51f48] focus:border-transparent"
                />
                {errors.dateOfBirth && <p className="text-red-400 text-sm mt-1">{errors.dateOfBirth}</p>}
              </div>
            </div>

            {formData.role === 'ARTIST' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Artist Name
                  </label>
                  <input
                    type="text"
                    value={formData.artistName}
                    onChange={(e) => setFormData({ ...formData, artistName: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0a3747] border border-[#0a4a5f] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#e51f48] focus:border-transparent"
                    placeholder="Your official artist name"
                  />
                  {errors.artistName && <p className="text-red-400 text-sm mt-1">{errors.artistName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Stage Name
                  </label>
                  <input
                    type="text"
                    value={formData.stageName}
                    onChange={(e) => setFormData({ ...formData, stageName: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0a3747] border border-[#0a4a5f] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#e51f48] focus:border-transparent"
                    placeholder="Your performance name"
                  />
                  {errors.stageName && <p className="text-red-400 text-sm mt-1">{errors.stageName}</p>}
                </div>
              </div>
            )}

            {formData.role === 'RESELLER' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Business Name
                  </label>
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0a3747] border border-[#0a4a5f] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#e51f48] focus:border-transparent"
                    placeholder="Your business name"
                  />
                  {errors.businessName && <p className="text-red-400 text-sm mt-1">{errors.businessName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Business Type
                  </label>
                  <select
                    value={formData.businessType}
                    onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0a3747] border border-[#0a4a5f] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#e51f48] focus:border-transparent"
                  >
                    <option value="">Select business type</option>
                    <option value="INDIVIDUAL">Individual</option>
                    <option value="COMPANY">Company</option>
                    <option value="PARTNERSHIP">Partnership</option>
                    <option value="NON_PROFIT">Non-Profit</option>
                  </select>
                  {errors.businessType && <p className="text-red-400 text-sm mt-1">{errors.businessType}</p>}
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <button
                onClick={handleBack}
                className="px-6 py-3 border border-gray-600 text-gray-300 rounded-xl hover:bg-[#0a3747] transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                className="px-6 py-3 bg-[#e51f48] text-white rounded-xl hover:bg-[#ff4d6d] transition-colors font-semibold"
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
            <h2 className="text-xl font-semibold text-white text-center mb-6">
              Terms & Consent
            </h2>

            <div className="bg-[#0a3747] rounded-xl p-6 space-y-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="terms"
                  checked={formData.acceptedTerms}
                  onChange={(e) => setFormData({ ...formData, acceptedTerms: e.target.checked })}
                  className="mt-1 w-4 h-4 text-[#e51f48] bg-[#0a1f29] border-[#0a4a5f] rounded focus:ring-[#e51f48] focus:ring-2"
                />
                <label htmlFor="terms" className="text-gray-300 text-sm">
                  I agree to the <a href="/terms" className="text-[#e51f48] hover:underline">Terms of Service</a> and <a href="/privacy" className="text-[#e51f48] hover:underline">Privacy Policy</a>
                </label>
              </div>
              {errors.acceptedTerms && <p className="text-red-400 text-sm">{errors.acceptedTerms}</p>}

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="privacy"
                  checked={formData.acceptedPrivacy}
                  onChange={(e) => setFormData({ ...formData, acceptedPrivacy: e.target.checked })}
                  className="mt-1 w-4 h-4 text-[#e51f48] bg-[#0a1f29] border-[#0a4a5f] rounded focus:ring-[#e51f48] focus:ring-2"
                />
                <label htmlFor="privacy" className="text-gray-300 text-sm">
                  I acknowledge that I have read and understood how my personal data will be processed
                </label>
              </div>
              {errors.acceptedPrivacy && <p className="text-red-400 text-sm">{errors.acceptedPrivacy}</p>}

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="marketing"
                  checked={formData.marketingEmails}
                  onChange={(e) => setFormData({ ...formData, marketingEmails: e.target.checked })}
                  className="mt-1 w-4 h-4 text-[#e51f48] bg-[#0a1f29] border-[#0a4a5f] rounded focus:ring-[#e51f48] focus:ring-2"
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
                  className="mt-1 w-4 h-4 text-[#e51f48] bg-[#0a1f29] border-[#0a4a5f] rounded focus:ring-[#e51f48] focus:ring-2"
                />
                <label htmlFor="dataSharing" className="text-gray-300 text-sm">
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
            {errors.recaptcha && <p className="text-red-400 text-sm text-center">{errors.recaptcha}</p>}

            <div className="flex justify-between pt-4">
              <button
                onClick={handleBack}
                className="px-6 py-3 border border-gray-600 text-gray-300 rounded-xl hover:bg-[#0a3747] transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-3 bg-[#e51f48] text-white rounded-xl hover:bg-[#ff4d6d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>

            {errors.submit && (
              <p className="text-red-400 text-sm text-center">{errors.submit}</p>
            )}
          </motion.div>
        )}

        {/* Step 5: Verification */}
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
              <h2 className="text-2xl font-semibold text-white mb-4">
                Check Your Email!
              </h2>
              <p className="text-gray-300 mb-2">
                We&lsquo;ve sent a verification link to <strong>{formData.email}</strong>
              </p>
              <p className="text-gray-400 text-sm">
                Click the link in the email to verify your account and complete your registration.
              </p>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
              <p className="text-yellow-400 text-sm">
                <strong>Note for Artists & Resellers:</strong> After email verification, you&lsquo;ll need to complete KYC document verification to access all platform features.
              </p>
            </div>

            <button
              onClick={() => window.location.href = '/auth/signin'}
              className="px-6 py-3 bg-[#e51f48] text-white rounded-xl hover:bg-[#ff4d6d] transition-colors font-semibold"
            >
              Go to Sign In
            </button>
          </motion.div>
        )}

        {/* Social Sign In */}
        {step === 'role' && (
          <div className="mt-8 pt-8 border-t border-[#0a3747]">
            <div className="text-center mb-4">
              <span className="text-gray-400 text-sm">Or continue with</span>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => handleSocialSignIn('google')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white text-gray-800 rounded-xl hover:bg-gray-100 transition-colors font-medium"
              >
                <FaGoogle className="w-5 h-5" />
                Google
              </button>
              <button
                onClick={() => handleSocialSignIn('facebook')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
              >
                <FaFacebook className="w-5 h-5" />
                Facebook
              </button>
            </div>
          </div>
        )}

        {/* Sign In Link */}
        <div className="text-center mt-8 pt-6 border-t border-[#0a3747]">
          <p className="text-gray-400">
            Already have an account?{' '}
            <a href="/auth/signin" className="text-[#e51f48] hover:underline font-semibold">
              Sign In
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}