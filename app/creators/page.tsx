"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import type { CreatorStats } from "@/lib/polymarket";
import { TableSkeleton } from "@/components/ui/Skeleton";

type CreatorsResponse = {
  creators: CreatorStats[];
  lastUpdated: string;
  walletCoverage?: { resolved: number; total: number };
};

type SortKey =
  | "name"
  | "totalMarkets"
  | "activeMarkets"
  | "totalVolume"
  | "openInterest";
type SortDirection = "asc" | "desc";

async function fetchCreators(): Promise<CreatorsResponse> {
  const res = await fetch("/api/creators");
  if (!res.ok) {
    throw new Error("Failed to fetch creators");
  }
  return res.json();
}

function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) return "$0.0";
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

function SortHeader({
  label,
  sortKey,
  activeKey,
  direction,
  onSortChange,
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  direction: SortDirection;
  onSortChange: (key: SortKey) => void;
}) {
  const isActive = sortKey === activeKey;
  const arrow = !isActive ? "↕" : direction === "asc" ? "↑" : "↓";

  return (
    <button
      type="button"
      onClick={() => onSortChange(sortKey)}
      className="flex items-center gap-1 text-xs font-medium text-slate-400 uppercase tracking-wider hover:text-slate-200"
    >
      <span>{label}</span>
      <span className="text-[10px]">{arrow}</span>
    </button>
  );
}

export default function CreatorsPage() {
  const { data, isLoading, isError, error } = useQuery<CreatorsResponse>({
    queryKey: ["creators"],
    queryFn: fetchCreators,
    refetchInterval: (query) => {
      const d = query.state.data;
      if (d?.walletCoverage && d.walletCoverage.resolved < d.walletCoverage.total) {
        return 5_000;
      }
      return 5 * 60 * 1000;
    },
    staleTime: 2 * 60 * 1000,
  });

  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("totalVolume");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const creators: CreatorStats[] = data?.creators ?? [];

  const filteredAndSorted = useMemo(() => {
    const term = search.trim().toLowerCase();

    let rows = creators;
    if (term) {
      rows = rows.filter((creator) => {
        const name = creator.name.toLowerCase();
        const handle = creator.handle?.toLowerCase() ?? "";
        return name.includes(term) || handle.includes(term);
      });
    }

    const sorted = [...rows];
    sorted.sort((a, b) => {
      let aVal: string | number = "";
      let bVal: string | number = "";

      if (sortKey === "name") {
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
      } else {
        aVal = (a as Record<string, unknown>)[sortKey] ?? 0;
        bVal = (b as Record<string, unknown>)[sortKey] ?? 0;
      }

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      const aNum = typeof aVal === "number" ? aVal : 0;
      const bNum = typeof bVal === "number" ? bVal : 0;
      return sortDirection === "asc" ? aNum - bNum : bNum - aNum;
    });

    return sorted;
  }, [creators, search, sortKey, sortDirection]);

  const handleSortChange = (key: SortKey) => {
    if (key === sortKey) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection(key === "name" ? "asc" : "desc");
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-200 font-mono">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Polymarket Creators
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                Creator-level market statistics from the Polymarket Gamma API
              </p>
              {/* NOTE: Creator-level stats are aggregated from event + market data; 
                  Gamma does not expose creator-specific volume or open interest directly. */}
            </div>
            <Link
              href="/"
              className="px-4 py-2 rounded-md border border-slate-600 bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 transition-colors text-sm"
            >
              ← Back to EV Engine
            </Link>
          </div>
          {data?.lastUpdated && (
            <p className="text-xs text-slate-500">
              Last updated: {new Date(data.lastUpdated).toLocaleString()}
            </p>
          )}
          <p className="text-[10px] text-slate-600 mt-1">
            Wallet addresses are fetched via profile search API (best-effort; may be missing for some creators).
            Click wallet address to copy full address.
          </p>
        </header>

        <section className="border border-slate-700/50 rounded-lg bg-slate-900/30 p-4 flex flex-col min-h-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search creators..."
                className="w-56 bg-slate-900/60 border border-slate-700/70 rounded-md px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500/70 focus:border-amber-500/70"
              />
              <span className="text-[10px] text-slate-500">
                {filteredAndSorted.length} creators
              </span>
            </div>
          </div>

          {isLoading && <TableSkeleton rows={10} cols={6} />}

          {isError && (
            <div className="py-10 text-center text-red-400 text-sm">
              Error: {error instanceof Error ? error.message : "Failed to load creators"}
            </div>
          )}

          {!isLoading && !isError && filteredAndSorted.length === 0 && (
            <div className="py-10 text-center text-slate-500 text-sm">
              No creators found.
            </div>
          )}

          {!isLoading && !isError && filteredAndSorted.length > 0 && (
            <div className="overflow-y-auto overflow-x-auto max-h-[60vh] min-h-0">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead className="sticky top-0 bg-slate-900/80 border-b border-slate-700/60 z-10">
                  <tr>
                    <th className="px-3 py-2 text-xs font-medium text-slate-400 uppercase tracking-wider w-[260px]">
                      <SortHeader
                        label="Creator"
                        sortKey="name"
                        activeKey={sortKey}
                        direction={sortDirection}
                        onSortChange={handleSortChange}
                      />
                    </th>
                    <th className="px-3 py-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Wallet
                    </th>
                    <th className="px-3 py-2 text-right">
                      <SortHeader
                        label="Total Markets"
                        sortKey="totalMarkets"
                        activeKey={sortKey}
                        direction={sortDirection}
                        onSortChange={handleSortChange}
                      />
                    </th>
                    <th className="px-3 py-2 text-right">
                      <SortHeader
                        label="Active Markets"
                        sortKey="activeMarkets"
                        activeKey={sortKey}
                        direction={sortDirection}
                        onSortChange={handleSortChange}
                      />
                    </th>
                    <th className="px-3 py-2 text-right">
                      <SortHeader
                        label="Total Volume"
                        sortKey="totalVolume"
                        activeKey={sortKey}
                        direction={sortDirection}
                        onSortChange={handleSortChange}
                      />
                    </th>
                    <th className="px-3 py-2 text-right">
                      <SortHeader
                        label="Open Interest"
                        sortKey="openInterest"
                        activeKey={sortKey}
                        direction={sortDirection}
                        onSortChange={handleSortChange}
                      />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSorted.map((creator) => (
                    <tr
                      key={creator.id}
                      className="border-b border-slate-800/70 transition-colors"
                    >
                      <td className="px-3 py-2 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-slate-800/80 border border-slate-700/70 flex items-center justify-center text-[10px] text-slate-300 overflow-hidden">
                            {creator.image ? (
                              // We intentionally avoid guessing anything if image is missing; we just fall back to initials.
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={creator.image}
                                alt={creator.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span>
                                {creator.name
                                  .split(" ")
                                  .map((part) => part[0])
                                  .join("")
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1">
                              {creator.url ? (
                                <a
                                  href={creator.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[11px] font-semibold text-slate-100 hover:text-amber-400 truncate"
                                >
                                  {creator.name}
                                </a>
                              ) : (
                                <span className="text-[11px] font-semibold text-slate-100 truncate">
                                  {creator.name}
                                </span>
                              )}
                            </div>
                            {creator.handle && (
                              <div className="text-[10px] text-slate-500 truncate">
                                @{creator.handle}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-xs">
                        {creator.walletAddress ? (
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(creator.walletAddress!);
                              } catch {
                                // Fallback for older browsers
                                const textArea = document.createElement("textarea");
                                textArea.value = creator.walletAddress!;
                                document.body.appendChild(textArea);
                                textArea.select();
                                document.execCommand("copy");
                                document.body.removeChild(textArea);
                              }
                            }}
                            className="text-slate-300 hover:text-amber-400 font-mono transition-colors cursor-pointer"
                            title={`Click to copy full address: ${creator.walletAddress}`}
                          >
                            {`${creator.walletAddress.slice(0, 6)}...${creator.walletAddress.slice(-4)}`}
                          </button>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs text-right text-slate-100">
                        {creator.totalMarkets.toLocaleString("en-US")}
                      </td>
                      <td className="px-3 py-2 text-xs text-right text-slate-100">
                        {creator.activeMarkets.toLocaleString("en-US")}
                      </td>
                      <td className="px-3 py-2 text-xs text-right text-emerald-400">
                        {formatCurrency(creator.totalVolume)}
                      </td>
                      <td className="px-3 py-2 text-xs text-right text-sky-400">
                        {formatCurrency(creator.openInterest)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

