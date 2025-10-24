"use client";
import React, { useCallback } from "react";
import { ReCAPTCHA } from "./ReCAPTCHA";

export default function ReCAPTCHAWrapper({ onVerified }: { onVerified?: (token: string) => void }) {
  // handlers live in client component (no functions passed from server)
  const handleVerify = useCallback(
    (token: string) => {
      if (onVerified) onVerified(token);
      // optional: call API directly here if you prefer
      // fetch('/api/verify-recaptcha', { method: 'POST', body: JSON.stringify({ token }) })
    },
    [onVerified]
  );

  const handleExpire = useCallback(() => {
    // internal handling: you can show UI, reset state, etc.
    console.warn("reCAPTCHA expired");
  }, []);

  const handleError = useCallback((msg: string) => {
    console.error("reCAPTCHA error:", msg);
  }, []);

  return <ReCAPTCHA onVerify={handleVerify} onExpire={handleExpire} onError={handleError} />;
}