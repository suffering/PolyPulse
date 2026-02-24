"use client";

import { Skeleton } from "./ui/Skeleton";

interface PerformanceCardProps {
  label: "1D" | "1W" | "1M" | "YTD" | "1Y" | "MAX";
  value: number;
  isLoading: boolean;
}

function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) return "$0.00";
  if (Math.abs(value) >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

export function PerformanceCard({ label, value, isLoading }: PerformanceCardProps) {
  const isPositive = value >= 0;
  const isZero = Math.abs(value) < 0.01;

  const colorClass = isZero
    ? "text-slate-500"
    : isPositive
    ? "text-emerald-400"
    : "text-red-400";

  const bgClass = isZero
    ? "bg-slate-800/50"
    : isPositive
    ? "bg-emerald-500/10"
    : "bg-red-500/10";

  const borderClass = isZero
    ? "border-slate-700/50"
    : isPositive
    ? "border-emerald-500/30"
    : "border-red-500/30";

  return (
    <div
      className={`border rounded-lg p-4 transition-colors ${bgClass} ${borderClass}`}
    >
      <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">
        {label}
      </div>
      {isLoading ? (
        <Skeleton className="h-6 w-20" />
      ) : (
        <div className={`text-lg font-bold ${colorClass}`}>
          {isPositive && !isZero ? "+" : ""}
          {formatCurrency(value)}
        </div>
      )}
    </div>
  );
}
