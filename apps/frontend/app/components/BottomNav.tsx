"use client";
/* eslint-disable */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Search, 
  Library, 
  User,
  Menu,
  Compass,
  DollarSign
} from "lucide-react";

interface BottomNavProps {
  isVisible: boolean;
  onMenuOpen: () => void;
}

export default function BottomNav({ isVisible, onMenuOpen }: BottomNavProps) {
  const pathname = usePathname();

  // New nav items: Home, Browse, Menu (center), Reseller, Library
  const navItems = [
    { name: "Home", href: "/dashboard", icon: Home, active: pathname === "/dashboard" },
    { name: "Browse", href: "/browse", icon: Compass, active: pathname.startsWith("/browse") },
    { name: "Menu", href: "#", icon: Menu, active: false, action: onMenuOpen, center: true },
    { name: "Reseller", href: "/auth/reseller/signin", icon: DollarSign, active: pathname.startsWith("/auth/reseller") },
    { name: "Library", href: "/library", icon: Library, active: pathname.startsWith("/library") },
  ];

  return (
    <nav className={`bottom-nav flex justify-between items-center px-2 ${!isVisible ? 'bottom-nav--hidden' : ''}`}>
      {navItems.map((item, idx) => {
        const Icon = item.icon;
        if (item.center) {
          // Centered, larger Menu button with red accent circle
          return (
            <div key={item.name} className="flex-1 flex justify-center">
              <button
                onClick={item.action}
                className="relative bottom-nav__item touch-target flex flex-col items-center"
                aria-label={item.name}
                style={{ zIndex: 2 }}
              >
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="w-12 h-12 rounded-full bg-gradient-to-br from-[#e51f48] to-[#ff4d6d] opacity-80 shadow-lg"></span>
                </span>
                <Icon size={32} className="bottom-nav__icon text-white relative z-10" strokeWidth={2.5} />
                <span className="mobile-text-xs font-bold text-white relative z-10">{item.name}</span>
              </button>
            </div>
          );
        }
        return (
          <Link key={item.name} href={item.href} passHref>
            <button
              className={`bottom-nav__item touch-target flex flex-col items-center ${item.active ? 'bottom-nav__item--active text-[#e51f48]' : 'text-gray-300'}`}
              aria-label={item.name}
              aria-current={item.active ? "page" : undefined}
            >
              <Icon size={22} className="bottom-nav__icon mb-1" strokeWidth={item.active ? 2.5 : 2} />
              <span className="mobile-text-xs font-medium">{item.name}</span>
            </button>
          </Link>
        );
      })}
    </nav>
  );
}