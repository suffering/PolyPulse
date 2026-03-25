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
      const aVal: string | number | undefined = (a as unknown as Record<string, unknown>)[sortColumn] as string | number | undefined;
      const bVal: string | number | undefined = (b as unknown as Record<string, unknown>)[sortColumn] as string | number | undefined;

      if (sortColumn === "userName") {
        const aStr = String(aVal || a.proxyWallet || "");
        const bStr = String(bVal || b.proxyWallet || "");
        return sortDirection === "asc"
          ? aStr.localeCompare(bStr)
          : bStr.localeCompare(aStr);
      }

      const aNum =
        typeof aVal === "number"
          ? aVal
          : typeof aVal === "string"
            ? parseFloat(aVal) || 0
            : 0;
      const bNum =
        typeof bVal === "number"
          ? bVal
          : typeof bVal === "string"
            ? parseFloat(bVal) || 0
            : 0;
      return sortDirection === "asc" ? aNum - bNum : bNum - aNum;
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
    <div className="min-h-screen bg-[#04040a] text-white">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Polymarket Leaderboard
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-pulse inline-block" />
                <span className="text-xs text-white/40">Live · updated every 60s</span>
              </div>
              <p className="text-sm text-white/40 mt-1">
                Top traders ranked by profit &amp; loss
              </p>
            </div>
            <Link
              href="/"
              className="text-sm bg-white/5 border border-white/10 text-white/60 px-4 py-2 rounded-xl hover:border-[#4B4BF7]/50 hover:text-white transition-all duration-150"
            >
              ← Back to Home
            </Link>
          </div>
        </header>

        <div className="mb-8 space-y-5">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Category</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => { setCategory(cat.value); setPage(0); }}
                  className={`px-4 py-1.5 rounded-full text-xs border transition-all duration-150 cursor-pointer ${
                    category === cat.value
                      ? "text-[#4B4BF7] border-[#4B4BF7] bg-[#4B4BF7]/10 shadow-[0_0_12px_rgba(75,75,247,0.2)]"
                      : "text-white/50 border-white/10 bg-transparent hover:border-white/30 hover:text-white/80"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Time Period</p>
            <div className="flex flex-wrap gap-2">
              {TIME_PERIODS.map((tp) => (
                <button
                  key={tp.value}
                  onClick={() => { setTimePeriod(tp.value); setPage(0); }}
                  className={`px-4 py-1.5 rounded-full text-xs border transition-all duration-150 cursor-pointer ${
                    timePeriod === tp.value
                      ? "text-[#4B4BF7] border-[#4B4BF7] bg-[#4B4BF7]/10 shadow-[0_0_12px_rgba(75,75,247,0.2)]"
                      : "text-white/50 border-white/10 bg-transparent hover:border-white/30 hover:text-white/80"
                  }`}
                >
                  {tp.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Sort By</p>
            <div className="flex flex-wrap gap-2">
              {ORDER_BY.map((ob) => (
                <button
                  key={ob.value}
                  onClick={() => { setOrderBy(ob.value); setPage(0); }}
                  className={`px-4 py-1.5 rounded-full text-xs border transition-all duration-150 cursor-pointer ${
                    orderBy === ob.value
                      ? "text-[#4B4BF7] border-[#4B4BF7] bg-[#4B4BF7]/10 shadow-[0_0_12px_rgba(75,75,247,0.2)]"
                      : "text-white/50 border-white/10 bg-transparent hover:border-white/30 hover:text-white/80"
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
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border border-white/10 rounded-2xl bg-[#0f0f14] p-6 h-48 animate-pulse" />
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
          <div className="text-center py-12 text-white/30 border border-white/10 rounded-2xl bg-[#0f0f14]">
            No traders found for the selected filters.
          </div>
        )}

        {!isLoading && !isError && entries.length > 0 && (
          <>
            {topThree.length > 0 && (
              <div className="mb-10">
                <p className="text-[10px] uppercase tracking-widest text-white/30 mb-5">Top 3 Traders</p>
                <div className="grid grid-cols-3 gap-4">
                  {/* Podium order: #2, #1, #3 */}
                  {[topThree[1], topThree[0], topThree[2]].filter(Boolean).map((entry) => (
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

            <div className="bg-[#0a0a0f] border border-white/10 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#4B4BF7]/20">
                <p className="text-[10px] uppercase tracking-widest text-white/30">All Traders</p>
              </div>
              <LeaderboardTable
                entries={sortedEntries}
                onSort={handleSort}
                sortColumn={sortColumn}
                sortDirection={sortDirection}
              />

              <div className="flex items-center justify-between px-5 py-4 border-t border-white/5">
                <button
                  type="button"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-white/60 text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#4B4BF7]/50 hover:text-white transition-all duration-150"
                >
                  ← Previous
                </button>
                <span className="text-xs text-white/30 font-mono">
                  Page {page + 1}{data?.pagination.hasMore && " of many"}
                </span>
                <button
                  type="button"
                  disabled={!data?.pagination.hasMore}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-white/60 text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#4B4BF7]/50 hover:text-white transition-all duration-150"
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
