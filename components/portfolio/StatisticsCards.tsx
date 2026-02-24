"use client";

import { StatCardsSkeleton } from "@/components/ui/Skeleton";
import type { PortfolioStats } from "@/lib/portfolio";

function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) return "$0.00";
  if (Math.abs(value) >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

function StatCard({
  label,
  value,
  valueColor = "text-slate-200",
  isCurrency = true,
}: {
  label: string;
  value: string | number | null;
  valueColor?: string;
  isCurrency?: boolean;
}) {
  const display =
    value === null || value === undefined
      ? "—"
      : typeof value === "number"
        ? isCurrency
          ? formatCurrency(value)
          : value.toLocaleString()
        : value;

  return (
    <div className="border border-slate-700/50 rounded-lg bg-slate-900/30 p-4">
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <div className={`text-lg font-bold ${valueColor}`}>{display}</div>
    </div>
  );
}

interface StatisticsCardsProps {
  stats: PortfolioStats | null | undefined;
  isLoading: boolean;
  isError: boolean;
  refetch?: () => void;
}

export function StatisticsCards({
  stats,
  isLoading,
  isError,
  refetch,
}: StatisticsCardsProps) {
  if (isLoading && !stats) {
    return <StatCardsSkeleton count={6} />;
  }

  if (isError) {
    return (
      <div className="border border-slate-700/50 rounded-lg bg-slate-900/30 p-6 mb-6">
        <p className="text-slate-400 mb-2">Couldn&apos;t load stats.</p>
        {refetch && (
          <button
            type="button"
            onClick={() => refetch()}
            className="text-sm text-amber-400 hover:text-amber-300"
          >
            Try again
          </button>
        )}
      </div>
    );
  }

  const s = stats!;
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
        <StatCard
          label="Trading Volume"
          value={s.tradingVolume}
          valueColor="text-emerald-400"
        />
        <StatCard
          label="Portfolio Size"
          value={s.portfolioValue}
          valueColor="text-sky-400"
        />
        <StatCard
          label="Markets Traded"
          value={s.marketsTraded}
          isCurrency={false}
          valueColor="text-amber-400"
        />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <StatCard
          label="Total PnL"
          value={s.totalPnl}
          valueColor={s.totalPnl >= 0 ? "text-emerald-400" : "text-red-400"}
        />
        <StatCard
          label="Open Interest"
          value={s.openInterest}
          valueColor="text-sky-400"
        />
        <StatCard
          label="Win Rate"
          value={s.winRate != null ? `${s.winRate}%` : "—"}
          isCurrency={false}
          valueColor="text-amber-400"
        />
      </div>
    </>
  );
}
