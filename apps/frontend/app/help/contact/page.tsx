'use client';

import { FormEvent, useEffect, useState } from 'react';

export default function HelpContactPage() {
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setReason(params.get('subject') || '');
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setStatus(null);
    setError(null);

    const form = new FormData(event.currentTarget);
    const subject = String(form.get('subject') || reason || 'General enquiry');
    const payload = {
      name: String(form.get('name') || ''),
      email: String(form.get('email') || ''),
      message: String(form.get('message') || ''),
      source: 'help-contact-page',
      type: subject.toLowerCase().includes('issue') ? 'REPORT_ISSUE' : 'GENERAL',
      metadata: {
        subject,
        channel: 'help-contact-page',
        contactMethod: 'email-form',
        page: '/help/contact',
      },
    };

    try {
      const res = await fetch('/api/v1/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || 'Failed to send message');
      }
      setStatus('Your message has been sent to FWAYA Support.');
      event.currentTarget.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black px-4 py-6 text-white md:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-900/30 to-black p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-purple-300">Contact Us</p>
          <h1 className="mt-2 text-2xl font-bold md:text-3xl">Talk to FWAYA</h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
            <div>
              <label className="mb-1 block text-sm text-gray-300">Your name</label>
              <input name="name" type="text" required className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-300">Email address</label>
              <input name="email" type="email" required className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-300">Subject</label>
              <input
                name="subject"
                type="text"
                defaultValue={reason || ''}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-300">How can we help?</label>
              <textarea name="message" required rows={6} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
            </div>
            <button type="submit" disabled={loading} className="w-full rounded-lg bg-purple-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
              {loading ? 'Sending...' : 'Send Message'}
            </button>
            {status && <p className="text-sm text-green-400">{status}</p>}
            {error && <p className="text-sm text-red-400">{error}</p>}
          </form>

          <aside className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-semibold text-white">Quick contact</h2>
            <div className="mt-4 space-y-3 text-sm text-gray-200">
              <p>WhatsApp / Call: <a href="https://wa.me/260966999999" className="text-purple-300">0966 999 999</a></p>
              <p>Email: <a href="mailto:support@fwaya.net" className="text-purple-300">support@fwaya.net</a></p>
              <p>Website: <a href="https://www.fwaya.net" className="text-purple-300">www.fwaya.net</a></p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
