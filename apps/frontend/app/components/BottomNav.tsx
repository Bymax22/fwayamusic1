"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Search, 
  Library, 
  User,
  Menu
} from "lucide-react";

interface BottomNavProps {
  isVisible: boolean;
  currentPath: string;
  onMenuOpen: () => void;
}

export default function BottomNav({ isVisible, currentPath, onMenuOpen }: BottomNavProps) {
  const pathname = usePathname();

  const navItems = [
    { 
      name: "Home", 
      href: "/dashboard", 
      icon: Home,
      active: pathname === "/dashboard"
    },
    { 
      name: "Search", 
      href: "/search", 
      icon: Search,
      active: pathname.startsWith("/search")
    },
    { 
      name: "Menu", 
      href: "#", 
      icon: Menu,
      active: false,
      action: onMenuOpen
    },
    { 
      name: "Library", 
      href: "/library", 
      icon: Library,
      active: pathname.startsWith("/library")
    },
    { 
      name: "Profile", 
      href: "/profile", 
      icon: User,
      active: pathname.startsWith("/profile")
    },
  ];

  return (
    <nav className={`bottom-nav ${!isVisible ? 'bottom-nav--hidden' : ''}`}>
      {navItems.map((item) => {
        const Icon = item.icon;
        
        if (item.action) {
          return (
            <button
              key={item.name}
              onClick={item.action}
              className={`bottom-nav__item touch-target ${
                item.active ? 'bottom-nav__item--active' : ''
              }`}
              aria-label={item.name}
            >
              <Icon 
                size={20} 
                className="bottom-nav__icon" 
                strokeWidth={item.active ? 2.5 : 2}
              />
              <span className="mobile-text-xs font-medium">{item.name}</span>
            </button>
          );
        }

        return (
          <Link key={item.name} href={item.href} passHref>
            <button
              className={`bottom-nav__item touch-target ${
                item.active ? 'bottom-nav__item--active' : ''
              }`}
              aria-label={item.name}
              aria-current={item.active ? "page" : undefined}
            >
              <Icon 
                size={20} 
                className="bottom-nav__icon" 
                strokeWidth={item.active ? 2.5 : 2}
              />
              <span className="mobile-text-xs font-medium">{item.name}</span>
            </button>
          </Link>
        );
      })}
    </nav>
  );
}