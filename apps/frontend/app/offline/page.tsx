'use client';

import { useEffect, useState } from 'react';
import { Wifi, WifiOff, Download, Music, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(true);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineMessage(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineMessage(true);
    };

    setIsOnline(navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-900/10 to-black flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-6 flex justify-center">
          {isOnline ? (
            <Wifi className="w-16 h-16 text-green-400 animate-pulse" />
          ) : (
            <WifiOff className="w-16 h-16 text-red-400 animate-pulse" />
          )}
        </div>

        {!isOnline ? (
          <>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
              You're Offline
            </h1>
            <p className="text-gray-400 mb-6 text-lg">
              No internet connection detected. Your downloaded tracks are available in the offline library.
            </p>

            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-8">
              <div className="flex gap-3 items-start">
                <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-300 text-left">
                  Some features may be limited without internet. Streaming and library sync will be unavailable.
                </p>
              </div>
            </div>

            <Link
              href="/download"
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors mb-4 w-full justify-center"
            >
              <Download className="w-5 h-5" />
              Go to Downloads
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
              You're Back Online
            </h1>
            <p className="text-gray-400 mb-6 text-lg">
              Great! Your internet connection is restored.
            </p>

            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-8">
              <div className="flex gap-3 items-start">
                <Wifi className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-green-300 text-left">
                  All features are now available. You can stream, sync, and access the full library.
                </p>
              </div>
            </div>

            <Link
              href="/browse"
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors mb-4 w-full justify-center"
            >
              <Music className="w-5 h-5" />
              Browse Library
            </Link>
          </>
        )}

        <Link
          href="/"
          className="text-gray-400 hover:text-white text-sm transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
