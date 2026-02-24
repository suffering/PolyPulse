"use client";

import Link from "next/link";
import { WalletButton } from "@/components/wallet/WalletButton";
import { useWallet } from "@/lib/wallet/use-wallet";

export function Header() {
  const { isConnected } = useWallet();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-[#0d1117]/95 backdrop-blur supports-[backdrop-filter]:bg-[#0d1117]/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-slate-200 font-semibold hover:text-white transition-colors">
          PolyPulse +EV
        </Link>
        <nav className="flex items-center gap-3">
          <Link
            href="/"
            className="rounded-md border border-slate-600 bg-slate-800/50 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-700/50 transition-colors"
          >
            +EV
          </Link>
          <Link
            href="/leaderboard"
            className="rounded-md border border-slate-600 bg-slate-800/50 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-700/50 transition-colors"
          >
            Leaderboard
          </Link>
          <Link
            href="/volume"
            className="rounded-md border border-slate-600 bg-slate-800/50 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-700/50 transition-colors"
          >
            Volume
          </Link>
          <Link
            href="/extradata"
            className="rounded-md border border-slate-600 bg-slate-800/50 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-700/50 transition-colors"
          >
            Extra Data
          </Link>
          <Link
            href="/live"
            className="rounded-md border border-slate-600 bg-slate-800/50 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-700/50 transition-colors"
          >
            Live Feed
          </Link>
          <Link
            href="/search"
            className="rounded-md border border-slate-600 bg-slate-800/50 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-700/50 transition-colors"
          >
            Search Wallet
          </Link>
          {isConnected && (
            <Link
              href="/portfolio"
              className="rounded-md border border-slate-600 bg-slate-800/50 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-700/50 transition-colors"
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
