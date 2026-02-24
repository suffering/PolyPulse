"use client";

import { cn } from "@/lib/utils";

interface ApprovalStatusProps {
  usdc: boolean;
  ctf: boolean;
  isLoading?: boolean;
  className?: string;
}

export function ApprovalStatus({ usdc, ctf, isLoading, className }: ApprovalStatusProps) {
  if (isLoading) {
    return (
      <div className={cn("flex gap-3 text-sm text-slate-400", className)}>
        <span className="animate-pulse">USDC —</span>
        <span className="animate-pulse">CTF —</span>
      </div>
    );
  }
  return (
    <div className={cn("flex flex-wrap gap-3 text-sm", className)}>
      <span
        className={cn(
          "flex items-center gap-1.5",
          usdc ? "text-emerald-400" : "text-amber-400"
        )}
        title={usdc ? "USDC spending approved for exchange" : "USDC not approved for exchange"}
      >
        {usdc ? "✓" : "!"} USDC {usdc ? "Approved" : "Not approved"}
      </span>
      <span
        className={cn(
          "flex items-center gap-1.5",
          ctf ? "text-emerald-400" : "text-amber-400"
        )}
        title={ctf ? "CTF operator approved for exchange" : "CTF not approved (required for selling)"}
      >
        {ctf ? "✓" : "!"} CTF {ctf ? "Approved" : "Not approved"}
      </span>
      <p className="w-full text-xs text-slate-500 mt-1">
        Approvals are checked but not granted through this app. Grant them in your wallet or on Polymarket.
      </p>
    </div>
  );
}
