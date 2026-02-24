"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { LeaderboardCard } from "@/components/LeaderboardCard";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useSetPageAiState } from "@/components/ai/PageAiContext";
import type {
  LeaderboardEntry,
  LeaderboardCategory,
  LeaderboardTimePeriod,
  LeaderboardOrderBy,
} from "@/lib/leaderboard";

interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  lastUpdated: string;
}

const CATEGORIES: { value: LeaderboardCategory; label: string }[] = [
  { value: "OVERALL", label: "Overall" },
  { value: "POLITICS", label: "Politics" },
  { value: "SPORTS", label: "Sports" },
  { value: "CRYPTO", label: "Crypto" },
  { value: "CULTURE", label: "Culture" },
  { value: "ECONOMICS", label: "Economics" },
  { value: "TECH", label: "Tech" },
  { value: "FINANCE", label: "Finance" },
];

const TIME_PERIODS: { value: LeaderboardTimePeriod; label: string }[] = [
  { value: "DAY", label: "Today" },
  { value: "WEEK", label: "This Week" },
  { value: "MONTH", label: "This Month" },
  { value: "ALL", label: "All Time" },
];

const ORDER_BY: { value: LeaderboardOrderBy; label: string }[] = [
  { value: "PNL", label: "P&L" },
  { value: "VOL", label: "Volume" },
];

async function fetchLeaderboard(
  category: LeaderboardCategory,
  timePeriod: LeaderboardTimePeriod,
  orderBy: LeaderboardOrderBy,
  page: number
): Promise<LeaderboardResponse> {
  const params = new URLSearchParams({
    category,
    timePeriod,
    orderBy,
    limit: "50",
    offset: String(page * 50),
  });

  const res = await fetch(`/api/leaderboard?${params}`);
  if (!res.ok) throw new Error("Failed to fetch leaderboard");
  return res.json();
}

export default function LeaderboardPage() {
  const [category, setCategory] = useState<LeaderboardCategory>("OVERALL");
  const [timePeriod, setTimePeriod] = useState<LeaderboardTimePeriod>("ALL");
  const [orderBy, setOrderBy] = useState<LeaderboardOrderBy>("PNL");
  const [page, setPage] = useState(0);
  const [sortColumn, setSortColumn] = useState<string>("rank");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const setPageAiState = useSetPageAiState();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["leaderboard", category, timePeriod, orderBy, page],
    queryFn: async () => {
      return fetchLeaderboard(category, timePeriod, orderBy, page);
    },
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });

  const entries = data?.entries || [];
  const topThree = entries.slice(0, 3);
  const remaining = entries.slice(3);

  const sortedEntries = useMemo(() => {
    if (!sortColumn || sortColumn === "rank") return remaining;

    const sorted = [...remaining];
    sorted.sort((a, b) => {
      let aVal: any = (a as any)[sortColumn];
      let bVal: any = (b as any)[sortColumn];

      if (sortColumn === "userName") {
        aVal = aVal || a.proxyWallet;
        bVal = bVal || b.proxyWallet;
        return sortDirection === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
    });

    return sorted;
  }, [remaining, sortColumn, sortDirection]);

  const handleSort = (column: string) => {
    if (column === sortColumn) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  useEffect(() => {
    setPageAiState({
      kind: "leaderboard",
      state: {
        category,
        timePeriod,
        orderBy,
        sortColumn,
        sortDirection,
        topThree,
        tableRows: sortedEntries,
        lastUpdated: data?.lastUpdated ?? null,
      },
    });
  }, [
    setPageAiState,
    category,
    timePeriod,
    orderBy,
    sortColumn,
    sortDirection,
    topThree,
    sortedEntries,
    data?.lastUpdated,
  ]);

  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-200 font-mono">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Polymarket Leaderboard
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                Top traders ranked by profit & loss
              </p>
            </div>
            <Link
              href="/"
              className="px-4 py-2 rounded-md border border-slate-600 bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 transition-colors text-sm"
            >
              ← Back to Home
            </Link>
          </div>
        </header>

        <div className="mb-6 space-y-4">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
              Category
            </p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => {
                    setCategory(cat.value);
                    setPage(0);
                  }}
                  className={`px-3 py-1.5 rounded-md font-mono text-sm border transition-colors ${
                    category === cat.value
                      ? "bg-amber-500/20 text-amber-400 border-amber-500/50"
                      : "bg-slate-800/50 text-slate-400 border-slate-600 hover:border-slate-500"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
              Time Period
            </p>
            <div className="flex flex-wrap gap-2">
              {TIME_PERIODS.map((tp) => (
                <button
                  key={tp.value}
                  onClick={() => {
                    setTimePeriod(tp.value);
                    setPage(0);
                  }}
                  className={`px-3 py-1.5 rounded-md font-mono text-sm border transition-colors ${
                    timePeriod === tp.value
                      ? "bg-amber-500/20 text-amber-400 border-amber-500/50"
                      : "bg-slate-800/50 text-slate-400 border-slate-600 hover:border-slate-500"
                  }`}
                >
                  {tp.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
              Sort By
            </p>
            <div className="flex flex-wrap gap-2">
              {ORDER_BY.map((ob) => (
                <button
                  key={ob.value}
                  onClick={() => {
                    setOrderBy(ob.value);
                    setPage(0);
                  }}
                  className={`px-3 py-1.5 rounded-md font-mono text-sm border transition-colors ${
                    orderBy === ob.value
                      ? "bg-amber-500/20 text-amber-400 border-amber-500/50"
                      : "bg-slate-800/50 text-slate-400 border-slate-600 hover:border-slate-500"
                  }`}
                >
                  {ob.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="border border-slate-700/50 rounded-lg bg-slate-900/30 p-6 h-48 animate-pulse"
                />
              ))}
            </div>
            <TableSkeleton rows={10} cols={4} />
          </div>
        )}

        {isError && (
          <div className="text-center py-12 text-red-400">
            Error: {error instanceof Error ? error.message : "Failed to load leaderboard"}
          </div>
        )}

        {!isLoading && !isError && entries.length === 0 && (
          <div className="text-center py-12 text-slate-500 border border-slate-700/50 rounded-lg bg-slate-900/30">
            No traders found for the selected filters.
          </div>
        )}

        {!isLoading && !isError && entries.length > 0 && (
          <>
            {topThree.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-bold text-white mb-4">Top 3 Traders</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {topThree.map((entry) => (
                    <LeaderboardCard
                      key={entry.proxyWallet}
                      rank={entry.rank}
                      userName={entry.userName}
                      profileImage={entry.profileImage}
                      totalTrades={entry.totalTrades ?? null}
                      pnl={entry.pnl}
                      walletAddress={entry.proxyWallet}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="border border-slate-700/50 rounded-lg bg-slate-900/30 p-4">
              <h2 className="text-lg font-bold text-white mb-4">All Traders</h2>
              <LeaderboardTable
                entries={sortedEntries}
                onSort={handleSort}
                sortColumn={sortColumn}
                sortDirection={sortDirection}
              />

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-700/50">
                <button
                  type="button"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="px-4 py-2 rounded border border-slate-600 bg-slate-800 text-slate-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700"
                >
                  ← Previous
                </button>

                <span className="text-xs text-slate-500">
                  Page {page + 1}
                  {data?.pagination.hasMore && " of many"}
                </span>

                <button
                  type="button"
                  disabled={!data?.pagination.hasMore}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-4 py-2 rounded border border-slate-600 bg-slate-800 text-slate-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700"
                >
                  Next →
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
