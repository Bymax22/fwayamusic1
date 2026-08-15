"use client";

import Link from "next/link";
import { useState } from "react";
import { MessageSquare, Megaphone, Handshake, MoreHorizontal, LifeBuoy, Info } from "lucide-react";

export default function MobileFooter() {
  const [openMore, setOpenMore] = useState(false);
  const [openSupport, setOpenSupport] = useState(false);

  return (
    <div className="lg:hidden fixed bottom-14 left-0 right-0 z-40">
      <div className="mx-4 bg-gradient-to-r from-black/60 to-black/40 border border-white/6 rounded-2xl p-2 flex items-center justify-between gap-2">
        <Link href="/support" className="flex-1 flex flex-col items-center text-xs text-gray-200 hover:text-white">
          <LifeBuoy className="w-5 h-5 text-purple-400" />
          <span className="mt-1">Support</span>
        </Link>

        <Link href="/advertising" className="flex-1 flex flex-col items-center text-xs text-gray-200 hover:text-white">
          <Megaphone className="w-5 h-5 text-yellow-400" />
          <span className="mt-1">Ads</span>
        </Link>

        <Link href="/partnership" className="flex-1 flex flex-col items-center text-xs text-gray-200 hover:text-white">
          <Handshake className="w-5 h-5 text-cyan-400" />
          <span className="mt-1">Partners</span>
        </Link>

        <button
          onClick={() => setOpenMore(true)}
          className="flex-1 flex flex-col items-center text-xs text-gray-200 hover:text-white"
          aria-label="More"
        >
          <MoreHorizontal className="w-5 h-5 text-white/80" />
          <span className="mt-1">More</span>
        </button>
      </div>

      {/* More modal */}
      {openMore && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpenMore(false)} />
          <div className="w-full max-w-md bg-[#07070b] rounded-t-3xl p-4 border-t border-white/6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">More</h3>
              <button onClick={() => setOpenMore(false)} className="text-gray-400">Close</button>
            </div>

            <div className="mt-3 space-y-2">
              <Link href="/terms" className="block px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-gray-200">Terms & Conditions</Link>
              <Link href="/privacy" className="block px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-gray-200">Privacy Policy</Link>
              <Link href="/contact" className="block px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-gray-200">Contact</Link>
              <button
                onClick={() => { setOpenMore(false); setOpenSupport(true); }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-gray-200 flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4 text-purple-300" />
                Submit a support request
              </button>
              <Link href="/advertising" className="block px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-gray-200">Advertise with us</Link>
              <Link href="/partnership" className="block px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-gray-200">Partnerships</Link>
              <Link href="/help/faq" className="block px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-gray-200">FAQ</Link>
            </div>
          </div>
        </div>
      )}

      {/* Support modal inline form */}
      {openSupport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpenSupport(false)} />
          <div className="relative w-full max-w-md bg-[#0b0b10] rounded-2xl p-4 border border-white/6">
            <h3 className="text-lg font-semibold text-white">Contact Support</h3>
            <p className="text-sm text-gray-400 mt-1">We aim to respond within 24 hours.</p>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const fd = new FormData(form);
                const payload = Object.fromEntries(fd.entries());
                try {
                  await fetch('/api/v1/support', { method: 'POST', body: JSON.stringify(payload), headers: { 'content-type': 'application/json' } });
                  alert('Support request submitted.');
                  setOpenSupport(false);
                } catch (err) {
                  alert('Submission failed.');
                }
              }}
              className="mt-3 space-y-2"
            >
              <input name="name" placeholder="Your name" className="w-full px-3 py-2 bg-white/5 rounded-md text-sm text-white" required />
              <input name="email" type="email" placeholder="Email" className="w-full px-3 py-2 bg-white/5 rounded-md text-sm text-white" required />
              <textarea name="message" placeholder="Describe your issue" className="w-full px-3 py-2 bg-white/5 rounded-md text-sm text-white h-24" required />
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-purple-600 py-2 rounded-lg">Send</button>
                <button type="button" onClick={() => setOpenSupport(false)} className="flex-1 bg-white/5 py-2 rounded-lg">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
