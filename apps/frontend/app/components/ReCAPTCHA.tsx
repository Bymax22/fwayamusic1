
"use client";

import { useEffect, useRef, useState } from 'react';

type GrecaptchaOptions = Record<string, unknown>;
declare global {
  interface Window {
    grecaptcha?: {
      render: (el: HTMLElement, options: GrecaptchaOptions) => number;
      reset: (id: number) => void;
      execute?: (...args: unknown[]) => Promise<string>;
      ready?: (cb: () => void) => void;
    };
  }
}

interface ReCAPTCHAProps {
  onVerify: (token: string) => void;
  onExpire: () => void;
  onError: (error: string) => void;
  theme?: 'light' | 'dark';
  size?: 'normal' | 'compact';
}

export function ReCAPTCHA({
  onVerify,
  onExpire,
  onError,
  theme = 'light',
  size = 'normal'
}: ReCAPTCHAProps) {
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const injectRecaptchaScript = () => {
    if (document.querySelector('script[src*="recaptcha/api.js"]')) return;
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    const s = document.createElement('script');
    // For reCAPTCHA v3 we load the script with the site key so we can execute actions
    s.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    s.async = true;
    s.defer = true;
    s.onload = () => console.debug("reCAPTCHA script loaded");
    s.onerror = () => {
      const msg = "Failed to load reCAPTCHA script (network or CSP)";
      setLoadError(msg);
      onError(msg);
    };
    document.head.appendChild(s);
  };

  useEffect(() => {
    let poll: number | undefined;
    let timeoutHandle: number | undefined;
    let injectHandle: number | undefined;

    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    if (!siteKey) {
      const msg = 'reCAPTCHA site key not configured (NEXT_PUBLIC_RECAPTCHA_SITE_KEY)';
      setLoadError(msg);
      onError(msg);
      return;
    }

    const executeV3 = async () => {
      try {
        if (typeof window.grecaptcha === 'undefined') return false;
        if (typeof window.grecaptcha!.ready === 'function') {
          window.grecaptcha!.ready(async () => {
            try {
              const token = await window.grecaptcha!.execute!(siteKey, { action: 'register' } as any);
              onVerify(token as string);
              setIsLoaded(true);
            } catch (err) {
              const errMsg = 'reCAPTCHA execute failed';
              setLoadError(errMsg);
              onError(errMsg);
            }
          });
        } else {
          // fallback execute
          const token = await window.grecaptcha!.execute!(siteKey, { action: 'register' } as any);
          onVerify(token as string);
          setIsLoaded(true);
        }
        return true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to execute reCAPTCHA';
        setLoadError(errorMessage);
        onError(errorMessage);
        return false;
      }
    };

    // If grecaptcha already present, try execute immediately
    if (typeof window.grecaptcha !== 'undefined') {
      executeV3();
    } else {
      // Inject script after a short delay
      injectHandle = window.setTimeout(() => {
        injectRecaptchaScript();
      }, 500);

      const start = Date.now();
      // Poll for grecaptcha for up to 20s
      poll = window.setInterval(() => {
        if (typeof window.grecaptcha !== 'undefined') {
          executeV3().then((ok) => {
            if (ok) {
              if (poll) { clearInterval(poll); poll = undefined; }
              if (timeoutHandle) { clearTimeout(timeoutHandle); timeoutHandle = undefined; }
              if (injectHandle) { clearTimeout(injectHandle); injectHandle = undefined; }
            }
          });
        } else if (Date.now() - start > 20000) {
          const msg = 'Timeout loading reCAPTCHA (grecaptcha not available)';
          setLoadError(msg);
          onError(msg);
          if (poll) { clearInterval(poll); poll = undefined; }
          if (injectHandle) { clearTimeout(injectHandle); injectHandle = undefined; }
        }
      }, 300);

      // overall safety timeout
      timeoutHandle = window.setTimeout(() => {
        if (poll) { clearInterval(poll); poll = undefined; }
        const msg = 'Timeout loading reCAPTCHA (overall)';
        setLoadError(msg);
        onError(msg);
      }, 23000);
    }

    return () => {
      if (poll) clearInterval(poll);
      if (timeoutHandle) clearTimeout(timeoutHandle);
      if (injectHandle) clearTimeout(injectHandle);
    };
  }, [onVerify, onExpire, onError, theme, size]);

  const resetReCAPTCHA = async () => {
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    if (!siteKey || typeof window.grecaptcha === 'undefined') return;
    try {
      const token = await window.grecaptcha!.execute!(siteKey, { action: 'register' } as any);
      onVerify(token as string);
    } catch (err) {
      const errMsg = 'Failed to refresh reCAPTCHA token';
      setLoadError(errMsg);
      onError(errMsg);
    }
  };

  if (loadError) {
    return (
      <div className="text-center p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600 text-sm mb-2">{loadError}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-red-600 hover:text-red-800 text-sm underline"
        >
          Reload page
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div ref={recaptchaRef} />
      {isLoaded && (
        <button
          onClick={resetReCAPTCHA}
          className="mt-2 text-sm text-gray-500 hover:text-gray-700 underline"
          type="button"
        >
          Reset reCAPTCHA
        </button>
      )}
    </div>
  );
}
