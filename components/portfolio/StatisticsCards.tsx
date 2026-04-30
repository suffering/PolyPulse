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
  valueColor = "text-white",
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
    <div className="border border-[#1a1a2e] rounded-xl bg-[#0d0d14] p-4">
      <div className="text-[10px] uppercase tracking-widest text-white/30 font-semibold mb-2">{label}</div>
      <div className={`text-xl font-bold font-mono tabular-nums ${valueColor}`}>{display}</div>
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
      <div className="border border-[#1a1a2e] rounded-xl bg-[#0d0d14] p-6 mb-5">
        <p className="text-white/40 text-sm font-mono mb-2">Couldn&apos;t load stats.</p>
        {refetch && (
          <button
            type="button"
            onClick={() => refetch()}
            className="text-xs text-amber-400 hover:text-amber-300 font-mono"
          >
            Try again
          </button>
        )}
      </div>
    );
  }

  const s = stats!;
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
      <StatCard
        label="Trading Volume"
        value={s.tradingVolume}
        valueColor="text-[#4ade80]"
      />
      <StatCard
        label="Portfolio Size"
        value={s.portfolioValue}
        valueColor="text-[#4ade80]"
      />
      <StatCard
        label="Markets Traded"
        value={s.marketsTraded}
        isCurrency={false}
        valueColor="text-[#facc15]"
      />
      <StatCard
        label="Total PnL"
        value={s.totalPnl}
        valueColor={s.totalPnl >= 0 ? "text-[#4ade80]" : "text-[#f87171]"}
      />
      <StatCard
        label="Open Interest"
        value={s.openInterest}
        valueColor="text-[#4ade80]"
      />
      <StatCard
        label="Win Rate"
        value={s.winRate != null ? `${s.winRate}%` : "—"}
        isCurrency={false}
        valueColor="text-[#facc15]"
      />
    </div>
  );
}
