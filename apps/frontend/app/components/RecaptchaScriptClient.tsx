"use client";
import { useEffect } from "react";
import Script from "next/script";

export default function RecaptchaScriptClient() {
  useEffect(() => {
    const handler = () => console.error("reCAPTCHA load error");
    const sel = 'script[src="https://www.google.com/recaptcha/api.js?render=explicit"]';
    const s = document.querySelector(sel) as HTMLScriptElement | null;
    if (s) s.addEventListener("error", handler);
    return () => { if (s) s.removeEventListener("error", handler); };
  }, []);

  return (
    <Script
      src="https://www.google.com/recaptcha/api.js?render=explicit"
      strategy="afterInteractive"
    />
  );
}