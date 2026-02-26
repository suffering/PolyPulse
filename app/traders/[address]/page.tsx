"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { TraderProfileHeader } from "@/components/TraderProfileHeader";
import { PnLChart } from "@/components/PnLChart";
import { PerformanceCard } from "@/components/PerformanceCard";
import { MonthlyPnLGrid } from "@/components/MonthlyPnLGrid";
import { ProfileHeaderSkeleton } from "@/components/ui/Skeleton";
import type { TraderStats, PnLDataPoint } from "@/lib/leaderboard";
import type { PerformanceMetrics, TimeRange } from "@/lib/trader-stats";
import { aggregateMonthlyPnL, getMinYear, getMaxYear } from "@/lib/trader-stats";

interface TraderResponse {
  address: string;
  stats: TraderStats;
  lastUpdated: string;
}

interface PnLHistoryResponse {
  address: string;
  range: TimeRange;
  data: PnLDataPoint[];
  lastUpdated: string;
}

interface PerformanceResponse {
  address: string;
  performance: PerformanceMetrics;
  lastUpdated: string;
}

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
    value === null
      ? "..."
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

export default function TraderDetailPage() {
  const params = useParams();
  const address = typeof params.address === "string" ? params.address : "";

  const [timeRange, setTimeRange] = useState<TimeRange>("MAX");
  const [year, setYear] = useState(new Date().getFullYear());

  const { data: traderData, isLoading: traderLoading } = useQuery<TraderResponse>({
    queryKey: ["trader", address],
    queryFn: async () => {
      const res = await fetch(`/api/traders/${encodeURIComponent(address)}`);
      if (!res.ok) throw new Error("Failed to load trader");
      return res.json();
    },
    enabled: !!address && /^0x[a-fA-F0-9]{40}$/.test(address),
    staleTime: 2 * 60 * 1000,
  });

  const { data: pnlHistory, isLoading: pnlLoading } = useQuery<PnLHistoryResponse>({
    queryKey: ["pnl-history", address, timeRange],
    queryFn: async () => {
      const res = await fetch(
        `/api/traders/${encodeURIComponent(address)}/pnl-history?range=${timeRange}`
      );
      if (!res.ok) throw new Error("Failed to load P&L history");
      return res.json();
    },
    enabled: !!address && /^0x[a-fA-F0-9]{40}$/.test(address),
    staleTime: 2 * 60 * 1000,
  });

  const { data: performance, isLoading: performanceLoading } =
    useQuery<PerformanceResponse>({
      queryKey: ["performance", address],
      queryFn: async () => {
        const res = await fetch(`/api/traders/${encodeURIComponent(address)}/performance`);
        if (!res.ok) throw new Error("Failed to load performance");
        return res.json();
      },
      enabled: !!address && /^0x[a-fA-F0-9]{40}$/.test(address),
      staleTime: 2 * 60 * 1000,
    });

  const stats = traderData?.stats;
  const chartData = pnlHistory?.data || [];
  const currentPnl = useMemo(() => {
    if (!chartData || chartData.length === 0) return 0;
    return chartData[chartData.length - 1]?.pnl || 0;
  }, [chartData]);

  const monthlyData = useMemo(() => {
    if (!pnlHistory?.data) return {};
    const closedPositions = pnlHistory.data.map((point) => ({
      timestamp: point.timestamp,
      realizedPnl: point.pnl,
      title: "",
      outcome: "",
      avgPrice: 0,
      curPrice: 0,
      totalBought: 0,
      conditionId: "",
      asset: "",
    }));
    return aggregateMonthlyPnL(closedPositions, year);
  }, [pnlHistory, year]);

  const minYear = useMemo(() => {
    if (!pnlHistory?.data || pnlHistory.data.length === 0) return new Date().getFullYear();
    return getMinYear(
      pnlHistory.data.map((p) => ({
        timestamp: p.timestamp,
        realizedPnl: p.pnl,
        title: "",
        outcome: "",
        avgPrice: 0,
        curPrice: 0,
        totalBought: 0,
        conditionId: "",
        asset: "",
      }))
    );
  }, [pnlHistory]);

  const maxYear = getMaxYear();

  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return (
      <div className="min-h-screen bg-[#0d1117] text-slate-200 font-mono flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Invalid wallet address</p>
          <Link
            href="/leaderboard"
            className="px-4 py-2 rounded-md border border-slate-600 bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 transition-colors text-sm"
          >
            ← Back to Leaderboard
          </Link>
        </div>
      </div>
    );
  }

  if (traderLoading || !stats) {
    return (
      <div className="min-h-screen bg-[#0d1117] text-slate-200 font-mono">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="mb-6">
            <Link
              href="/leaderboard"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-slate-600 bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 transition-colors text-sm"
            >
              ← Back to Leaderboard
            </Link>
          </div>
          <ProfileHeaderSkeleton />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="border border-slate-700/50 rounded-lg bg-slate-900/30 p-4 h-20 animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-200 font-mono">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href="/leaderboard"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-slate-600 bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 transition-colors text-sm"
          >
            ← Back to Leaderboard
          </Link>
        </div>

        <TraderProfileHeader
          userName={stats.userName}
          profileImage={stats.profileImage}
          walletAddress={address}
          xUsername={stats.xUsername}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard
            label="Trading Volume"
            value={stats.tradingVolume}
            valueColor="text-emerald-400"
          />
          <StatCard
            label="Portfolio Size"
            value={stats.portfolioValue}
            valueColor="text-sky-400"
          />
          <StatCard
            label="Markets Traded"
            value={stats.marketsTraded}
            isCurrency={false}
            valueColor="text-amber-400"
          />
        </div>

        <div className="border border-slate-700/50 rounded-lg bg-slate-900/30 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs text-slate-400 mb-1">Total P&L</div>
              <div
                className={`text-3xl font-bold ${
                  currentPnl >= 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {formatCurrency(currentPnl)}
              </div>
            </div>
            <div className="flex gap-2">
              {(["1M", "1Y", "YTD", "MAX"] as TimeRange[]).map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    timeRange === range
                      ? "bg-amber-500/20 border border-amber-500/50 text-amber-400"
                      : "bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:bg-slate-700/50"
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
          <PnLChart data={chartData} isLoading={pnlLoading} currentPnl={currentPnl} />
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-bold text-white mb-4">Portfolio Performance</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {(["1D", "1W", "1M", "YTD", "1Y", "MAX"] as const).map((period) => (
              <PerformanceCard
                key={period}
                label={period}
                value={performance?.performance[period]?.pnl || 0}
                isLoading={performanceLoading}
              />
            ))}
          </div>
        </div>

        <div className="border border-slate-700/50 rounded-lg bg-slate-900/30 p-6">
          <MonthlyPnLGrid
            year={year}
            monthlyData={monthlyData}
            onYearChange={setYear}
            minYear={minYear}
            maxYear={maxYear}
          />
        </div>
      </div>
    </div>
  );
}
