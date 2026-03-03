"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Menu, X } from "lucide-react";
import { WalletButton } from "@/components/wallet/WalletButton";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/ev", label: "+EV Engine" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/creators", label: "Creators" },
  { href: "/live", label: "Live Feed" },
  { href: "/volume", label: "Volume" },
  { href: "/extradata", label: "Markets" },
] as const;

export function LandingNavbar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-[64px] bg-background/95 backdrop-blur-md border-b border-border">
      <div className="mx-auto h-full max-w-7xl flex items-center justify-between px-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1.5 shrink-0">
          <Image
            src="/logo.png"
            alt="PolyPulse"
            width={32}
            height={32}
            className="w-[32px] h-[32px]"
          />
          <span className="text-lg font-semibold text-foreground hidden sm:block">
            PolyPulse
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="px-2 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors duration-150"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* Search */}
          {searchOpen ? (
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search wallet..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-[200px] h-[40px] px-2 pr-4 bg-card border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                autoFocus
              />
              <button
                type="button"
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery("");
                }}
                className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground"
              >
                <X className="w-[16px] h-[16px]" />
              </button>
            </form>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Search"
            >
              <Search className="w-[20px] h-[20px]" />
            </button>
          )}

          {/* Wallet Connect */}
          <WalletButton />

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Menu"
          >
            {mobileMenuOpen ? (
              <X className="w-[24px] h-[24px]" />
            ) : (
              <Menu className="w-[24px] h-[24px]" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-[64px] left-0 right-0 bg-background border-b border-border">
          <nav className="flex flex-col p-2">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-card rounded-md transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
