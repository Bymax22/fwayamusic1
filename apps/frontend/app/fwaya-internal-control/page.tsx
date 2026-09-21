"use client";

import { FormEvent, useState } from 'react';
import { Eye, EyeOff, LockKeyhole } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { parseAuthError } from '@/lib/auth-error-utils';

export default function SecretAdminLoginPage() {
  const router = useRouter();
  const { signIn, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      const account = await signIn(email.trim(), password, 'ADMIN');
      if (!['ADMIN', 'MODERATOR'].includes(account.role)) {
        setError('This account does not have control-center access.');
        return;
      }
      router.replace('/admin');
    } catch (reason) {
      setError(parseAuthError(reason).message);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f6f8] px-5 py-10">
      <section className="w-full max-w-md rounded-3xl bg-black p-8 text-white shadow-2xl shadow-black/20 sm:p-10">
        <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-700"><LockKeyhole size={22} /></div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-purple-300">Private access</p>
        <h1 className="mt-3 text-3xl font-semibold">Control center</h1>
        <p className="mt-2 text-sm text-white/55">Sign in with an authorized administrator account.</p>
        <form onSubmit={submit} className="mt-8 space-y-5">
          <label className="block text-sm text-white/70">Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl bg-white/10 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-purple-500" autoComplete="username" /></label>
          <label className="block text-sm text-white/70">Password<div className="relative mt-2"><input required type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl bg-white/10 px-4 py-3 pr-12 text-white outline-none focus:ring-2 focus:ring-purple-500" autoComplete="current-password" /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>
          {error && <p className="rounded-xl bg-red-500/15 px-3 py-2 text-sm text-red-200">{error}</p>}
          <button disabled={loading} className="w-full rounded-xl bg-purple-700 px-4 py-3 font-medium text-white hover:bg-purple-600 disabled:opacity-50">{loading ? 'Checking access...' : 'Enter control center'}</button>
        </form>
      </section>
    </main>
  );
}
