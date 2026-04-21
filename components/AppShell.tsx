"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Sidebar } from "@/components/landing/Sidebar";
import { cn } from "@/lib/utils";

/**
 * AppShell renders the unified navigation for every page inside the (app) route group.
 *
 * Layout:
 * - On desktop (md+): the fixed left Sidebar is always visible and the content is offset by
 *   ml-[220px] so nothing is hidden behind it.
 * - On mobile (<md): a top bar with a hamburger is rendered. Tapping it slides the same
 *   Sidebar into view from the left with a backdrop. Navigating or tapping the backdrop
 *   closes it. The sidebar is the single source of navigation on every page.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Lock body scroll when the mobile drawer is open so the page behind cannot scroll.
  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  // Close on Escape for accessibility.
  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [mobileOpen]);

  return (
    <>
      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between bg-black border-b border-[#1a1a1a] h-14 px-4">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="PolyPulse" width={32} height={32} className="w-8 h-8" />
          <span className="text-white font-semibold text-sm">PolyPulse</span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={mobileOpen}
          aria-controls="app-sidebar"
          className="p-2 text-[#888] hover:text-white transition-colors"
        >
          <Menu className="w-5 h-5" aria-hidden="true" />
        </button>
      </header>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setMobileOpen(false)}
          className="md:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
        />
      )}

      {/* Sidebar — always rendered; hidden off-screen on mobile unless the drawer is open */}
      <div id="app-sidebar">
        <Sidebar
          className={cn(
            "transition-transform duration-200 ease-out",
            mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          )}
          onNavigate={() => setMobileOpen(false)}
        />

        {/* Close button overlay on mobile when drawer is open */}
        {mobileOpen && (
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation menu"
            className="md:hidden fixed top-3 left-[184px] z-50 p-2 text-[#888] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Content offset by sidebar width on desktop */}
      <div className="md:ml-[220px]">{children}</div>
    </>
  );
}
