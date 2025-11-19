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
  // Get user from AuthContext
  let user = null;
  try {
    // Dynamically import useAuth to avoid SSR issues
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    user = require("@/context/AuthContext").useAuth().user;
  } catch (e) {
    user = null;
  }

  // Full nav items: Home, Search, Browse, Menu (center), Resell, Library, Profile
  const navItems = [
    { name: "Home", href: "/dashboard", icon: Home, active: pathname === "/dashboard" },
    { name: "Search", href: "/search", icon: Search, active: pathname.startsWith("/search") },
    { name: "Browse", href: "/browse", icon: Compass, active: pathname.startsWith("/browse") },
    { name: "Menu", href: "#", icon: Menu, active: false, action: onMenuOpen, center: true },
    { name: "Resell", href: "/auth/reseller/signin", icon: DollarSign, active: pathname.startsWith("/auth/reseller") },
    { name: "Library", href: "/library", icon: Library, active: pathname.startsWith("/library") },
    { name: "Profile", href: "/profile", icon: User, active: pathname.startsWith("/profile") },
  ];

  return (
    <nav className={`bottom-nav flex justify-between items-center px-2 ${!isVisible ? 'bottom-nav--hidden' : ''}`}>
      {navItems.map((item, idx) => {
        const Icon = item.icon;
        // Links that require authentication
        const requiresAuth = ["Library", "Profile", "Resell"].includes(item.name);
        if (item.center) {
          // Centered, slightly larger Menu button (no red background)
          return (
            <div key={item.name} className="flex-1 flex justify-center">
              <button
                onClick={item.action}
                className="relative bottom-nav__item touch-target flex flex-col items-center"
                aria-label={item.name}
                style={{ zIndex: 2 }}
              >
                <Icon size={28} className="bottom-nav__icon text-white relative z-10" strokeWidth={2.5} />
                <span className="mobile-text-xs font-bold text-white relative z-10 mt-0.5">{item.name}</span>
              </button>
            </div>
          );
        }
        // If guest and link requires auth, redirect to login
        if (requiresAuth && !user) {
          return (
            <button
              key={item.name}
              className={`bottom-nav__item touch-target flex flex-col items-center`}
              aria-label={item.name}
              onClick={() => window.location.href = "/auth/user/signin"}
            >
              <Icon size={22} className={`bottom-nav__icon mb-1 text-gray-300`} strokeWidth={2} />
              <span className={`mobile-text-xs font-medium text-white`}>{item.name}</span>
            </button>
          );
        }
        // Otherwise, normal link
        return (
          <Link key={item.name} href={item.href} passHref>
            <button
              className={`bottom-nav__item touch-target flex flex-col items-center ${item.active ? 'bottom-nav__item--active' : ''}`}
              aria-label={item.name}
              aria-current={item.active ? "page" : undefined}
            >
              <Icon size={22} className={`bottom-nav__icon mb-1 ${item.active ? 'text-[#e51f48]' : 'text-gray-300'}`} strokeWidth={item.active ? 2.5 : 2} />
              <span className={`mobile-text-xs font-medium ${item.active ? 'text-[#e51f48]' : 'text-white'}`}>{item.name}</span>
            </button>
          </Link>
        );
      })}
    </nav>
  );
}