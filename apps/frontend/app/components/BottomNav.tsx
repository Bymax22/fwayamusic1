"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Compass, Search, Library, MoreHorizontal, LifeBuoy, Megaphone, Handshake, FileText, ShieldCheck, HelpCircle, Mail, BookOpen, Users, AlertCircle, Code, Bell, Flag } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface BottomNavProps {
  onMoreClick: () => void;
}

export default function BottomNav({ onMoreClick }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [needHelpOpen, setNeedHelpOpen] = useState(false);
  const [needHelpClosing, setNeedHelpClosing] = useState(false);

  const closeNeedHelp = () => {
    if (!needHelpOpen) return;
    setNeedHelpClosing(true);
    window.setTimeout(() => {
      setNeedHelpOpen(false);
      setNeedHelpClosing(false);
    }, 180);
  };

  const navItems = [
    { id: "home", label: "Home", icon: null, image: "/fwaya-lp-01.png", inactiveImage: "/fwaya white icon-01.png", href: user ? "/guestwelcome" : "/" },
    { id: "browse", label: "Browse", icon: Compass, href: "/browse" },
    // replaced search with Need Help modal
    { id: "needhelp", label: "Need Help?", icon: LifeBuoy },
    { id: "library", label: "Library", icon: Library, href: "/library" },
    { id: "more", label: "More", icon: MoreHorizontal },
  ];

  const activeTab = navItems.find((item) => {
    if (!item.href || !pathname) return false;
    if (item.href === "/") return pathname === "/";
    return pathname.startsWith(item.href);
  })?.id || "home";

  const handleClick = (item: typeof navItems[number]) => {
    if (item.id === "more") {
      onMoreClick();
      return;
    }

    if (item.id === "needhelp") {
      setNeedHelpClosing(false);
      setNeedHelpOpen(true);
      return;
    }

  };

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[80]">
      <div className="glass-pill mx-4 mb-3 px-2 py-2 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            item.href ? (
              <Link
                key={item.id}
                href={item.href}
                prefetch
                aria-current={isActive ? "page" : undefined}
                className={`relative flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 touch-manipulation ${
                  isActive ? "text-white" : "text-white/60"
                }`}
              >
                {item.image ? (
                  <Image
                    src={isActive ? item.image : (item.inactiveImage || item.image)}
                    alt=""
                    width={22}
                    height={22}
                    className="opacity-100"
                  />
                ) : Icon ? (
                  <Icon
                    size={22}
                    className={isActive ? "text-purple/60" : "text-current"}
                    fill={isActive ? "rgba(var(--primary-accent), 0.2)" : "none"}
                  />
                ) : null}
                <span className="text-[10px] font-medium">{item.label}</span>
                {isActive && (
                  <div className="absolute -bottom-2 w-6 h-0.5 bg-purple/75 rounded-full" />
                )}
              </Link>
            ) : (
            <button
              key={item.id}
              type="button"
              onClick={() => handleClick(item)}
              aria-label={item.id === "more" ? "Open More menu" : item.label}
              className={`relative flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl px-3 py-2 transition-all duration-200 touch-manipulation ${
                isActive ? "text-white" : "text-white/60"
              }`}
            >
              {item.image ? (
                <Image
                  src={isActive ? item.image : (item.inactiveImage || item.image)}
                  alt={item.label}
                  width={22}
                  height={22}
                  className="opacity-100"
                />
              ) : Icon ? (
                <Icon
                  size={22}
                  className={isActive ? "text-purple/60" : "text-current"}
                  fill={isActive ? "rgba(var(--primary-accent), 0.2)" : "none"}
                />
              ) : null}
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && (
                <div className="absolute -bottom-2 w-6 h-0.5 bg-purple/75 rounded-full" />
              )}
            </button>
            )
          );
        })}
      </div>

      {needHelpOpen && (
        <div
          className={`fixed inset-0 z-[9999] flex items-end justify-center transition-opacity duration-200 ${needHelpClosing ? 'opacity-0' : 'opacity-100'}`}
          onClick={closeNeedHelp}
        >
          <div className={`absolute inset-0 bg-background/60 transition-opacity duration-200 ${needHelpClosing ? 'opacity-0' : 'opacity-100'}`} />
          <div
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full max-w-md bg-background rounded-t-3xl p-4 z-10 transition-all duration-200 ${needHelpClosing ? 'translate-y-6 opacity-0' : 'translate-y-0 opacity-100'}`}
            style={{ marginBottom: '72px' }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Need Help?</h3>
              <button onClick={closeNeedHelp} className="text-white/60">Close</button>
            </div>

            <div className="mt-3">
              <form onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget as HTMLFormElement);
                const q = String(fd.get('q') || '').trim();
                if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
                closeNeedHelp();
              }}>
                <input name="q" placeholder="Search" className="w-full px-3 py-2 bg-white/5 rounded mb-3 text-sm text-white" />
              </form>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeNeedHelp();
                    window.setTimeout(() => {
                      window.fwayaOpenChatwoot?.();
                    }, 220);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg bg-purple/20 hover:bg-purple/30 text-sm text-white flex items-center gap-2"
                >
                  <LifeBuoy className="w-4 h-4 text-purple/60" />
                  Chat with Support
                </button>
                <button onClick={(e) => { e.stopPropagation(); closeNeedHelp(); void router.push('/help/contact'); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-white/90 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-purple/60" />
                  Contact Us
                </button>
                <button onClick={(e) => { e.stopPropagation(); closeNeedHelp(); void router.push('/help/faq'); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-white/90 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-purple/60" />
                  FAQ
                </button>
                <button onClick={(e) => { e.stopPropagation(); closeNeedHelp(); void router.push('/blog'); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-white/90 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-purple/60" />
                  Blog & News
                </button>
                <button onClick={(e) => { e.stopPropagation(); closeNeedHelp(); void router.push('/advertising'); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-white/90 flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-purple/60" />
                  Advertisement
                </button>
                <button onClick={(e) => { e.stopPropagation(); closeNeedHelp(); void router.push('/partnership'); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-white/90 flex items-center gap-2">
                  <Handshake className="w-4 h-4 text-purple/60" />
                  Partnership
                </button>
                <button onClick={(e) => { e.stopPropagation(); closeNeedHelp(); void router.push('/community'); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-white/90 flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple/60" />
                  Community
                </button>
                <button onClick={(e) => { e.stopPropagation(); closeNeedHelp(); void router.push('/community-guidelines'); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-white/90 flex items-center gap-2">
                  <Flag className="w-4 h-4 text-purple/60" />
                  Community Guidelines
                </button>
                <button onClick={(e) => { e.stopPropagation(); closeNeedHelp(); void router.push('/report-issue'); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-white/90 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-purple/60" />
                  Report Issue
                </button>
                <button onClick={(e) => { e.stopPropagation(); closeNeedHelp(); void router.push('/status'); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-white/90 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-purple/60" />
                  System Status
                </button>
                <button onClick={(e) => { e.stopPropagation(); closeNeedHelp(); void router.push('/developers'); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-white/90 flex items-center gap-2">
                  <Code className="w-4 h-4 text-purple/60" />
                  Developers
                </button>
                <button onClick={(e) => { e.stopPropagation(); closeNeedHelp(); void router.push('/terms'); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-white/90 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple/60" />
                  Terms & Conditions
                </button>
                <button onClick={(e) => { e.stopPropagation(); closeNeedHelp(); void router.push('/privacy'); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-white/90 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple/60" />
                  Privacy Policy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}