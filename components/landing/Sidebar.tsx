"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  FlaskConical,
  Trophy,
  Users,
  Activity,
  BarChart3,
  Search,
  Wallet,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";

const HOME_LINK = { href: "/", label: "Home", icon: Home, customIcon: null as string | null };

const NAV_LINKS = [
  { href: "/ev", label: "+EV", icon: Sparkles, customIcon: "/plus-circle-green.png" },
  { href: "/markets", label: "Markets", icon: FlaskConical, customIcon: "/markets-icon.png" },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy, customIcon: "/leaderboard-icon.png" },
  { href: "/creators", label: "Creators", icon: Users, customIcon: "/creators-icon.png" },
  { href: "/volume", label: "Volume", icon: BarChart3, customIcon: "/volume-icon.png" },
];

const TOOLS_LINKS = [
  { href: "/live", label: "Live Feed", icon: Activity, customIcon: "/watchlist-icon.png" },
  { href: "/search", label: "Search Wallet", icon: Search, customIcon: "/search-icon.png" },
  { href: "/portfolio", label: "Portfolio", icon: Wallet, customIcon: "/wallet-icon.png" },
];

type SidebarProps = {
  /** Extra classes for positioning/visibility (used by AppShell for mobile drawer) */
  className?: string;
  /** Called when the user clicks a nav link (used to close mobile drawer) */
  onNavigate?: () => void;
};

/**
 * Returns true when the given route should be considered "active" for this pathname.
 * Matches exact route and also nested routes (e.g. /traders/0x... is active under /leaderboard only when linked).
 */
function isRouteActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function Sidebar({ className, onNavigate }: SidebarProps = {}) {
  const pathname = usePathname();

  const renderLink = (link: {
    href: string;
    label: string;
    icon: typeof Home;
    customIcon: string | null;
  }) => {
    const Icon = link.icon;
    const isActive = isRouteActive(pathname, link.href);
    return (
      <Link
        key={link.href}
        href={link.href}
        onClick={onNavigate}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "flex items-center gap-2 px-2 py-2 rounded-md text-sm transition-all duration-200 ease-out",
          isActive
            ? "text-primary bg-primary/10"
            : "text-[#888] hover:text-white hover:bg-[#111]"
        )}
      >
        {link.customIcon ? (
          <Image
            src={link.customIcon || "/placeholder.svg"}
            alt=""
            width={13}
            height={13}
            className="w-[13px] h-[13px] flex-shrink-0"
          />
        ) : (
          <Icon className="w-4 h-4 flex-shrink-0" />
        )}
        {link.label}
      </Link>
    );
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen w-[220px] bg-black border-r border-[#1a1a1a] flex flex-col z-40",
        className
      )}
    >
      {/* Logo */}
      <div className="p-4 border-b border-[#1a1a1a] flex flex-col items-center justify-center gap-1.5">
        <Link href="/" onClick={onNavigate} className="flex justify-center">
          <Image
            src="/logo.png"
            alt="PolyPulse"
            width={120}
            height={120}
            className="w-[120px] h-[120px]"
          />
        </Link>
        <p className="text-[11px] text-[#777] font-light tracking-wide">made in nyc</p>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto py-3">
        <div className="px-2 space-y-1">
          {/* Home link - always accessible */}
          <div className="mb-3">{renderLink(HOME_LINK)}</div>

          {/* Tools Section */}
          <div>
            <p className="text-[10px] uppercase tracking-wide text-[#555] px-2 mb-3 font-light">
              Tools
            </p>
            {NAV_LINKS.map(renderLink)}

            {/* Additional Tools */}
            <div className="mt-0">{TOOLS_LINKS.map(renderLink)}</div>
          </div>

          {/* External Links */}
          <div className="mt-4 pt-3 border-t border-[#1a1a1a]">
            <p className="text-[10px] uppercase tracking-wide text-[#555] px-2 mb-2 font-light">
              Socials
            </p>
            <a
              href="https://polymarket.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-2 py-2 rounded-md text-sm text-[#888] hover:text-white hover:bg-[#111] transition-all duration-200 ease-out"
            >
              <Image
                src="/polymarket-icon.png"
                alt=""
                width={13}
                height={13}
                className="w-[13px] h-[13px] flex-shrink-0"
              />
              Polymarket
            </a>
            <a
              href="https://x.com/unluckixmr"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-2 py-2 rounded-md text-sm text-[#888] hover:text-white hover:bg-[#111] transition-all duration-200 ease-out"
            >
              <Image
                src="/x-icon.png"
                alt=""
                width={13}
                height={13}
                className="w-[13px] h-[13px] flex-shrink-0"
              />
              X
            </a>
          </div>
        </div>
      </nav>

      {/* Bottom */}
      <div className="p-4 border-t border-[#1a1a1a]">
        <p className="text-[10px] text-[#444] text-center">Not financial advice</p>
      </div>
    </aside>
  );
}
