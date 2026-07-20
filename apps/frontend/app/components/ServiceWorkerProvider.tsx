'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export function ServiceWorkerProvider() {
  const router = useRouter();
  const pathname = usePathname();
  const { isOnline, connectionQuality, shouldRedirectToDownloads } = useNetworkStatus();

  // Register service worker on mount
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);

          // Check for updates periodically
          setInterval(() => {
            registration.update();
          }, 60000); // Check every minute
        })
        .catch((error) => {
          console.warn('Service Worker registration failed:', error);
        });
    }
  }, []);

  // Redirect to downloads when offline/poor connection
  useEffect(() => {
    // Pages that should redirect when offline
    const protectedRoutes = [
      '/browse',
      '/discover',
      '/library',
      '/trending',
      '/search',
      '/artist',
      '/playlist',
      '/videos',
      '/profile',
    ];

    const isProtectedRoute = protectedRoutes.some((route) =>
      pathname?.startsWith(route)
    );

    if (isProtectedRoute && shouldRedirectToDownloads()) {
      // Add a small delay to prevent flashing
      const timer = setTimeout(() => {
        router.push('/download');
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [pathname, shouldRedirectToDownloads, router]);

  // You could add additional logic here, like showing a toast notification
  // when connection status changes
  useEffect(() => {
    if (!isOnline) {
      console.log('User is now offline');
    } else {
      console.log('User is online with', connectionQuality, 'connection quality');
    }
  }, [isOnline, connectionQuality]);

  return null; // This component doesn't render anything
}
