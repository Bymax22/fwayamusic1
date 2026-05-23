"use client";

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { AuthErrorInfo } from '@/lib/auth-error-utils';
import { useState, useEffect } from 'react';

type Props = {
  error: AuthErrorInfo | null;
};

export default function AuthErrorBanner({ error }: Props) {
  const [visible, setVisible] = useState<boolean>(false);

  useEffect(() => {
    setVisible(Boolean(error?.message));
  }, [error]);

  if (!error?.message) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="fixed top-4 inset-x-4 z-50 max-w-lg mx-auto rounded-sm bg-purple-600/80 border border-white/8 px-3 py-1 sm:px-5 sm:py-2 shadow-2xl backdrop-blur-sm"
        >
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <div className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.28em] text-purple-100">Error</div>
              <div className="mt-1 text-xs sm:text-sm text-white leading-5">{error.message}</div>
              {error.redirectTo && error.redirectLabel ? (
                <div className="mt-3">
                  <Link href={error.redirectTo} className="inline-flex items-center gap-2 rounded-md bg-purple-700 px-2.5 py-1 text-xs sm:px-3 sm:py-1.5 sm:text-sm font-semibold text-white hover:bg-purple-800">
                    {error.redirectLabel}
                  </Link>
                </div>
              ) : null}
            </div>

            <div className="ml-3 flex-shrink-0">
              <button
                aria-label="Close alert"
                onClick={() => setVisible(false)}
                className="inline-flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center text-white hover:text-white text-sm"
              >
                ×
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}