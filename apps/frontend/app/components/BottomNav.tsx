"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { Compass, Search, Library, MoreHorizontal, LifeBuoy, Megaphone, Handshake, FileText, ShieldCheck, HelpCircle, Mail, BookOpen, Users, AlertCircle, Code, Bell, Flag } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface BottomNavProps {
  onMoreClick?: () => void;
}

export default function BottomNav({ onMoreClick }: BottomNavProps) {
  const router = useRouter();
  const pathname = usePathname();
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
    if (item.id === "more" && onMoreClick) {
      onMoreClick();
      return;
    }

    if (item.id === "needhelp") {
      setNeedHelpClosing(false);
      setNeedHelpOpen(true);
      return;
    }

    if (item.href) {
      router.push(item.href);
    }
  };

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
      <div className="glass-pill mx-4 mb-3 px-2 py-2 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleClick(item)}
              className={`relative flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 ${
                isActive ? "text-white" : "text-gray-400"
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
                  className={isActive ? "text-purple-400" : "text-current"}
                  fill={isActive ? "rgba(155, 93, 229, 0.2)" : "none"}
                />
              ) : null}
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && (
                <div className="absolute -bottom-2 w-6 h-0.5 bg-purple-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {needHelpOpen && (
        <div
          className={`fixed inset-0 z-[9999] flex items-end justify-center transition-opacity duration-200 ${needHelpClosing ? 'opacity-0' : 'opacity-100'}`}
          onClick={closeNeedHelp}
        >
          <div className={`absolute inset-0 bg-black/60 transition-opacity duration-200 ${needHelpClosing ? 'opacity-0' : 'opacity-100'}`} />
          <div
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full max-w-md bg-black rounded-t-3xl p-4 z-10 transition-all duration-200 ${needHelpClosing ? 'translate-y-6 opacity-0' : 'translate-y-0 opacity-100'}`}
            style={{ marginBottom: '72px' }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Need Help?</h3>
              <button onClick={closeNeedHelp} className="text-gray-400">Close</button>
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
                <button onClick={(e) => { e.stopPropagation(); closeNeedHelp(); void router.push('/support'); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-gray-200 flex items-center gap-2">
                  <LifeBuoy className="w-4 h-4 text-purple-400" />
                  Support
                </button>
                <button onClick={(e) => { e.stopPropagation(); closeNeedHelp(); void router.push('/help/contact'); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-gray-200 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-purple-400" />
                  Contact Us
                </button>
                <button onClick={(e) => { e.stopPropagation(); closeNeedHelp(); void router.push('/help/faq'); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-gray-200 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-purple-400" />
                  FAQ
                </button>
                <button onClick={(e) => { e.stopPropagation(); closeNeedHelp(); void router.push('/blog'); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-gray-200 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-purple-400" />
                  Blog & News
                </button>
                <button onClick={(e) => { e.stopPropagation(); closeNeedHelp(); void router.push('/advertising'); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-gray-200 flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-purple-400" />
                  Advertisement
                </button>
                <button onClick={(e) => { e.stopPropagation(); closeNeedHelp(); void router.push('/partnership'); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-gray-200 flex items-center gap-2">
                  <Handshake className="w-4 h-4 text-purple-400" />
                  Partnership
                </button>
                <button onClick={(e) => { e.stopPropagation(); closeNeedHelp(); void router.push('/community'); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-gray-200 flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-400" />
                  Community
                </button>
                <button onClick={(e) => { e.stopPropagation(); closeNeedHelp(); void router.push('/community-guidelines'); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-gray-200 flex items-center gap-2">
                  <Flag className="w-4 h-4 text-purple-400" />
                  Community Guidelines
                </button>
                <button onClick={(e) => { e.stopPropagation(); closeNeedHelp(); void router.push('/report-issue'); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-gray-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-purple-400" />
                  Report Issue
                </button>
                <button onClick={(e) => { e.stopPropagation(); closeNeedHelp(); void router.push('/status'); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-gray-200 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-purple-400" />
                  System Status
                </button>
                <button onClick={(e) => { e.stopPropagation(); closeNeedHelp(); void router.push('/developers'); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-gray-200 flex items-center gap-2">
                  <Code className="w-4 h-4 text-purple-400" />
                  Developers
                </button>
                <button onClick={(e) => { e.stopPropagation(); closeNeedHelp(); void router.push('/terms'); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-gray-200 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-400" />
                  Terms & Conditions
                </button>
                <button onClick={(e) => { e.stopPropagation(); closeNeedHelp(); void router.push('/privacy'); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-gray-200 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
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