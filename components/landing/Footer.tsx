"use client";

import Link from "next/link";
import Image from "next/image";

type FooterLink = { label: string; href: string; external?: boolean };

const FOOTER_LINKS: Record<string, FooterLink[]> = {
  Tools: [
    { label: "+EV Engine", href: "/ev" },
    { label: "Leaderboard", href: "/leaderboard" },
    { label: "Live Feed", href: "/live" },
    { label: "Volume", href: "/volume" },
  ],
  Explore: [
    { label: "Creators", href: "/creators" },
    { label: "Markets", href: "/markets" },
    { label: "Search Wallet", href: "/search" },
    { label: "Portfolio", href: "/portfolio" },
  ],
  Resources: [
    { label: "Polymarket", href: "https://polymarket.com", external: true },
    { label: "API Docs", href: "#" },
    { label: "Discord", href: "#" },
    { label: "Twitter", href: "#" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/30">
      <div className="max-w-7xl mx-auto px-3 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-1.5 mb-2">
              <Image
                src="/logo.png"
                alt="PolyPulse"
                width={24}
                height={24}
                className="w-[24px] h-[24px]"
              />
              <span className="text-lg font-semibold text-foreground">PolyPulse</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-2">
              Real-time analytics and market intelligence for Polymarket traders.
            </p>
            <p className="text-xs text-muted-foreground/60">
              Not financial advice. Trade responsibly.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-sm font-semibold text-foreground mb-2">{title}</h3>
              <ul className="space-y-1">
                {links.map((link) => (
                  <li key={link.label}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-6 pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            {new Date().getFullYear()} PolyPulse. All data sourced from Polymarket APIs.
          </p>
          <div className="flex items-center gap-3">
            <Link
              href="#"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="#"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
