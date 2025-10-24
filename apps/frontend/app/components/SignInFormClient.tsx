"use client";
import React, { useState } from "react";
import ReCAPTCHAWrapper from "./ReCAPTCHAWrapper";

export default function SignInFormClient() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

  const handleVerified = async (token: string) => {
    setRecaptchaToken(token);
    // optionally verify server-side immediately:
    // await fetch('/api/verify-recaptcha', { method: 'POST', body: JSON.stringify({ token }) })
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recaptchaToken) {
      alert("Please complete the reCAPTCHA");
      return;
    }
    // perform sign-in (client-side) or submit to server endpoint
    // fetch('/api/auth/signin', { method: 'POST', body: JSON.stringify({ email, password, token: recaptchaToken }) })
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
      <ReCAPTCHAWrapper onVerified={handleVerified} />
      <button type="submit">Sign in</button>
    </form>
  );
}