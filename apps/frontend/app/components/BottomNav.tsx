"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { Compass, Search, Library, MoreHorizontal } from "lucide-react";

interface BottomNavProps {
  onMoreClick?: () => void;
}

export default function BottomNav({ onMoreClick }: BottomNavProps) {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { id: "home", label: "Fwaya", icon: null, image: "/fwaya-lp-01.png", inactiveImage: "/fwaya white icon-01.png", href: "/" },
    { id: "browse", label: "Browse", icon: Compass, href: "/browse" },
    { id: "search", label: "Search", icon: Search, href: "/search" },
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
    </div>
  );
}