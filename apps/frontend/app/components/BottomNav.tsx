"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Search, 
  User,
  Menu,
  Compass,
  LogIn
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { LucideIcon } from "lucide-react";

interface BottomNavProps {
  isVisible: boolean;
  onMenuOpen: () => void;
}

interface NavItem {
  name: string;
  href?: string;
  icon: LucideIcon;
  active: boolean;
  action?: () => void;
  center?: boolean;
}

export default function BottomNav({ isVisible, onMenuOpen }: BottomNavProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  // Determine profile item based on auth state
  const profileItem: NavItem = user 
    ? { name: "Profile", href: "/profile", icon: User, active: pathname.startsWith("/profile") }
    : { name: "Login", href: "/auth/user/signin", icon: LogIn, active: pathname.startsWith("/auth") };

  // Simplified nav items: Home, Search, Browse, Menu (center), Profile/Login
  const navItems: NavItem[] = [
    { name: "Home", href: "/dashboard", icon: Home, active: pathname === "/dashboard" },
    { name: "Search", href: "/search", icon: Search, active: pathname.startsWith("/search") },
    { name: "Browse", href: "/browse", icon: Compass, active: pathname.startsWith("/browse") },
    { name: "Menu", href: "#", icon: Menu, active: false, action: onMenuOpen, center: true },
    profileItem,
  ];

  return (
    <nav className={`bottom-nav flex justify-between items-center px-4 ${!isVisible ? 'bottom-nav--hidden' : ''}`}>
      {navItems.map((item) => {
        const Icon = item.icon;
        
        if (item.center && item.action) {
          // Centered, larger Menu button with accent background
          return (
            <div key={item.name} className="flex-1 flex justify-center -mt-8"> {/* Increased negative margin */}
              <button
                onClick={item.action}
                className="relative flex flex-col items-center touch-target group"
                aria-label={item.name}
              >
                {/* Larger background circle */}
                <div className="w-18 h-18 rounded-full bg-gradient-to-br from-[#e51f48] to-[#ff4d6d] flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                  <Icon size={30} className="text-white" strokeWidth={2.5} />
                </div>
                <span className="mobile-text-xs font-bold text-white mt-1">{item.name}</span>
                
                {/* Subtle glow effect */}
                <div className="absolute inset-0 rounded-full bg-[#e51f48] opacity-20 blur-md -z-10 group-hover:opacity-30 transition-opacity"></div>
              </button>
            </div>
          );
        }

        // Normal link (Home, Search, Browse, Profile/Login)
        if (!item.href) return null;
        return (
          <Link key={item.name} href={item.href} passHref className="flex-1">
            <button
              className={`bottom-nav__item touch-target flex flex-col items-center w-full ${
                item.active ? 'bottom-nav__item--active' : ''
              }`}
              aria-label={item.name}
              aria-current={item.active ? "page" : undefined}
            >
              <Icon 
                size={24} 
                className={`bottom-nav__icon mb-1 ${
                  item.active ? 'text-[#e51f48]' : 'text-gray-300'
                }`} 
                strokeWidth={item.active ? 2.5 : 2} 
              />
              <span className={`mobile-text-xs font-medium ${
                item.active ? 'text-[#e51f48]' : 'text-white'
              }`}>
                {item.name}
              </span>
            </button>
          </Link>
        );
      })}
    </nav>
  );
}