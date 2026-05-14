// context/AuthContext.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  deleteUser,
} from 'firebase/auth';
import { auth, googleProvider, facebookProvider } from '@/lib/firebase-config';

// local UserRole type used by auth helpers/components
type UserRole = 'USER' | 'ARTIST' | 'RESELLER' | 'ADMIN' | 'MODERATOR';


interface User {
  id: number;
  email: string;
  username: string;
  displayName?: string | null;
  avatarUrl?: string;
  role: 'USER' | 'ARTIST' | 'RESELLER' | 'ADMIN' | 'MODERATOR';
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'VERIFIED' | 'REJECTED';
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  kycStatus?: 'NOT_SUBMITTED' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'ADDITIONAL_INFO_NEEDED';
  isPremium: boolean;
  premiumUntil?: string | null;
  walletBalance?: number;
  totalEarnings?: number;
  artistName?: string;
  stageName?: string;
  businessName?: string;
  businessType?: string;
  bio?: string;
  website?: string;
  socialLinks?: Record<string, string>;
  country?: string;
  defaultCurrency?: string;
  resellerCode?: string | null;
  totalCommission?: number;
  paidCommission?: number;
  createdAt?: string; 
  isReseller?: boolean; 
}

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signUp: (data: SignUpData) => Promise<User>;
  signIn: (email: string, password: string, role?: UserRole) => Promise<User>;
  signInWithGoogle: (role?: UserRole) => Promise<User>;
  signInWithFacebook: (role?: UserRole) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  getToken: () => Promise<string | null>;
  forgotPassword: (email: string) => Promise<void>;
  verifyOTP: (method: 'email' | 'phone', code: string) => Promise<boolean>;
  sendOTP: (method: 'email' | 'phone' | 'link', identifier: string) => Promise<void>;
  verificationError: string | null;
  clearVerificationError: () => void;
}

interface SignUpData {
  email: string;
  password: string;
  username: string;
  displayName?: string;
  role: 'USER' | 'ARTIST' | 'RESELLER';
  phoneNumber?: string;
  dateOfBirth?: string;
  artistName?: string;
  stageName?: string;
  businessName?: string;
  businessType?: string;
  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
  marketingEmails: boolean;
  dataSharing: boolean;
  recaptchaToken?: string; // Made optional - can be empty for USER role temporarily
  avatarUrl?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getDashboardPath = (role?: UserRole | string) => {
  switch (role?.toUpperCase()) {
    case 'ARTIST':
      return '/for-artists';
    case 'RESELLER':
      return '/reseller-dashboard';
    case 'ADMIN':
    case 'MODERATOR':
      return '/admin';
    default:
      return '/';
  }
};

const ensureRoleMatch = async (userData: User, expectedRole?: UserRole) => {
  if (expectedRole && userData.role.toUpperCase() !== expectedRole.toUpperCase()) {
    await signOut(auth);
    throw new Error(`Access denied. This page is for ${expectedRole.toLowerCase()}s only.`);
  }
  return userData;
};

const cleanupFirebaseUser = async (user: FirebaseUser | null) => {
  if (!user) return;
  try {
    await deleteUser(user);
    console.debug('Deleted temporary Firebase user after signup failure:', user.email);
  } catch (cleanupError) {
    console.error('Failed to clean up Firebase user after signup failure:', cleanupError);
  }
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  const clearVerificationError = () => setVerificationError(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        // Get user data from backend
        await syncUserWithBackend(firebaseUser);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

 const syncUserWithBackend = async (firebaseUser: FirebaseUser): Promise<User | null> => {
     try {
       const token = await firebaseUser.getIdToken();
       console.log('Firebase token obtained, syncing with backend:', {
         email: firebaseUser.email,
         tokenLength: token.length,
         apiUrl: process.env.NEXT_PUBLIC_API_URL,
       });
       
       // persist short-lived token for other components if they need it
       if (typeof window !== 'undefined' && token) localStorage.setItem('authToken', token);
       
       const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/me`, {
         headers: {
           'Authorization': `Bearer ${token}`,
           'Content-Type': 'application/json',
         },
       });

       console.log('Backend /auth/me response status:', response.status);

       if (response.ok) {
        const userData: User = await response.json();
        console.log('Successfully synced user with backend:', userData.email);
        setUser(userData);
        return userData;
       } else {
         // Try to get error details
         let errorText = `HTTP ${response.status}`;
         try {
           const errorData = await response.json();
           errorText = errorData.message || errorData.error || errorText;
         } catch {
           errorText = await response.text() || errorText;
         }
         
         console.warn('Backend /auth/me failed:', {
           status: response.status,
           email: firebaseUser.email,
           error: errorText,
         });
         
         // For 401, don't automatically sign out - might be a transient issue
         if (response.status === 401) {
           console.warn('Unauthorized response from backend, will retry on next sync');
           return null;
         }
         
         // For other errors, sign out
         await signOut(auth);
         setUser(null);
        return null;
       }
    } catch (error) {
      console.error('Error syncing user with backend:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getToken = async (): Promise<string | null> => {
    try {
      if (!firebaseUser) return null;
      const t = await firebaseUser.getIdToken();
      // refresh storage
      if (typeof window !== 'undefined' && t) localStorage.setItem('authToken', t);
      return t;
    } catch (err) {
      console.error('getToken failed', err);
      return null;
    }
  };

const signUp = async (data: SignUpData): Promise<User> => {
    let firebaseUser: FirebaseUser | null = null;

    try {
      setLoading(true);

      console.debug('SignUp called with:', {
        email: data.email,
        role: data.role,
        hasRecaptchaToken: !!data.recaptchaToken,
      });

      // reCAPTCHA verification - skipped for USER role (temporarily disabled)
      if ((data.role === 'ARTIST' || data.role === 'RESELLER') && data.recaptchaToken) {
        console.debug('Verifying reCAPTCHA for', data.role);
        
        const recaptchaResponse = await fetch('/api/auth/verify-recaptcha', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: data.recaptchaToken }),
        });

        console.debug('reCAPTCHA verification response status:', recaptchaResponse.status);

        const recaptchaResult = await recaptchaResponse.json();
        
        if (!recaptchaResult.success) {
          console.error('reCAPTCHA verification failed:', recaptchaResult);
          throw new Error(recaptchaResult.message || 'reCAPTCHA verification failed');
        }
      }


// Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const firebaseUser = userCredential.user;

      // Update Firebase profile
      if (data.displayName) {
        await updateProfile(firebaseUser, {
          displayName: data.displayName,
        });
      }

      // Temporarily deactivate email verification
      // await sendEmailVerification(firebaseUser);


     // Create user in backend
      const token = await firebaseUser.getIdToken();
      // Store token for middleware
      if (typeof window !== 'undefined') {
        localStorage.setItem('authToken', token);
      }
      const backendResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!backendResponse.ok) {
        let errorMessage = 'Failed to create user in backend';
        try {
          const errorData = await backendResponse.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // If response is not JSON, try to get text
          const errorText = await backendResponse.text();
          errorMessage = errorText || `HTTP ${backendResponse.status}`;
          console.error('Backend error response (text):', errorText);
        }

        await cleanupFirebaseUser(firebaseUser);
        await signOut(auth);
        setUser(null);

        throw new Error(errorMessage);
      }

      const userData = await backendResponse.json();
      console.log('Signup response userData:', userData, 'Role:', userData?.role);
      setUser(userData);

      // After backend user is created, send magic-link for ARTIST/RESELLER so Verification record exists
      if (data.role === 'ARTIST' || data.role === 'RESELLER') {
        setVerificationError(null);
        try {
          await sendOTP('link', data.email);
          console.debug('Magic link sent after backend signup for', data.email);
        } catch (otpErr) {
          const message = otpErr instanceof Error
            ? otpErr.message
            : 'Failed to send verification link. Please check your email or try again.';
          console.error('Failed to send magic link after signup:', message, otpErr);
          setVerificationError(message);

          await cleanupFirebaseUser(firebaseUser);
          await signOut(auth);
          setUser(null);

          throw new Error(`Verification email failed to send: ${message}`);
        }
      }

      return userData;

    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Sign up error:', error);
        
        // Handle Firebase errors with user-friendly messages
        if ('code' in error) {
          const firebaseError = error as { code: string; message: string };
          switch (firebaseError.code) {
            case 'auth/email-already-in-use':
              throw new Error('This email is already registered. Please try signing in instead or use a different email.');
            case 'auth/weak-password':
              throw new Error('Password is too weak. Please choose a stronger password.');
            case 'auth/invalid-email':
              throw new Error('Invalid email address. Please check and try again.');
            case 'auth/operation-not-allowed':
              throw new Error('Email/password accounts are not enabled. Please contact support.');
            default:
              throw new Error(firebaseError.message || 'Failed to create account. Please try again.');
          }
        }
        
        throw error;
      } else {
        console.error('Sign up error:', error);
        throw new Error('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string, role?: UserRole) => {
    try {
      setLoading(true);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userData = await syncUserWithBackend(userCredential.user);
      if (!userData) {
        await signOut(auth);
        throw new Error('Failed to load user profile after sign in.');
      }
      await ensureRoleMatch(userData, role);
      return userData;
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Sign in error:', error);
        throw error;
      } else {
        console.error('Sign in error:', error);
        throw new Error('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  const sendOTP = async (method: 'email' | 'phone' | 'link', identifier: string): Promise<void> => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ method, identifier }),
      });

      if (!response.ok) {
        let errorText = `Failed to send OTP (status ${response.status})`;
        try {
          const errorData = await response.json();
          errorText = errorData.message || errorData.error || JSON.stringify(errorData);
        } catch {
          const rawText = await response.text();
          if (rawText) errorText = rawText;
        }
        throw new Error(errorText);
      }
    } catch (error) {
      console.error('OTP sending error:', error);
      throw error;
    }
  };

  const verifyOTP = async (method: 'email' | 'phone', code: string): Promise<boolean> => {
    try {
      const token = await getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ method, code }),
      });

      return response.ok;
    } catch (error) {
      console.error('OTP verification error:', error);
      return false;
    }
  };

    const forgotPassword = async (email: string): Promise<void> => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  };

const signInWithGoogle = async (role?: UserRole) => {
  try {
    setLoading(true);
    const result = await signInWithPopup(auth, googleProvider);
    const userData = await handleSocialSignIn(result.user, role);
    return userData;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Google sign in error:', error);
      throw error;
    } else {
      console.error('Google sign in error:', error);
      throw new Error('An unexpected error occurred.');
    }
  } finally {
    setLoading(false);
  }
};

const signInWithFacebook = async (role?: UserRole) => {
  try {
    setLoading(true);
    const result = await signInWithPopup(auth, facebookProvider);
    const userData = await handleSocialSignIn(result.user, role);
    return userData;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Facebook sign in error:', error);
      throw error;
    } else {
      console.error('Facebook sign in error:', error);
      throw new Error('An unexpected error occurred.');
    }
  } finally {
    setLoading(false);
  }
};

  const handleSocialSignIn = async (firebaseUser: FirebaseUser, role?: UserRole) => {
    const token = await firebaseUser.getIdToken();
    if (typeof window !== 'undefined' && token) localStorage.setItem('authToken', token);
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/social-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        avatarUrl: firebaseUser.photoURL,
        provider: firebaseUser.providerData[0]?.providerId,
      }),
    });

    if (response.ok) {
      const userData = await response.json();
      await ensureRoleMatch(userData, role);
      setUser(userData);
      return userData;
    } else {
      throw new Error('Failed to sync social login with backend');
    }
  };

const logout = async () => {
  try {
    setLoading(true);
    await signOut(auth);
    setUser(null);
    if (typeof window !== 'undefined') localStorage.removeItem('authToken');
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Logout error:', error);
      throw error;
    } else {
      console.error('Logout error:', error);
      throw new Error('An unexpected error occurred.');
    }
  } finally {
    setLoading(false);
  }
};

  const refreshUser = async () => {
    if (firebaseUser) {
      await syncUserWithBackend(firebaseUser);
    }
  };

  const value = {
    user,
    firebaseUser,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signInWithFacebook,
    logout,
    refreshUser,
    getToken,
    forgotPassword,
    verifyOTP,
    sendOTP,
    verificationError,
    clearVerificationError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};




