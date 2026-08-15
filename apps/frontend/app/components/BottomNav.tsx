"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { Compass, Search, Library, MoreHorizontal, LifeBuoy } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface BottomNavProps {
  onMoreClick?: () => void;
}

export default function BottomNav({ onMoreClick }: BottomNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [needHelpOpen, setNeedHelpOpen] = useState(false);

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
        <div className="fixed inset-0 z-[9999] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setNeedHelpOpen(false)} />
          <div className="w-full max-w-md bg-[#07070b] rounded-t-3xl p-4 border-t border-white/6 pointer-events-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Need Help?</h3>
              <button onClick={() => setNeedHelpOpen(false)} className="text-gray-400">Close</button>
            </div>

            <div className="mt-3">
              <form onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget as HTMLFormElement);
                const q = String(fd.get('q') || '').trim();
                if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
                setNeedHelpOpen(false);
              }}>
                <input name="q" placeholder="Search" className="w-full px-3 py-2 bg-white/5 rounded mb-3 text-sm text-white" />
              </form>

              <div className="space-y-2">
                <button onClick={() => { setNeedHelpOpen(false); router.push('/support'); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-gray-200 flex items-center gap-2">Support</button>
                <button onClick={() => { setNeedHelpOpen(false); router.push('/advertising'); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-gray-200">Ads</button>
                <button onClick={() => { setNeedHelpOpen(false); router.push('/partnership'); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-gray-200">Partners</button>
                <button onClick={() => { setNeedHelpOpen(false); router.push('/terms'); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-gray-200">Terms & Conditions</button>
                <button onClick={() => { setNeedHelpOpen(false); router.push('/privacy'); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-gray-200">Privacy Policy</button>
                <button onClick={() => { setNeedHelpOpen(false); router.push('/help/faq'); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-gray-200">FAQ</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}