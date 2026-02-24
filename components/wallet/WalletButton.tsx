"use client";

import { useState } from "react";
import { WalletConnect } from "./WalletConnect";
import { cn } from "@/lib/utils";

interface WalletButtonProps {
  className?: string;
}

export function WalletButton({ className }: WalletButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  return (
    <div
      className={cn("relative", className)}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <WalletConnect />
      {showTooltip && (
        <div className="absolute right-0 top-full mt-1 rounded border border-slate-600 bg-slate-800 px-2 py-1 text-xs text-slate-300 shadow-lg z-50 pointer-events-none">
          Wallet
        </div>
      )}
    </div>
  );
}
