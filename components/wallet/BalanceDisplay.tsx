"use client";

import { cn } from "@/lib/utils";

interface BalanceDisplayProps {
  balance: number;
  isLoading?: boolean;
  className?: string;
}

export function BalanceDisplay({ balance, isLoading, className }: BalanceDisplayProps) {
  if (isLoading) {
    return (
      <div className={cn("animate-pulse h-6 w-16 rounded bg-slate-700", className)} />
    );
  }
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(balance);
  return (
    <span className={cn("font-medium tabular-nums", className)}>{formatted}</span>
  );
}
