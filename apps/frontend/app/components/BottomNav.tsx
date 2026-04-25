"use client";

import { useState } from "react";
import Image from "next/image";
import { Compass, Search, Library, MoreHorizontal } from "lucide-react";

interface BottomNavProps {
  onMoreClick?: () => void;
}

export default function BottomNav({ onMoreClick }: BottomNavProps) {
  const [activeTab, setActiveTab] = useState("home");

  const navItems = [
    { id: "home", label: "Fwaya", icon: null, image: "/fwaya lp-01.png", inactiveImage: "/fwaya white icon-01.png" },
    { id: "browse", label: "Browse", icon: Compass },
    { id: "search", label: "Search", icon: Search },
    { id: "library", label: "Library", icon: Library },
    { id: "more", label: "More", icon: MoreHorizontal },
  ];

  const handleClick = (id: string) => {
    setActiveTab(id);
    if (id === "more" && onMoreClick) {
      onMoreClick();
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
              onClick={() => handleClick(item.id)}
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