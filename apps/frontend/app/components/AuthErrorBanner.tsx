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
          className="fixed top-4 inset-x-4 z-50 max-w-lg mx-auto rounded-none bg-purple-600 px-4 py-2.5 sm:px-5 sm:py-3 shadow-2xl"
        >
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <div className="text-xs font-semibold uppercase tracking-wide text-purple-100">Error</div>
              <div className="mt-1 text-sm text-white leading-5">{error.message}</div>
              {error.redirectTo && error.redirectLabel ? (
                <div className="mt-3">
                  <Link href={error.redirectTo} className="inline-flex items-center gap-2 rounded-md bg-purple-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-purple-800">
                    {error.redirectLabel}
                  </Link>
                </div>
              ) : null}
            </div>

            <div className="ml-3 flex-shrink-0">
              <button
                aria-label="Close alert"
                onClick={() => setVisible(false)}
                className="inline-flex h-6 w-6 items-center justify-center text-white hover:text-white text-base"
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