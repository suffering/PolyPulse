"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@/lib/wallet/use-wallet";
import { TraderProfileHeader } from "@/components/TraderProfileHeader";
import { PnLChart } from "@/components/PnLChart";
import { ProfileHeaderSkeleton } from "@/components/ui/Skeleton";
import {
  usePortfolioProfile,
  usePortfolioStats,
  usePortfolioPnL,
  usePortfolioPositions,
  usePortfolioTrades,
  type TradeItem,
} from "@/lib/portfolio";
import type { TimeRange } from "@/lib/trader-stats";
import { UnauthenticatedPrompt } from "@/components/portfolio/UnauthenticatedPrompt";
import { StatisticsCards } from "@/components/portfolio/StatisticsCards";
import { OpenPositionsTable } from "@/components/portfolio/OpenPositionsTable";
import { TradeHistoryTable } from "@/components/portfolio/TradeHistoryTable";
import { useSetPageAiState } from "@/components/ai/PageAiContext";

const TRADES_PAGE_SIZE = 50;
const PNL_RANGES: TimeRange[] = ["1D", "1W", "1M", "YTD", "1Y", "MAX"];

export default function PortfolioPage() {
  const { address, isConnected } = useWallet();
  const [timeRange, setTimeRange] = useState<TimeRange>("MAX");
  const [tradesOffset, setTradesOffset] = useState(0);
  const [accumulatedTrades, setAccumulatedTrades] = useState<TradeItem[]>([]);
  const setPageAiState = useSetPageAiState();

  const profileQuery = usePortfolioProfile(address);
  const statsQuery = usePortfolioStats(address);
  const pnlQuery = usePortfolioPnL(address, timeRange);
  const positionsQuery = usePortfolioPositions(address);
  const tradesQuery = usePortfolioTrades(address, TRADES_PAGE_SIZE, tradesOffset);

  const profile = profileQuery.data;
  const stats = statsQuery.data;
  const pnlResponse = pnlQuery.data;
  const positionsResponse = positionsQuery.data;
  const tradesResponse = tradesQuery.data;

  const chartData = pnlResponse?.data ?? [];
  const currentPnl =
    chartData.length > 0 ? chartData[chartData.length - 1].pnl : 0;

  useEffect(() => {
    if (!tradesResponse) return;
    if (tradesOffset === 0) {
      setAccumulatedTrades(tradesResponse.trades);
    } else {
      setAccumulatedTrades((prev) => [...prev, ...tradesResponse.trades]);
    }
  }, [tradesResponse, tradesOffset]);

  useEffect(() => {
    if (!address) {
      setTradesOffset(0);
      setAccumulatedTrades([]);
    }
  }, [address]);

  useEffect(() => {
    if (!isConnected || !address) {
      setPageAiState({ kind: "none" });
      return;
    }
    setPageAiState({
      kind: "trader",
      state: {
        walletAddress: address,
        profile,
        stats,
        pnl: pnlResponse,
        timeRange,
        openPositions: positionsResponse?.positions ?? [],
        trades: accumulatedTrades,
      },
    });
  }, [
    setPageAiState,
    isConnected,
    address,
    profile,
    stats,
    pnlResponse,
    timeRange,
    positionsResponse,
    accumulatedTrades,
  ]);

  if (!isConnected || !address) {
    return <UnauthenticatedPrompt />;
  }

  const userName =
    profile?.displayUsernamePublic ?? profile?.name ?? profile?.pseudonym ?? null;
  const profileImage = profile?.profileImage ?? null;
  const xUsername = profile?.xUsername ?? null;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      {profileQuery.isLoading && !profile ? (
        <ProfileHeaderSkeleton />
      ) : (
        <TraderProfileHeader
          userName={userName}
          profileImage={profileImage}
          walletAddress={address}
          xUsername={xUsername}
        />
      )}

      <StatisticsCards
        stats={stats}
        isLoading={statsQuery.isLoading}
        isError={statsQuery.isError}
        refetch={statsQuery.refetch}
      />

      <div className="border border-slate-700/50 rounded-lg bg-slate-900/30 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs text-slate-400 mb-1">Total P&L</div>
            <div
              className={`text-3xl font-bold ${
                currentPnl >= 0 ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {currentPnl >= 0 ? "+" : ""}$
              {Math.abs(currentPnl) >= 1_000_000
                ? (currentPnl / 1_000_000).toFixed(2) + "M"
                : Math.abs(currentPnl) >= 1_000
                  ? (currentPnl / 1_000).toFixed(1) + "K"
                  : currentPnl.toFixed(2)}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {PNL_RANGES.map((range) => (
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
        {pnlQuery.isLoading && chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-pulse bg-slate-800/50 rounded h-48 w-full max-w-2xl" />
          </div>
        ) : (
          <PnLChart
            data={chartData}
            isLoading={false}
            currentPnl={currentPnl}
          />
        )}
      </div>

      <OpenPositionsTable
        positions={positionsResponse?.positions ?? []}
        isLoading={positionsQuery.isLoading}
        isError={positionsQuery.isError}
        refetch={positionsQuery.refetch}
      />

      <TradeHistoryTable
        trades={accumulatedTrades}
        hasMore={tradesResponse?.hasMore ?? false}
        onLoadMore={() => setTradesOffset(accumulatedTrades.length)}
        isLoading={tradesQuery.isLoading}
        isLoadingMore={tradesQuery.isFetching && tradesOffset > 0}
        isError={tradesQuery.isError}
        refetch={tradesQuery.refetch}
      />
    </main>
  );
}
