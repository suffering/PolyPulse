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
  { href: "/volume", label: "Volume", icon: BarChart3 },
];

const TOOLS_LINKS = [
  { href: "/live", label: "Live Feed", icon: Activity },
  { href: "/search", label: "Search Wallet", icon: Search },
  { href: "/portfolio", label: "Portfolio", icon: Wallet },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-[200px] bg-black border-r border-[#1a1a1a] flex flex-col z-40">
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
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="px-4 space-y-1">
          {NAV_LINKS.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-[#888] hover:text-white hover:bg-[#111]"
                }`}
              >
                {link.customIcon ? (
                  <Image
                    src={link.customIcon}
                    alt=""
                    width={11}
                    height={11}
                    className="w-[11px] h-[11px]"
                  />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Tools Section */}
        <div className="px-4 mt-6">
          <p className="text-[10px] uppercase tracking-wider text-[#444] mb-2 px-3">Tools</p>
          <div className="space-y-1">
            {TOOLS_LINKS.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                    isActive
                      ? "text-primary bg-primary/10"
                      : "text-[#888] hover:text-white hover:bg-[#111]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* External Links */}
        <div className="px-4 mt-6">
          <p className="text-[10px] uppercase tracking-wider text-[#444] mb-2 px-3">External</p>
          <div className="space-y-1">
            <a
              href="https://polymarket.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-[#888] hover:text-white hover:bg-[#111] transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none"/>
              </svg>
              Polymarket
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-[#888] hover:text-white hover:bg-[#111] transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              Twitter
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
