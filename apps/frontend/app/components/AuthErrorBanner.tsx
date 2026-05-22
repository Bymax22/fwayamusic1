"use client";

import Link from 'next/link';
import { AuthErrorInfo } from '@/lib/auth-error-utils';

type Props = {
  error: AuthErrorInfo | null;
};

export default function AuthErrorBanner({ error }: Props) {
  if (!error?.message) return null;

  return (
    <div className="rounded-3xl border border-violet-700/50 bg-violet-900/95 p-4 mb-6 text-white shadow-xl">
      <div className="flex flex-col gap-3">
        <div className="text-sm font-semibold uppercase tracking-[0.12em] text-violet-200">
          Authentication issue
        </div>
        <p className="text-sm leading-6 text-violet-100">{error.message}</p>
        {error.redirectTo && error.redirectLabel ? (
          <div className="flex flex-wrap gap-3">
            <Link
              href={error.redirectTo}
              className="inline-flex items-center justify-center rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              {error.redirectLabel}
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}