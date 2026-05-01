"use client";

import { useMemo, useState } from "react";
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
      className={`flex items-center gap-1 text-[10px] font-medium uppercase tracking-widest transition-colors duration-150 ${
        isActive ? "text-[#4B4BF7]" : "text-white/30 hover:text-white/60"
      }`}
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
        const aRaw = (a as unknown as Record<string, unknown>)[sortKey];
        const bRaw = (b as unknown as Record<string, unknown>)[sortKey];
        aVal = typeof aRaw === "number" || typeof aRaw === "string" ? aRaw : 0;
        bVal = typeof bRaw === "number" || typeof bRaw === "string" ? bRaw : 0;
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
    <div className="min-h-screen bg-[#04040a] text-white">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <header className="mb-6">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-[#4B4BF7] rounded-full" />
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Polymarket Creators
            </h1>
          </div>
        </header>

        <section className="bg-[#0a0a0f] border border-white/10 rounded-2xl overflow-hidden flex flex-col min-h-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search creators..."
                className="w-72 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white/80 placeholder:text-white/25 focus:outline-none focus:border-[#4B4BF7]/50 transition-all duration-150"
              />
              <span className="text-xs text-white/30 font-mono">
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
                <thead className="sticky top-0 bg-[#0a0a0f] border-b border-[#4B4BF7]/20 z-10">
                  <tr>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-white/30 w-[260px]">
                      <SortHeader
                        label="Creator"
                        sortKey="name"
                        activeKey={sortKey}
                        direction={sortDirection}
                        onSortChange={handleSortChange}
                      />
                    </th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-white/30">
                      Wallet
                    </th>
                    <th className="px-6 py-4 text-right">
                      <SortHeader
                        label="Total Markets"
                        sortKey="totalMarkets"
                        activeKey={sortKey}
                        direction={sortDirection}
                        onSortChange={handleSortChange}
                      />
                    </th>
                    <th className="px-6 py-4 text-right">
                      <SortHeader
                        label="Active Markets"
                        sortKey="activeMarkets"
                        activeKey={sortKey}
                        direction={sortDirection}
                        onSortChange={handleSortChange}
                      />
                    </th>
                    <th className="px-6 py-4 text-right">
                      <SortHeader
                        label="Total Volume"
                        sortKey="totalVolume"
                        activeKey={sortKey}
                        direction={sortDirection}
                        onSortChange={handleSortChange}
                      />
                    </th>
                    <th className="px-6 py-4 text-right">
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
                      className="border-b border-white/5 border-l-2 border-l-transparent hover:bg-white/5 hover:border-l-[#4B4BF7] transition-all duration-150 cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-sm text-white/40 overflow-hidden ring-1 ring-white/10">
                            {creator.image ? (
                              // We intentionally avoid guessing anything if image is missing; we just fall back to initials.
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={creator.image}
                                alt={creator.name}
                                className="w-9 h-9 object-cover rounded-full"
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
                                  className="text-sm font-medium text-white/80 hover:text-[#4B4BF7] truncate transition-colors duration-150"
                                >
                                  {creator.name}
                                </a>
                              ) : (
                                <span className="text-sm font-medium text-white/80 truncate">
                                  {creator.name}
                                </span>
                              )}
                            </div>
                            {creator.handle && (
                              <div className="text-xs text-white/30 truncate">
                                @{creator.handle}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
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
                            className="text-xs font-mono text-white/40 hover:text-[#4B4BF7] transition-colors duration-150 cursor-pointer"
                            title={`Click to copy full address: ${creator.walletAddress}`}
                          >
                            {`${creator.walletAddress.slice(0, 6)}...${creator.walletAddress.slice(-4)}`}
                          </button>
                        ) : (
                          <span className="text-xs font-mono text-white/25">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-white/60">
                        {creator.totalMarkets.toLocaleString("en-US")}
                      </td>
                      <td className="px-6 py-4 text-sm font-mono">
                        <span className={creator.activeMarkets > 0 ? "text-[#4ade80]" : "text-white/25"}>
                          {creator.activeMarkets.toLocaleString("en-US")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-white/80">
                        {formatCurrency(creator.totalVolume)}
                      </td>
                      <td className="px-6 py-4 text-sm font-mono">
                        <span className={creator.openInterest > 0 ? "text-[#4ade80]" : "text-white/25"}>
                          {formatCurrency(creator.openInterest)}
                        </span>
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

