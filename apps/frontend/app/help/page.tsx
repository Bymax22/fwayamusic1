'use client';

import Link from 'next/link';
import { useState } from 'react';

const quickActions = [
  {
    label: 'WhatsApp',
    href: 'https://wa.me/260966999999',
    description: '0966 999 999',
    tone: 'bg-green-600/20 text-green-200 border-green-500/30',
  },
  {
    label: 'Email',
    href: 'mailto:support@fwaya.net',
    description: 'support@fwaya.net',
    tone: 'bg-purple-600/20 text-purple-200 border-purple-500/30',
  },
  {
    label: 'Report Issue',
    href: '/help/contact?subject=Report%20Issue',
    description: 'Tell us what is not working',
    tone: 'bg-amber-600/20 text-amber-200 border-amber-500/30',
  },
];

const sections = [
  {
    id: 'support',
    label: 'Support',
    content: (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-white">Need a hand?</h3>
        <p className="text-sm text-gray-300">
          If you need help with your FWAYA account, payment, subscription, content, upload or anything else on the platform, talk to us.
        </p>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-gray-200">
          <p>WhatsApp: <a href="https://wa.me/260966999999" className="text-purple-300">0966 999 999</a></p>
          <p>Email: <a href="mailto:support@fwaya.net" className="text-purple-300">support@fwaya.net</a></p>
        </div>
      </div>
    ),
  },
  {
    id: 'contact',
    label: 'Contact Us',
    content: (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-white">Talk to FWAYA</h3>
        <p className="text-sm text-gray-300">Questions, suggestions or general enquiries? We’d love to hear from you.</p>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-gray-200">
          <p>WhatsApp / Call: <a href="tel:+260966999999" className="text-purple-300">0966 999 999</a></p>
          <p>Email: <a href="mailto:support@fwaya.net" className="text-purple-300">support@fwaya.net</a></p>
          <p>Website: <a href="https://www.fwaya.net" className="text-purple-300">www.fwaya.net</a></p>
        </div>
      </div>
    ),
  },
  {
    id: 'faq',
    label: 'FAQ',
    content: (
      <div className="space-y-4 text-sm text-gray-200">
        <h3 className="text-xl font-semibold text-white">Quick answers</h3>
        <div className="space-y-3">
          <div>
            <p className="font-medium text-white">What is FWAYA?</p>
            <p>FWAYA is a digital platform for discovering, enjoying, sharing and supporting music, video and creative content.</p>
          </div>
          <div>
            <p className="font-medium text-white">How do I get help?</p>
            <p>Message FWAYA Support on WhatsApp at 0966 999 999.</p>
          </div>
          <div>
            <p className="font-medium text-white">My payment went through but I cannot access my content. What should I do?</p>
            <p>Send your payment reference and registered phone number to FWAYA Support on WhatsApp.</p>
          </div>
          <div>
            <p className="font-medium text-white">I forgot my password. What should I do?</p>
            <p>Select Forgot Password on the login page. If you still need help, contact FWAYA Support.</p>
          </div>
          <div>
            <p className="font-medium text-white">How do I report something that is not working?</p>
            <p>Use Report Issues or WhatsApp us on 0966 999 999.</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'blog',
    label: 'Blog & News',
    content: (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-white">What’s happening on FWAYA?</h3>
        <p className="text-sm text-gray-300">Discover platform updates, new features, music stories, promotions, events, opportunities and important announcements.</p>
        <Link href="/blog" className="inline-flex rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white">Visit Blog & News</Link>
      </div>
    ),
  },
  {
    id: 'advertise',
    label: 'Advertise on FWAYA',
    content: (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-white">Put your brand where people are listening, watching and discovering.</h3>
        <p className="text-sm text-gray-300">FWAYA welcomes advertising and promotional opportunities from businesses, brands, organisations, events and creators.</p>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-gray-200">
          <p>Advertising Enquiries - WhatsApp: <a href="https://wa.me/260966999999" className="text-purple-300">0966 999 999</a></p>
          <p>Email: <a href="mailto:advertising@fwaya.net" className="text-purple-300">advertising@fwaya.net</a></p>
        </div>
      </div>
    ),
  },
  {
    id: 'partners',
    label: 'Partner With FWAYA',
    content: (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-white">Let’s build something together.</h3>
        <p className="text-sm text-gray-300">FWAYA is open to partnerships with businesses, brands, institutions, creators, technology companies and organisations that see opportunities to grow together.</p>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-gray-200">
          <p>Partnership Enquiries - WhatsApp: <a href="https://wa.me/260966999999" className="text-purple-300">0966 999 999</a></p>
          <p>Email: <a href="mailto:partnerships@fwaya.net" className="text-purple-300">partnerships@fwaya.net</a></p>
        </div>
      </div>
    ),
  },
  {
    id: 'community',
    label: 'Community',
    content: (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-white">This is where discovery becomes connection.</h3>
        <p className="text-sm text-gray-300">FWAYA brings together listeners, artists, producers, creators, fans and people who simply love great content.</p>
        <p className="text-sm text-gray-200">Discover. Connect. Support. Enjoy.</p>
      </div>
    ),
  },
  {
    id: 'guidelines',
    label: 'Community Guidelines',
    content: (
      <div className="space-y-4 text-sm text-gray-200">
        <h3 className="text-xl font-semibold text-white">Good communities grow when people respect each other.</h3>
        <ul className="list-disc space-y-2 pl-5">
          <li>Respect other users.</li>
          <li>Do not harass, threaten or abuse others.</li>
          <li>Do not impersonate people.</li>
          <li>Do not scam or mislead users.</li>
          <li>Do not upload content you have no right to use.</li>
          <li>Do not post harmful or illegal content.</li>
          <li>Report anything that does not belong on FWAYA.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'report',
    label: 'Report Issues',
    content: (
      <div className="space-y-4 text-sm text-gray-200">
        <h3 className="text-xl font-semibold text-white">Something not working? Tell us.</h3>
        <ul className="list-disc space-y-2 pl-5">
          <li>Your name.</li>
          <li>Registered phone number or email.</li>
          <li>A short description of the problem.</li>
          <li>A screenshot, if possible.</li>
          <li>Your transaction reference if the issue involves payment.</li>
        </ul>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p>WhatsApp: <a href="https://wa.me/260966999999" className="text-purple-300">0966 999 999</a></p>
          <p>Email: <a href="mailto:support@fwaya.net" className="text-purple-300">support@fwaya.net</a></p>
        </div>
      </div>
    ),
  },
  {
    id: 'status',
    label: 'System Status',
    content: (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-white">Is FWAYA running normally?</h3>
        <p className="text-sm text-gray-300">All major FWAYA services are currently operational.</p>
        <p className="text-sm text-gray-300">If something is not working for you, contact FWAYA Support on WhatsApp: <a href="https://wa.me/260966999999" className="text-purple-300">0966 999 999</a>.</p>
      </div>
    ),
  },
  {
    id: 'developers',
    label: 'Developers',
    content: (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-white">Build with FWAYA.</h3>
        <p className="text-sm text-gray-300">Developer tools, APIs and integration resources are coming to FWAYA.</p>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-gray-200">
          <p>Email: <a href="mailto:developers@fwaya.net" className="text-purple-300">developers@fwaya.net</a></p>
        </div>
      </div>
    ),
  },
  {
    id: 'terms',
    label: 'Terms & Conditions',
    content: (
      <div className="space-y-4 text-sm text-gray-200">
        <h3 className="text-xl font-semibold text-white">Fair use. Clear responsibilities.</h3>
        <p>By using FWAYA, you agree to use the platform responsibly and in accordance with FWAYA’s Terms & Conditions.</p>
        <p>Users must not misuse the platform, violate the rights of others, upload content they do not have permission to use, manipulate platform activity, commit fraud or use FWAYA for unlawful purposes.</p>
        <p>Legal Enquiries: <a href="mailto:legal@fwaya.net" className="text-purple-300">legal@fwaya.net</a></p>
      </div>
    ),
  },
  {
    id: 'privacy',
    label: 'Privacy Policy',
    content: (
      <div className="space-y-4 text-sm text-gray-200">
        <h3 className="text-xl font-semibold text-white">Your information matters.</h3>
        <p>FWAYA may collect information needed to operate the platform, including your name, phone number, email address, account information, platform activity and payment-related information.</p>
        <p>We use this information to provide FWAYA services, process transactions, provide customer support, improve the platform, protect users and meet applicable legal requirements.</p>
        <p>Privacy Enquiries: <a href="mailto:privacy@fwaya.net" className="text-purple-300">privacy@fwaya.net</a></p>
      </div>
    ),
  },
];

export default function HelpHomePage() {
  const [open, setOpen] = useState<string>('support');
  const activeSection = sections.find((section) => section.id === open) ?? sections[0];

  return (
    <div className="min-h-screen bg-black px-4 py-6 text-white md:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-900/30 to-black p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-purple-300">FWAYA Support</p>
          <h1 className="mt-2 text-2xl font-bold md:text-3xl">Need help? You’re in the right place.</h1>
          <div className="mt-4 flex flex-col gap-2 text-sm text-gray-200 md:flex-row md:items-center md:gap-6">
            <a href="https://wa.me/260966999999" className="text-purple-300">WhatsApp / Call: 0966 999 999</a>
            <a href="mailto:support@fwaya.net" className="text-purple-300">Email: support@fwaya.net</a>
          </div>
        </div>

        <div className="mb-6 grid gap-3 md:grid-cols-3">
          {quickActions.map(({ label, href, description, tone }) => (
            <a
              key={label}
              href={href}
              className={`block rounded-2xl border p-4 transition hover:-translate-y-0.5 ${tone}`}
            >
              <div className="text-xs uppercase tracking-[0.2em] opacity-80">{label}</div>
              <div className="mt-2 text-sm font-semibold">{description}</div>
            </a>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="space-y-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setOpen(section.id)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm transition ${
                    open === section.id ? 'bg-purple-600 text-white' : 'bg-transparent text-gray-200 hover:bg-white/5'
                  }`}
                >
                  <span>{section.label}</span>
                  <span className="text-xs text-current/80">{open === section.id ? '−' : '+'}</span>
                </button>
              ))}
            </div>
          </aside>

          <main className="rounded-2xl border border-white/10 bg-white/5 p-5 md:p-6">
            {activeSection.content}
          </main>
        </div>
      </div>
    </div>
  );
}
