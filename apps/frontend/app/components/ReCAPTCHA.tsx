
"use client";

import { useEffect, useRef, useState, forwardRef, useImperativeHandle, useCallback } from 'react';

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

export interface ReCAPTCHAHandle {
  refreshToken: () => Promise<void>;
}

export const ReCAPTCHA = forwardRef<ReCAPTCHAHandle, ReCAPTCHAProps>(({
  onVerify,
  onExpire,
  onError,
  theme = 'light',
  size = 'normal'
}, ref) => {
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const siteKeyRef = useRef<string>('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Expose the refresh method to parent components
  useImperativeHandle(ref, () => ({
    refreshToken: async () => {
      return new Promise<void>((resolve, reject) => {
        if (!siteKeyRef.current || typeof window.grecaptcha === 'undefined') {
          reject(new Error('reCAPTCHA not available'));
          return;
        }
        try {
          window.grecaptcha!.execute!(siteKeyRef.current, { action: 'register' } as unknown)
            .then((token: string) => {
              console.debug('reCAPTCHA token refreshed via handle');
              onVerify(String(token));
              resolve();
            })
            .catch((err: Error) => {
              console.error('Failed to refresh reCAPTCHA token:', err);
              reject(err);
            });
        } catch (error) {
          console.error('Error refreshing reCAPTCHA token:', error);
          reject(error);
        }
      });
    }
  }));

  const injectRecaptchaScript = useCallback(() => {
    if (document.querySelector('script[src*="recaptcha/api.js"]')) {
      console.debug('reCAPTCHA script already loaded');
      return;
    }
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    if (!siteKey) {
      const msg = 'reCAPTCHA site key not configured';
      console.error(msg);
      setLoadError(msg);
      onError(msg);
      return;
    }
    siteKeyRef.current = siteKey;
    const s = document.createElement('script');
    // For reCAPTCHA v3 we load the script with the site key so we can execute actions
    s.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    s.async = true;
    s.defer = true;
    s.onload = () => {
      console.debug("reCAPTCHA script loaded successfully");
    };
    s.onerror = () => {
      const msg = "Failed to load reCAPTCHA script (network or CSP)";
      console.error(msg);
      setLoadError(msg);
      onError(msg);
    };
    document.head.appendChild(s);
  }, [onError]);

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
        if (typeof window.grecaptcha === 'undefined') {
          console.warn('grecaptcha not available');
          return false;
        }
        const siteKey = siteKeyRef.current || process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
        if (!siteKey) {
          console.error('No reCAPTCHA site key available');
          return false;
        }
        siteKeyRef.current = siteKey;
        
        if (typeof window.grecaptcha!.ready === 'function') {
          window.grecaptcha!.ready(async () => {
            try {
              console.debug('Executing reCAPTCHA token generation...');
              const token = await window.grecaptcha!.execute!(siteKey, { action: 'register' } as unknown);
              console.debug('reCAPTCHA token generated successfully:', {
                tokenLength: String(token).length,
                tokenType: typeof token,
              });
              onVerify(String(token));
              setIsLoaded(true);
            } catch (error) {
              console.error('reCAPTCHA execute error:', error);
              const errMsg = 'reCAPTCHA execute failed';
              setLoadError(errMsg);
              onError(errMsg);
            }
          });
        } else {
          // fallback execute
          console.debug('Executing reCAPTCHA token generation (fallback)...');
          const token = await window.grecaptcha!.execute!(siteKey, { action: 'register' } as unknown);
          console.debug('reCAPTCHA token generated successfully (fallback):', {
            tokenLength: String(token).length,
            tokenType: typeof token,
          });
          onVerify(String(token));
          setIsLoaded(true);
        }
        return true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to execute reCAPTCHA';
        console.error('reCAPTCHA executeV3 error:', error);
        setLoadError(errorMessage);
        onError(errorMessage);
        return false;
      }
    };

    // If grecaptcha already present, try execute immediately
    if (typeof window.grecaptcha !== 'undefined') {
      console.debug('grecaptcha already available, executing immediately');
      executeV3();
    } else {
      console.debug('grecaptcha not yet available, injecting script');
      // Inject script after a short delay
      injectHandle = window.setTimeout(() => {
        injectRecaptchaScript();
      }, 500);

      const start = Date.now();
      // Poll for grecaptcha for up to 20s
      poll = window.setInterval(() => {
        if (typeof window.grecaptcha !== 'undefined') {
          console.debug('grecaptcha became available, executing...');
          executeV3().then((ok) => {
            if (ok) {
              console.debug('executeV3 completed successfully');
              if (poll) { clearInterval(poll); poll = undefined; }
              if (timeoutHandle) { clearTimeout(timeoutHandle); timeoutHandle = undefined; }
              if (injectHandle) { clearTimeout(injectHandle); injectHandle = undefined; }
            }
          }).catch((e) => {
            console.error('executeV3 promise error:', e);
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
    }, [onVerify, onExpire, onError, theme, size, injectRecaptchaScript]);

  const resetReCAPTCHA = async () => {
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    if (!siteKey || typeof window.grecaptcha === 'undefined') {
      console.warn('Cannot reset reCAPTCHA: siteKey or grecaptcha not available');
      return;
    }
    try {
      console.debug('Refreshing reCAPTCHA token...');
      const token = await window.grecaptcha!.execute!(siteKey, { action: 'register' } as unknown);
      console.debug('reCAPTCHA token refreshed:', {
        tokenLength: String(token).length,
      });
      onVerify(String(token));
    } catch (error) {
      console.error('resetReCAPTCHA error:', error);
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
});

ReCAPTCHA.displayName = 'ReCAPTCHA';