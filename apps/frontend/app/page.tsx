// app/page.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import type { ComponentType } from "react";
import {
  FaCrown,
  FaDownload,
  FaShare,
  FaHeadphones,
  FaUser,
  FaMusic,
  FaStore,
} from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import GuestWelcome from "@/components/GuestWelcome";
import UserDashboard from "./dashboard/page";
import { ReCAPTCHA } from "@/components/ReCAPTCHA";
import { useRouter } from "next/navigation";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'role'>('role');
  const [selectedRole, setSelectedRole] = useState<'USER' | 'ARTIST' | 'RESELLER'>('USER');

  // Show auth modal for guests after 3 seconds
  useEffect(() => {
    if (!user && !loading) {
      const timer = setTimeout(() => {
        setShowAuthModal(true);
        setAuthMode('role');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [user, loading]);

  // Redirect authenticated users to their appropriate dashboard
  useEffect(() => {
    if (user && !loading) {
      switch (user.role) {
        case 'ARTIST':
          router.push('/for-artists');
          break;
        case 'RESELLER':
          router.push('/reseller-dashboard');
          break;
        case 'ADMIN':
        case 'MODERATOR':
          router.push('/admin');
          break;
        default:
          // USER role stays on home page which shows UserDashboard
          break;
      }
    }
  }, [user, loading, router]);

  // If user is not authenticated, show guest welcome page
  if (!user && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a1f29] to-[#0a3747]">
        <GuestWelcome />

        {/* Auth Modal */}
        <AnimatePresence>
          {showAuthModal && (
            <AuthModal
              mode={authMode}
              selectedRole={selectedRole}
              onClose={() => setShowAuthModal(false)}
              onSwitchMode={(newMode, role) => {
                setAuthMode(newMode);
                if (role) setSelectedRole(role);
              }}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  // If user is authenticated and is a regular USER, show user dashboard
  if (user && user.role === 'USER') {
     return <UserDashboard />;
  }

  // Loading state
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1f29] to-[#0a3747] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#e51f48] mx-auto mb-4"></div>
        <p className="text-gray-400">Loading your experience...</p>
      </div>
    </div>
  );
}

// Enhanced Auth Modal Component with Role Selection and reCAPTCHA
const AuthModal = ({
  mode,
  selectedRole,
  onClose,
  onSwitchMode,
}: {
  mode: 'login' | 'register' | 'role';
  selectedRole: 'USER' | 'ARTIST' | 'RESELLER';
  onClose: () => void;
  onSwitchMode: (mode: 'login' | 'register' | 'role', role?: 'USER' | 'ARTIST' | 'RESELLER') => void;
}) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    displayName: '',
    phoneNumber: '',
    artistName: '',
    stageName: '',
    businessName: '',
    businessType: '',
    acceptedTerms: false,
    acceptedPrivacy: false,
    marketingEmails: false,
    dataSharing: false,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signUp, signInWithGoogle, signInWithFacebook } = useAuth();
  const router = useRouter();

  const roles: {
    id: 'USER' | 'ARTIST' | 'RESELLER';
    title: string;
    description: string;
    icon: ComponentType<{ className?: string }>;
    color: string;
    gradient: string;
  }[] = [
    {
      id: 'USER',
      title: 'Music Lover',
      description: 'Stream and discover music, create playlists, follow artists',
      icon: FaUser,
      color: 'from-blue-500 to-cyan-500',
      gradient: 'bg-gradient-to-br from-blue-500 to-cyan-500',
    },
    {
      id: 'ARTIST',
      title: 'Artist/Creator',
      description: 'Upload your music, grow your audience, earn from your creations',
      icon: FaMusic,
      color: 'from-purple-500 to-pink-500',
      gradient: 'bg-gradient-to-br from-purple-500 to-pink-500',
    },
    {
      id: 'RESELLER',
      title: 'Reseller',
      description: 'Sell music and earn commissions, build your customer base',
      icon: FaStore,
      color: 'from-green-500 to-emerald-500',
      gradient: 'bg-gradient-to-br from-green-500 to-emerald-500',
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      // Validate form
      const newErrors: Record<string, string> = {};
      
      if (mode === 'register') {
        if (!formData.email) newErrors.email = 'Email is required';
        if (!formData.password) newErrors.password = 'Password is required';
        if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
        if (!formData.username) newErrors.username = 'Username is required';
        if (!formData.acceptedTerms) newErrors.acceptedTerms = 'You must accept the terms and conditions';
        if (!formData.acceptedPrivacy) newErrors.acceptedPrivacy = 'You must accept the privacy policy';
        if (!recaptchaToken) newErrors.recaptcha = 'Please complete the reCAPTCHA verification';
        
        // Role-specific validations
        if (selectedRole === 'ARTIST') {
          if (!formData.artistName) newErrors.artistName = 'Artist name is required';
          if (!formData.stageName) newErrors.stageName = 'Stage name is required';
        }
        if (selectedRole === 'RESELLER') {
          if (!formData.businessName) newErrors.businessName = 'Business name is required';
        }
      } else {
        if (!formData.email) newErrors.email = 'Email is required';
        if (!formData.password) newErrors.password = 'Password is required';
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        setLoading(false);
        return;
      }

      if (mode === 'login') {
        await signIn(formData.email, formData.password, selectedRole);
        onClose();
      } else {
        const userData = await signUp({
          email: formData.email,
          password: formData.password,
          username: formData.username,
          displayName: formData.displayName,
          role: selectedRole,
          phoneNumber: formData.phoneNumber,
          artistName: formData.artistName,
          stageName: formData.stageName,
          businessName: formData.businessName,
          businessType: formData.businessType,
          acceptedTerms: formData.acceptedTerms,
          acceptedPrivacy: formData.acceptedPrivacy,
          marketingEmails: formData.marketingEmails,
          dataSharing: formData.dataSharing,
          recaptchaToken,
        });

        // Redirect based on role after successful signup
        switch (userData.role) {
          case 'ARTIST':
            router.push('/for-artists');
            break;
          case 'RESELLER':
            router.push('/reseller-dashboard');
            break;
          default:
            // USER stays on current page
            break;
        }
        onClose();
      }
    } catch (error: unknown) {
      // normalize unknown to Error for safe access to message
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Auth error:', err);
      setErrors({ submit: err.message || 'Authentication failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignIn = async (provider: 'google' | 'facebook') => {
    try {
      setLoading(true);
      if (provider === 'google') {
        await signInWithGoogle(selectedRole);
      } else {
        await signInWithFacebook(selectedRole);
      }
      onClose();
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      setErrors({ submit: err.message || 'Social authentication failed' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      username: '',
      displayName: '',
      phoneNumber: '',
      artistName: '',
      stageName: '',
      businessName: '',
      businessType: '',
      acceptedTerms: false,
      acceptedPrivacy: false,
      marketingEmails: false,
      dataSharing: false,
    });
    setErrors({});
    setRecaptchaToken('');
  };

  const getRoleSpecificFields = () => {
    switch (selectedRole) {
      case 'ARTIST':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Artist Name *
                </label>
                <input
                  type="text"
                  required
                  className="w-full bg-[#0a1f29] border border-[#0a3747] rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  value={formData.artistName}
                  onChange={(e) => setFormData(prev => ({ ...prev, artistName: e.target.value }))}
                  placeholder="Your official artist name"
                />
                {errors.artistName && <p className="text-red-400 text-sm mt-1">{errors.artistName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Stage Name *
                </label>
                <input
                  type="text"
                  required
                  className="w-full bg-[#0a1f29] border border-[#0a3747] rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  value={formData.stageName}
                  onChange={(e) => setFormData(prev => ({ ...prev, stageName: e.target.value }))}
                  placeholder="Your performance name"
                />
                {errors.stageName && <p className="text-red-400 text-sm mt-1">{errors.stageName}</p>}
              </div>
            </div>
          </div>
        );
      case 'RESELLER':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Business Name *
              </label>
              <input
                type="text"
                required
                className="w-full bg-[#0a1f29] border border-[#0a3747] rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                value={formData.businessName}
                onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                placeholder="Your business name"
              />
              {errors.businessName && <p className="text-red-400 text-sm mt-1">{errors.businessName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Business Type
              </label>
              <select
                className="w-full bg-[#0a1f29] border border-[#0a3747] rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                value={formData.businessType}
                onChange={(e) => setFormData(prev => ({ ...prev, businessType: e.target.value }))}
              >
                <option value="">Select business type</option>
                <option value="INDIVIDUAL">Individual</option>
                <option value="COMPANY">Company</option>
                <option value="PARTNERSHIP">Partnership</option>
                <option value="NON_PROFIT">Non-Profit</option>
              </select>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-gradient-to-br from-[#0a3747] to-[#0a1f29] rounded-2xl p-6 w-full max-w-md border border-[#e51f48]/20 shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-[#e51f48] to-[#ff4d6d] bg-clip-text text-transparent">
            {mode === 'role' ? 'Choose Your Role' :
             mode === 'login' ? 'Welcome Back' : 
             `Join as ${selectedRole === 'USER' ? 'Music Lover' : selectedRole === 'ARTIST' ? 'Artist' : 'Reseller'}`}
          </h2>
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Role Selection */}
        {mode === 'role' && (
          <div className="space-y-4">
            <p className="text-gray-300 text-center mb-6">
              Choose how you want to experience Fwaya Music
            </p>
            <div className="grid gap-3">
              {roles.map((role) => {
                const Icon = role.icon;
                return (
                  <button
                    key={role.id}
                    onClick={() => onSwitchMode('register', role.id)}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      selectedRole === role.id
                        ? `border-[#e51f48] ${role.gradient} text-white`
                        : 'border-[#0a3747] bg-[#0a3747] hover:border-[#e51f48] text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-6 h-6 ${
                        selectedRole === role.id ? 'text-white' : 'text-[#e51f48]'
                      }`} />
                      <div>
                        <h3 className="font-semibold">{role.title}</h3>
                        <p className="text-sm opacity-80">{role.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            
            <div className="pt-4 border-t border-[#0a3747]">
              <p className="text-gray-400 text-center mb-4">Already have an account?</p>
              <button
                onClick={() => onSwitchMode('login', selectedRole)}
                className="w-full py-3 border-2 border-[#0a3747] text-gray-300 hover:border-[#e51f48] hover:text-white rounded-lg transition-all duration-200"
              >
                Sign In to Existing Account
              </button>
            </div>
          </div>
        )}

        {/* Login/Register Form */}
        {(mode === 'login' || mode === 'register') && (
          <>
            {/* Role Badge */}
            <div className={`mb-6 p-3 rounded-lg ${
              selectedRole === 'USER' ? 'bg-blue-500/20 border border-blue-500/30' :
              selectedRole === 'ARTIST' ? 'bg-purple-500/20 border border-purple-500/30' :
              'bg-green-500/20 border border-green-500/30'
            }`}>
              <div className="flex items-center gap-2 text-sm">
                {selectedRole === 'USER' && <FaUser className="text-blue-400" />}
                {selectedRole === 'ARTIST' && <FaMusic className="text-purple-400" />}
                {selectedRole === 'RESELLER' && <FaStore className="text-green-400" />}
                <span className="text-white font-medium">
                  {selectedRole === 'USER' ? 'Music Lover' : 
                   selectedRole === 'ARTIST' ? 'Artist Account' : 'Reseller Account'}
                </span>
                <button
                  onClick={() => onSwitchMode('role', selectedRole)}
                  className="ml-auto text-xs text-gray-400 hover:text-white underline"
                >
                  Change
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Username *
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full bg-[#0a1f29] border border-[#0a3747] rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#e51f48] focus:border-transparent transition-all duration-200"
                        value={formData.username}
                        onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                        placeholder="username"
                      />
                      {errors.username && <p className="text-red-400 text-sm mt-1">{errors.username}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Display Name
                      </label>
                      <input
                        type="text"
                        className="w-full bg-[#0a1f29] border border-[#0a3747] rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#e51f48] focus:border-transparent transition-all duration-200"
                        value={formData.displayName}
                        onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                        placeholder="Your name"
                      />
                    </div>
                  </div>

                  {getRoleSpecificFields()}
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  className="w-full bg-[#0a1f29] border border-[#0a3747] rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#e51f48] focus:border-transparent transition-all duration-200"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="your@email.com"
                />
                {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password {mode === 'register' && '*'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="w-full bg-[#0a1f29] border border-[#0a3747] rounded-lg px-4 py-3 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-[#e51f48] focus:border-transparent transition-all duration-200"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder={mode === 'register' ? 'At least 8 characters' : 'Your password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password}</p>}
              </div>

              {mode === 'register' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Confirm Password *
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="w-full bg-[#0a1f29] border border-[#0a3747] rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#e51f48] focus:border-transparent transition-all duration-200"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirm your password"
                  />
                  {errors.confirmPassword && <p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>}
                </div>
              )}

              {mode === 'register' && (
                <>
                  {/* reCAPTCHA */}
                  <div className="flex justify-center">
                    <ReCAPTCHA
                      onVerify={setRecaptchaToken}
                      onExpire={() => setRecaptchaToken('')}
                      onError={(error) => setErrors(prev => ({ ...prev, recaptcha: error }))}
                    />
                  </div>
                  {errors.recaptcha && <p className="text-red-400 text-sm text-center">{errors.recaptcha}</p>}

                  {/* Terms and Conditions */}
                  <div className="bg-[#0a1f29] rounded-lg p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        required
                        className="mt-1 w-4 h-4 text-[#e51f48] bg-[#0a3747] border-[#0a3747] rounded focus:ring-[#e51f48] focus:ring-2"
                        checked={formData.acceptedTerms}
                        onChange={(e) => setFormData(prev => ({ ...prev, acceptedTerms: e.target.checked }))}
                      />
                      <label className="text-sm text-gray-300">
                        I agree to the <a href="/terms" className="text-[#e51f48] hover:underline">Terms of Service</a> and <a href="/privacy" className="text-[#e51f48] hover:underline">Privacy Policy</a> *
                      </label>
                    </div>
                    {errors.acceptedTerms && <p className="text-red-400 text-sm">{errors.acceptedTerms}</p>}

                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        className="mt-1 w-4 h-4 text-[#e51f48] bg-[#0a3747] border-[#0a3747] rounded focus:ring-[#e51f48] focus:ring-2"
                        checked={formData.acceptedPrivacy}
                        onChange={(e) => setFormData(prev => ({ ...prev, acceptedPrivacy: e.target.checked }))}
                      />
                      <label className="text-sm text-gray-300">
                        I acknowledge that I have read and understood how my personal data will be processed *
                      </label>
                    </div>
                    {errors.acceptedPrivacy && <p className="text-red-400 text-sm">{errors.acceptedPrivacy}</p>}
                  </div>
                </>
              )}

              {errors.submit && (
                <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                  <p className="text-red-400 text-sm text-center">{errors.submit}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#e51f48] to-[#ff4d6d] hover:from-[#ff4d6d] hover:to-[#e51f48] text-white py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                    {mode === 'login' ? 'Signing In...' : 'Creating Account...'}
                  </div>
                ) : (
                  mode === 'login' ? 'Sign In' : 'Create Account'
                )}
              </button>
            </form>

            {/* Social Login */}
            {(mode === 'login' || mode === 'register') && (
              <div className="mt-6">
                <div className="relative mb-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#0a3747]"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-gradient-to-br from-[#0a3747] to-[#0a1f29] text-gray-400">
                      Or continue with
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleSocialSignIn('google')}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 p-3 bg-white text-gray-800 rounded-lg hover:bg-gray-100 transition-colors font-medium disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Google
                  </button>
                  <button
                    onClick={() => handleSocialSignIn('facebook')}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Facebook
                  </button>
                </div>
              </div>
            )}

            {/* Switch between login/register */}
            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  resetForm();
                  onSwitchMode(mode === 'login' ? 'register' : 'login', selectedRole);
                }}
                className="text-[#e51f48] hover:text-[#ff4d6d] hover:underline text-sm transition-colors duration-200"
              >
                {mode === 'login'
                  ? "Don't have an account? Sign up"
                  : "Already have an account? Sign in"}
              </button>
            </div>
          </>
        )}

        {/* Premium Features */}
        {(mode === 'login' || mode === 'register') && (
          <div className="mt-6 p-4 bg-gradient-to-r from-[#0a1f29] to-[#0a3747] rounded-xl border border-[#e51f48]/10">
            <h4 className="font-semibold text-white mb-3 flex items-center justify-center gap-2">
              <FaCrown className="text-amber-400" />
              Unlock All Premium Features
            </h4>
            <ul className="text-sm text-gray-300 space-y-2">
              <li className="flex items-center gap-3">
                <FaHeadphones className="text-green-400 flex-shrink-0" />
                <span>Unlimited streaming & high quality audio</span>
              </li>
              <li className="flex items-center gap-3">
                <FaDownload className="text-blue-400 flex-shrink-0" />
                <span>Offline downloads for your favorite tracks</span>
              </li>
              <li className="flex items-center gap-3">
                <FaShare className="text-purple-400 flex-shrink-0" />
                <span>Share music with friends & communities</span>
              </li>
              <li className="flex items-center gap-3">
                <FaCrown className="text-amber-400 flex-shrink-0" />
                <span>Exclusive premium content access</span>
              </li>
            </ul>
          </div>
        )}
      </motion.div>
    </div>
  );
};