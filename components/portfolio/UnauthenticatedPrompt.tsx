"use client";

import { WalletConnect } from "@/components/wallet/WalletConnect";

export function UnauthenticatedPrompt() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-lg border border-slate-700/50 bg-slate-900/30 p-8 text-center">
        <p className="mb-6 text-slate-300">
          Connect your wallet to view your Polymarket portfolio.
        </p>
        <div className="flex justify-center">
          <WalletConnect />
        </div>
      </div>
    </div>
  );
}
