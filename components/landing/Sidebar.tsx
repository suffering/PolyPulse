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
  Wallet
} from "lucide-react";

const NAV_LINKS = [
  { href: "/ev", label: "+EV", icon: Sparkles, customIcon: "/plus-circle-green.png" },
  { href: "/extradata", label: "Markets", icon: FlaskConical, customIcon: "/markets-icon.png" },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy, customIcon: "/leaderboard-icon.png" },
  { href: "/creators", label: "Creators", icon: Users, customIcon: "/creators-icon.png" },
  { href: "/volume", label: "Volume", icon: BarChart3, customIcon: "/volume-icon.png" },
];

const TOOLS_LINKS = [
  { href: "/live", label: "Live Feed", icon: Activity, customIcon: "/watchlist-icon.png" },
  { href: "/search", label: "Search Wallet", icon: Search, customIcon: "/search-icon.png" },
  { href: "/portfolio", label: "Portfolio", icon: Wallet, customIcon: "/wallet-icon.png" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-[220px] bg-black border-r border-[#1a1a1a] flex flex-col z-40">
      {/* Logo */}
      <div className="p-3 border-b border-[#1a1a1a] flex items-center justify-center">
        <Link href="/">
          <Image
            src="/logo.png"
            alt="PolyPulse"
            width={120}
            height={120}
            className="w-[120px] h-[120px]"
          />
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-hidden py-3">
        <div className="px-2 space-y-1">
          {/* Tools Section */}
          <div>
            <p className="text-[10px] uppercase tracking-wide text-[#555] px-2 mb-3 font-light">Tools</p>
            {NAV_LINKS.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-2 py-2 rounded-md text-sm transition-colors ${
                    isActive
                      ? "text-primary bg-primary/10"
                      : "text-[#888] hover:text-white hover:bg-[#111]"
                  }`}
                >
                  {link.customIcon ? (
                    <Image
                      src={link.customIcon}
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
            })}

            {/* Additional Tools */}
            <div className="mt-1">
              {TOOLS_LINKS.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 px-2 py-2 rounded-md text-sm transition-colors ${
                      isActive
                        ? "text-primary bg-primary/10"
                        : "text-[#888] hover:text-white hover:bg-[#111]"
                    }`}
                  >
                    {link.customIcon ? (
                      <Image
                        src={link.customIcon}
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
              })}
            </div>
          </div>

          {/* External Links */}
          <div className="mt-4 pt-3 border-t border-[#1a1a1a]">
            <p className="text-[10px] uppercase tracking-wide text-[#555] px-2 mb-2 font-light">Socials</p>
            <a
              href="https://polymarket.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-2 py-2 rounded-md text-sm text-[#888] hover:text-white hover:bg-[#111] transition-colors"
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
              href="https://x.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-2 py-2 rounded-md text-sm text-[#888] hover:text-white hover:bg-[#111] transition-colors"
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
        <p className="text-[10px] text-[#444] text-center">
          Not financial advice
        </p>
      </div>
    </aside>
  );
}
