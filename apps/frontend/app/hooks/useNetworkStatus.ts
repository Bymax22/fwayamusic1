'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor' | 'offline'>('excellent');
  const router = useRouter();

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine);

    // Handle online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      setConnectionQuality('excellent');
    };

    const handleOffline = () => {
      setIsOnline(false);
      setConnectionQuality('offline');
    };

    // Check connection quality if online
    const checkConnectionQuality = () => {
      if (!navigator.onLine) {
        setConnectionQuality('offline');
        return;
      }

      // Use navigator.connection if available (not in all browsers)
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        if (connection.saveData) {
          setConnectionQuality('poor');
          return;
        }

        const effectiveType = connection.effectiveType;
        if (effectiveType === '4g') {
          setConnectionQuality('excellent');
        } else if (effectiveType === '3g') {
          setConnectionQuality('good');
        } else if (effectiveType === '2g') {
          setConnectionQuality('poor');
        } else {
          setConnectionQuality('good');
        }
      }
    };

    // Register event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Register connection change listener if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener('change', checkConnectionQuality);
    }

    // Check quality initially
    checkConnectionQuality();

    // Check quality periodically
    const interval = setInterval(checkConnectionQuality, 10000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        connection.removeEventListener('change', checkConnectionQuality);
      }
      clearInterval(interval);
    };
  }, []);

  const shouldRedirectToDownloads = useCallback(() => {
    if (!isOnline) return true;
    if (connectionQuality === 'poor' || connectionQuality === 'offline') return true;
    return false;
  }, [isOnline, connectionQuality]);

  return { isOnline, connectionQuality, shouldRedirectToDownloads };
}
