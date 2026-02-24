"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TraderProfileHeader } from "@/components/TraderProfileHeader";
import { PnLChart } from "@/components/PnLChart";
import { StatisticsCards } from "@/components/portfolio/StatisticsCards";
import { SearchPositionsActivityPanel } from "@/components/SearchPositionsActivityPanel";
import {
  ProfileHeaderSkeleton,
  ChartSkeleton,
  Skeleton,
} from "@/components/ui/Skeleton";
import {
  usePortfolioProfile,
  usePortfolioStats,
  usePortfolioPnL,
  usePortfolioPositions,
  usePortfolioTrades,
  type TradeItem,
} from "@/lib/portfolio";
import type { TimeRange } from "@/lib/trader-stats";
import { useSetPageAiState } from "@/components/ai/PageAiContext";

const TRADES_PAGE_SIZE = 100;
// Match Polymarket profile PnL filters: 1D, 1W, 1M, ALL (stored as MAX)
const PNL_RANGES: TimeRange[] = ["1D", "1W", "1M", "MAX"];
const PNL_RANGE_LABELS: Record<TimeRange, string> = {
  "1D": "Past Day",
  "1W": "Past Week",
  "1M": "Past Month",
  YTD: "YTD",
  "1Y": "Past Year",
  MAX: "All-Time",
};

interface RecentSearch {
  wallet: string;
  displayName: string | null;
  profileImage: string | null;
}

const RECENT_STORAGE_KEY = "polypulse-recent-wallet-searches";

function truncateWallet(wallet: string): string {
  if (!wallet || wallet.length < 10) return wallet;
  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
}

function isAddress(value: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(value.trim());
}

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialQ = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(initialQ);
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [formatError, setFormatError] = useState<string | null>(null);
  const [notFoundError, setNotFoundError] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  const [recent, setRecent] = useState<RecentSearch[]>([]);

  const [timeRange, setTimeRange] = useState<TimeRange>("MAX");

  const [tradesOffset, setTradesOffset] = useState(0);
  const [accumulatedTrades, setAccumulatedTrades] = useState<TradeItem[]>([]);
  const setPageAiState = useSetPageAiState();

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(RECENT_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setRecent(
          parsed
            .filter(
              (item): item is RecentSearch =>
                typeof item?.wallet === "string" &&
                typeof item?.displayName !== "undefined" &&
                typeof item?.profileImage !== "undefined"
            )
            .slice(0, 5)
        );
      }
    } catch {
      // ignore
    }
  }, []);

  const saveRecent = useCallback((entry: RecentSearch) => {
    setRecent((prev) => {
      const filtered = prev.filter((r) => r.wallet.toLowerCase() !== entry.wallet.toLowerCase());
      const next = [entry, ...filtered].slice(0, 5);
      try {
        window.localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const clearRecent = () => {
    setRecent([]);
    try {
      window.localStorage.removeItem(RECENT_STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const profileQuery = usePortfolioProfile(resolvedAddress);
  const statsQuery = usePortfolioStats(resolvedAddress);
  const pnlQuery = usePortfolioPnL(resolvedAddress, timeRange);
  const positionsQuery = usePortfolioPositions(resolvedAddress);
  const tradesQuery = usePortfolioTrades(
    resolvedAddress,
    TRADES_PAGE_SIZE,
    tradesOffset
  );

  const profile = profileQuery.data;
  const stats = statsQuery.data;
  const pnlResponse = pnlQuery.data;
  const positionsResponse = positionsQuery.data;
  const tradesResponse = tradesQuery.data;

  const chartData = pnlResponse?.data ?? [];
  const currentPnl =
    pnlResponse?.summaryPnl !== undefined ? pnlResponse.summaryPnl : 0;

  useEffect(() => {
    if (!tradesResponse) return;
    if (tradesOffset === 0) {
      setAccumulatedTrades(tradesResponse.trades);
    } else {
      setAccumulatedTrades((prev) => [...prev, ...tradesResponse.trades]);
    }
  }, [tradesResponse, tradesOffset]);

  useEffect(() => {
    setTradesOffset(0);
    setAccumulatedTrades([]);
  }, [resolvedAddress]);

  useEffect(() => {
    if (!resolvedAddress) {
      setPageAiState({ kind: "none" });
      return;
    }
    setPageAiState({
      kind: "trader",
      state: {
        walletAddress: resolvedAddress,
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
    resolvedAddress,
    profile,
    stats,
    pnlResponse,
    timeRange,
    positionsResponse,
    accumulatedTrades,
  ]);

  const runSearch = useCallback(
    async (raw: string, fromUrl = false) => {
      const value = raw.trim();
      setFormatError(null);
      setNotFoundError(null);
      setResolvedAddress(null);

      if (!value) {
        return;
      }

      if (isAddress(value)) {
        const normalized = value;
        setResolvedAddress(normalized);
        if (!fromUrl) {
          router.push(`/search?q=${encodeURIComponent(normalized)}`);
        }
        saveRecent({
          wallet: normalized,
          displayName: null,
          profileImage: null,
        });
        return;
      }

      setIsResolving(true);
      try {
        const res = await fetch(
          `/api/search/profile?q=${encodeURIComponent(value)}`
        );

        if (!res.ok) {
          if (res.status === 404) {
            setNotFoundError("No Polymarket user found for that username");
          } else {
            setNotFoundError("Failed to search Polymarket profiles");
          }
          return;
        }

        const data = (await res.json()) as {
          wallet: string;
          name: string | null;
          profileImage: string | null;
        };

        if (!data.wallet || !isAddress(data.wallet)) {
          setNotFoundError("No Polymarket user found for that username");
          return;
        }

        setResolvedAddress(data.wallet);
        if (!fromUrl) {
          router.push(`/search?q=${encodeURIComponent(data.wallet)}`);
        }
        saveRecent({
          wallet: data.wallet,
          displayName: data.name,
          profileImage: data.profileImage,
        });
      } finally {
        setIsResolving(false);
      }
    },
    [router, saveRecent]
  );

  useEffect(() => {
    const q = searchParams.get("q") ?? "";
    setQuery(q);
    if (q) {
      runSearch(q, true);
    } else {
      setResolvedAddress(null);
      setFormatError(null);
      setNotFoundError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const value = query.trim();

    if (!value) {
      setFormatError("Please enter a wallet address or username");
      return;
    }

    if (isAddress(value)) {
      setFormatError(null);
      await runSearch(value);
      return;
    }

    await runSearch(value);
  };

  const showNoActivityMessage = useMemo(() => {
    if (!resolvedAddress) return false;
    if (
      profileQuery.isLoading ||
      statsQuery.isLoading ||
      positionsQuery.isLoading ||
      tradesQuery.isLoading ||
      pnlQuery.isLoading
    ) {
      return false;
    }
    if (
      profileQuery.isError ||
      statsQuery.isError ||
      positionsQuery.isError ||
      tradesQuery.isError ||
      pnlQuery.isError
    ) {
      return false;
    }

    const hasPositions = (positionsResponse?.positions ?? []).length > 0;
    const hasTrades = (tradesResponse?.trades ?? []).length > 0;
    const hasChart = chartData.length > 0;

    if (!stats) return false;

    const hasStatsActivity =
      stats.tradingVolume !== 0 ||
      stats.portfolioValue !== 0 ||
      stats.marketsTraded !== 0 ||
      stats.totalPnl !== 0;

    return !hasPositions && !hasTrades && !hasChart && !hasStatsActivity;
  }, [
    resolvedAddress,
    profileQuery.isLoading,
    statsQuery.isLoading,
    positionsQuery.isLoading,
    tradesQuery.isLoading,
    pnlQuery.isLoading,
    profileQuery.isError,
    statsQuery.isError,
    positionsQuery.isError,
    tradesQuery.isError,
    pnlQuery.isError,
    positionsResponse,
    tradesResponse,
    chartData,
    stats,
  ]);

  const currentUserName =
    profile?.displayUsernamePublic ?? profile?.name ?? profile?.pseudonym ?? null;
  const profileImage = profile?.profileImage ?? null;
  const xUsername = profile?.xUsername ?? null;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <section className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-4">Search Wallet</h1>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col items-center gap-3"
        >
          <div className="w-full max-w-2xl flex items-stretch gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setFormatError(null);
                setNotFoundError(null);
              }}
              placeholder="Search any Polymarket wallet address or username"
              className="flex-1 rounded-md border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/60"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-md border border-slate-600 bg-slate-800/70 text-sm text-slate-200 hover:bg-slate-700/70 transition-colors disabled:opacity-60"
              disabled={isResolving}
            >
              {isResolving ? "Searching…" : "Search"}
            </button>
          </div>
          {(formatError || notFoundError) && (
            <p className="text-sm text-red-400">
              {formatError || notFoundError}
            </p>
          )}
        </form>

        {!resolvedAddress && recent.length > 0 && (
          <div className="mt-6 border border-slate-700/50 rounded-lg bg-slate-900/30 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-200">
                Recent searches
              </h2>
              <button
                type="button"
                onClick={clearRecent}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                Clear
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {recent.map((item) => (
                <button
                  key={item.wallet}
                  type="button"
                  onClick={() => {
                    setQuery(item.wallet);
                    runSearch(item.wallet);
                  }}
                  className="flex items-center gap-3 rounded-md border border-slate-700/50 bg-slate-900/40 px-3 py-2 text-left hover:bg-slate-800/50 transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center text-xs text-slate-400">
                    {item.profileImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.profileImage}
                        alt={item.displayName ?? item.wallet}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span>{item.wallet.slice(2, 4).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-slate-100">
                      {item.displayName ?? truncateWallet(item.wallet)}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      {truncateWallet(item.wallet)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {resolvedAddress && (
        <>
          {profileQuery.isLoading && !profile ? (
            <ProfileHeaderSkeleton />
          ) : (
            <TraderProfileHeader
              userName={currentUserName}
              profileImage={profileImage}
              walletAddress={resolvedAddress}
              xUsername={xUsername}
            />
          )}

          {showNoActivityMessage && (
            <div className="border border-slate-700/50 rounded-lg bg-slate-900/30 p-4 mb-6">
              <p className="text-slate-300 mb-2">
                This wallet has no Polymarket activity.
              </p>
              <a
                href="https://polymarket.com"
                target="_blank"
                rel="noreferrer"
                className="text-sm text-amber-400 hover:text-amber-300"
              >
                Visit Polymarket →
              </a>
            </div>
          )}

          <StatisticsCards
            stats={stats}
            isLoading={statsQuery.isLoading}
            isError={statsQuery.isError}
            refetch={statsQuery.refetch}
          />

          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs text-slate-400 mb-1">Profit/Loss</div>
                <div
                  className={`text-3xl font-bold ${
                    currentPnl >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {currentPnl >= 0 ? "+" : ""}
                  $
                  {Math.abs(currentPnl) >= 1_000_000
                    ? (currentPnl / 1_000_000).toFixed(2) + "M"
                    : Math.abs(currentPnl) >= 100_000
                    ? (currentPnl / 1_000).toFixed(1) + "K"
                    : currentPnl.toFixed(2)}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {PNL_RANGE_LABELS[timeRange]}
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
                    {range === "MAX" ? "ALL" : range}
                  </button>
                ))}
              </div>
            </div>
            {pnlQuery.isLoading && chartData.length === 0 ? (
              <ChartSkeleton />
            ) : (
              <PnLChart
                data={chartData}
                isLoading={false}
                currentPnl={currentPnl}
              />
            )}
          </div>

          <SearchPositionsActivityPanel
            positions={positionsResponse?.positions ?? []}
            trades={accumulatedTrades}
            tradesHasMore={tradesResponse?.hasMore ?? false}
            onLoadMoreTrades={() => setTradesOffset((prev) => prev + TRADES_PAGE_SIZE)}
            isPositionsLoading={positionsQuery.isLoading}
            isTradesLoading={tradesQuery.isLoading}
            isTradesLoadingMore={tradesQuery.isFetching && tradesOffset > 0}
            isPositionsError={positionsQuery.isError}
            isTradesError={tradesQuery.isError}
            refetchPositions={positionsQuery.refetch}
            refetchTrades={tradesQuery.refetch}
          />
        </>
      )}

      {!resolvedAddress && !initialQ && (
        <div className="mt-10 flex justify-center">
          <div className="flex items-center gap-3 text-slate-500">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

