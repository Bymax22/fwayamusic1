// context/AuthContext.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendEmailVerification,
  updateProfile,
  sendPasswordResetEmail
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
  kycStatus: 'NOT_SUBMITTED' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'ADDITIONAL_INFO_NEEDED';
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
  signIn: (email: string, password: string, role?: UserRole) => Promise<void>;
  signInWithGoogle: (role?: UserRole) => Promise<void>;
  signInWithFacebook: (role?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  getToken: () => Promise<string | null>;
  forgotPassword: (email: string) => Promise<void>;
  verifyOTP: (method: 'email' | 'phone', code: string) => Promise<boolean>;
  sendOTP: (method: 'email' | 'phone', identifier: string) => Promise<void>;
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
  recaptchaToken: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
       // persist short-lived token for other components if they need it
       if (typeof window !== 'undefined' && token) localStorage.setItem('authToken', token);
       
       const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/me`, {
         headers: {
           'Authorization': `Bearer ${token}`,
         },
       });

      if (response.ok) {
        const userData: User = await response.json();
        setUser(userData);
        return userData;
       } else {
         // User exists in Firebase but not in our database - sign them out
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
    try {
      setLoading(true);

     // Verify reCAPTCHA token
    // Verify reCAPTCHA token with our backend
    const recaptchaResponse = await fetch('/api/auth/verify-recaptcha', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: data.recaptchaToken }),
    });

    const recaptchaResult = await recaptchaResponse.json();
    
    if (!recaptchaResult.success) {
      throw new Error(recaptchaResult.message || 'reCAPTCHA verification failed');
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

   // Send email verification
      await sendEmailVerification(firebaseUser);

      // For artists and resellers, send OTP for additional verification
      if (data.role === 'ARTIST' || data.role === 'RESELLER') {
        await sendOTP('email', data.email);
      }


     // Create user in backend
      const token = await firebaseUser.getIdToken();
      const backendResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });


     if (!backendResponse.ok) {
        const errorData = await backendResponse.json();
        throw new Error(errorData.message || 'Failed to create user in backend');
      }

      const userData = await backendResponse.json();
      setUser(userData);
      return userData;
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Sign up error:', error);
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
      // Check role access
      if (role && userData.role !== role) {
        await signOut(auth);
        throw new Error(`Access denied. This page is for ${role.toLowerCase()}s only.`);
      }
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

  const sendOTP = async (method: 'email' | 'phone', identifier: string): Promise<void> => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ method, identifier }),
      });

      if (!response.ok) {
        throw new Error('Failed to send OTP');
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

const signInWithGoogle = async () => {
  try {
    setLoading(true);
    const result = await signInWithPopup(auth, googleProvider);
    await handleSocialSignIn(result.user);
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

const signInWithFacebook = async () => {
  try {
    setLoading(true);
    const result = await signInWithPopup(auth, facebookProvider);
    await handleSocialSignIn(result.user);
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

  const handleSocialSignIn = async (firebaseUser: FirebaseUser) => {
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
      setUser(userData);
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
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};