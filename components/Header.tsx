"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletButton } from "@/components/wallet/WalletButton";
import { useWallet } from "@/lib/wallet/use-wallet";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "+EV" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/creators", label: "Creators" },
  { href: "/volume", label: "Volume" },
  { href: "/extradata", label: "Extra Data" },
  { href: "/live", label: "Live Feed" },
  { href: "/search", label: "Search Wallet" },
] as const;

const linkBase =
  "rounded-md border px-3 py-1.5 text-sm transition-colors";
const linkInactive =
  "border-slate-600 bg-slate-800/50 text-slate-300 hover:bg-slate-700/50";
const linkActive =
  "border-amber-500/60 bg-amber-500/20 text-amber-100";

function HeaderContent() {
  const pathname = usePathname() ?? "/";
  const { isConnected } = useWallet();

  return (
    <header className="sticky top-0 z-[100] isolate border-b border-slate-800 bg-[#0d1117]/95 backdrop-blur supports-[backdrop-filter]:bg-[#0d1117]/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link
          href="/"
          className="shrink-0 text-slate-200 font-semibold hover:text-white transition-colors"
        >
          PolyPulse +EV
        </Link>
        <nav className="flex items-center gap-3">
          {NAV_LINKS.map(({ href, label }) => {
            const isActive =
              href === "/"
                ? pathname === "/"
                : pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  linkBase,
                  isActive ? linkActive : linkInactive
                )}
              >
                {label}
              </Link>
            );
          })}
          {isConnected && (
            <Link
              href="/portfolio"
              className={cn(
                linkBase,
                pathname === "/portfolio" || pathname.startsWith("/portfolio/")
                  ? linkActive
                  : linkInactive
              )}
            >
              Portfolio
            </Link>
          )}
          <WalletButton />
        </nav>
      </div>
    </header>
  );
}

export function Header() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const headerContent = <HeaderContent />;
  const portalTarget =
    typeof document !== "undefined" ? document.getElementById("header-portal") : null;

  if (!mounted || !portalTarget) {
    return headerContent;
  }

  return createPortal(headerContent, portalTarget);
}
