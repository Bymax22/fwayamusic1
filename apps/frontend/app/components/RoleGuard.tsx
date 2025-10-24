// components/EnhancedRoleGuard.tsx
"use client";

import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

interface EnhancedRoleGuardProps {
  children: React.ReactNode;
  allowedRoles: ('USER' | 'ARTIST' | 'RESELLER' | 'ADMIN' | 'MODERATOR')[];
  fallbackPath?: string;
  showLoading?: boolean;
  requireEmailVerification?: boolean;
  requireKYC?: boolean;
  customLoadingComponent?: React.ReactNode;
}

export default function EnhancedRoleGuard({ 
  children, 
  allowedRoles, 
  fallbackPath = '/auth/user/signin',
  showLoading = true,
  requireEmailVerification = false,
  requireKYC = false,
  customLoadingComponent
}: EnhancedRoleGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [accessChecked, setAccessChecked] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      let shouldRedirect = false;
      let redirectPath = fallbackPath;

      // Check role
      if (!allowedRoles.includes(user.role)) {
        shouldRedirect = true;
        // Redirect to appropriate dashboard based on user's actual role
        switch (user.role) {
          case 'USER':
            redirectPath = '/dashboard';
            break;
          case 'ARTIST':
            redirectPath = '/for-artists';
            break;
          case 'RESELLER':
            redirectPath = '/reseller-dashboard';
            break;
          case 'ADMIN':
          case 'MODERATOR':
            redirectPath = '/admin';
            break;
          default:
            redirectPath = fallbackPath;
        }
      }

      // Check email verification if required
      if (requireEmailVerification && !user.isEmailVerified) {
        shouldRedirect = true;
        redirectPath = '/auth/verify-email';
      }

      // Check KYC status if required (for artists/resellers)
      if (requireKYC && user.role !== 'USER' && user.kycStatus !== 'APPROVED') {
        shouldRedirect = true;
        redirectPath = `/auth/${user.role.toLowerCase()}/verification`;
      }

      if (shouldRedirect) {
        // Add current path as callback URL for after login/verification
        const callbackUrl = encodeURIComponent(pathname);
        router.push(`${redirectPath}?callbackUrl=${callbackUrl}`);
      } else {
        setAccessChecked(true);
      }
    } else if (!loading && !user) {
      // No user logged in
      const callbackUrl = encodeURIComponent(pathname);
      router.push(`${fallbackPath}?callbackUrl=${callbackUrl}`);
    }
  }, [user, loading, allowedRoles, fallbackPath, requireEmailVerification, requireKYC, router, pathname]);

  // Show loading state
  if (loading && showLoading) {
    return customLoadingComponent || (
      <div className="min-h-screen bg-gradient-to-b from-[#0a1f29] to-[#0a3747] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#e51f48] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // Don't render until access is checked and granted
  if (!user || !accessChecked) {
    return null;
  }

  return <>{children}</>;
}