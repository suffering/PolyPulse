"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import type { CreatorStats, CreatorMarketRow, UserPosition, PnLDataPoint } from "@/lib/polymarket";
import { ProfileHeaderSkeleton, StatCardsSkeleton, ChartSkeleton, TableSkeleton } from "@/components/ui/Skeleton";

type CreatorResponse = { creator: CreatorStats };
type TraderStatsResponse = {
  marketVolume: number;
  totalMarkets: number;
  activeMarkets: number;
  openInterest: number;
  tradingVolume: number;
  portfolioValue: number;
  marketsTraded: number;
};
type PnLHistoryResponse = { data: PnLDataPoint[] };
type MarketsResponse = {
  markets: CreatorMarketRow[];
  pagination: { limit: number; offset: number; page: number; total: number; hasMore: boolean };
};
type PositionsResponse = {
  positions: UserPosition[];
  closedPositions?: UserPosition[];
  pagination: { limit: number; offset: number; page: number; total: number };
};

type TimeRange = "1M" | "1Y" | "YTD" | "Max";

function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) return "$0.00";
  if (Math.abs(value) >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

function truncateWallet(wallet: string): string {
  if (!wallet || wallet.length < 10) return wallet;
  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
}

function marketUrl(row: CreatorMarketRow): string {
  const base = row.eventSlug
    ? `https://polymarket.com/event/${row.eventSlug}`
    : `https://polymarket.com/event/${row.eventId}`;
  return `${base}?market=${row.id}`;
}

function PnLCell({ value, maxAbs = 1 }: { value: number; maxAbs?: number }) {
  const isPos = value >= 0;
  const pct = maxAbs > 0 ? Math.min(Math.abs(value) / maxAbs, 1) : 0;
  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <div
        className="h-1.5 flex-1 min-w-[40px] max-w-[80px] rounded bg-slate-700 overflow-hidden"
        title={formatCurrency(value)}
      >
        <div
          className={`h-full ${isPos ? "bg-emerald-500" : "bg-red-500"}`}
          style={{ width: `${pct * 100}%` }}
        />
      </div>
      <span className={isPos ? "text-emerald-400" : "text-red-400"}>
        {formatCurrency(value)}
      </span>
    </div>
  );
}

function StatCard({ label, value, valueColor = "text-slate-200", isCurrency = true }: { label: string; value: string | number | null; valueColor?: string; isCurrency?: boolean }) {
  const display = value === null
    ? "..."
    : typeof value === "number"
      ? isCurrency ? formatCurrency(value) : value.toLocaleString()
      : value;

  return (
    <div className="border border-slate-700/50 rounded-lg bg-slate-900/30 p-4">
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <div className={`text-lg font-bold ${valueColor}`}>{display}</div>
    </div>
  );
}

export default function CreatorProfilePage() {
  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : "";

  const [activeTab, setActiveTab] = useState<"markets" | "positions">("markets");
  const [marketsPage, setMarketsPage] = useState(1);
  const [marketsRowsPerPage, setMarketsRowsPerPage] = useState(25);
  const [positionsPage, setPositionsPage] = useState(1);
  const [positionsRowsPerPage, setPositionsRowsPerPage] = useState(25);
  const [marketsSort, setMarketsSort] = useState<{
    key: keyof CreatorMarketRow | "volume" | "openInterest";
    dir: "asc" | "desc";
  }>({ key: "volume", dir: "desc" });
  const [timeRange, setTimeRange] = useState<TimeRange>("Max");

  const { data: creatorData, isLoading: creatorLoading, isError: creatorError, error: creatorErr } = useQuery({
    queryKey: ["creator", slug],
    queryFn: async (): Promise<CreatorResponse> => {
      const res = await fetch(`/api/creators/${encodeURIComponent(slug)}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to load creator");
      }
      return res.json();
    },
    enabled: !!slug,
    staleTime: 60 * 1000,
  });

  const creator = creatorData?.creator;

  const { data: traderStats, isLoading: traderStatsLoading } = useQuery<TraderStatsResponse>({
    queryKey: ["trader-stats", slug],
    queryFn: async () => {
      const res = await fetch(`/api/creators/${encodeURIComponent(slug)}/trader-stats`);
      if (!res.ok) throw new Error("Failed to load trader stats");
      return res.json();
    },
    enabled: !!slug,
    staleTime: 60 * 1000,
  });

  const { data: pnlHistory, isLoading: pnlLoading } = useQuery<PnLHistoryResponse>({
    queryKey: ["pnl-history", slug, timeRange],
    queryFn: async () => {
      const now = Math.floor(Date.now() / 1000);
      let startTime: number | undefined;
      if (timeRange === "1M") startTime = now - 30 * 24 * 60 * 60;
      else if (timeRange === "1Y") startTime = now - 365 * 24 * 60 * 60;
      else if (timeRange === "YTD") startTime = Math.floor(new Date(new Date().getFullYear(), 0, 1).getTime() / 1000);
      const params = new URLSearchParams();
      if (startTime) params.set("startTime", String(startTime));
      const res = await fetch(`/api/creators/${encodeURIComponent(slug)}/pnl-history?${params}`);
      if (!res.ok) throw new Error("Failed to load P&L history");
      return res.json();
    },
    enabled: !!slug,
    staleTime: 60 * 1000,
  });

  const { data: marketsData, isLoading: marketsLoading } = useQuery({
    queryKey: ["creator-markets", slug, marketsPage, marketsRowsPerPage],
    queryFn: async (): Promise<MarketsResponse> => {
      const res = await fetch(
        `/api/creators/${encodeURIComponent(slug)}/markets?page=${marketsPage}&limit=${marketsRowsPerPage}`
      );
      if (!res.ok) throw new Error("Failed to load markets");
      return res.json();
    },
    enabled: !!slug,
    staleTime: 60 * 1000,
  });

  const { data: positionsData, isLoading: positionsLoading } = useQuery({
    queryKey: ["creator-positions", slug, positionsPage, positionsRowsPerPage],
    queryFn: async (): Promise<PositionsResponse> => {
      const res = await fetch(
        `/api/creators/${encodeURIComponent(slug)}/positions?page=${positionsPage}&limit=${positionsRowsPerPage}`
      );
      if (!res.ok) throw new Error("Failed to load positions");
      return res.json();
    },
    enabled: !!slug,
    staleTime: 30 * 1000,
  });

  const markets = marketsData?.markets ?? [];
  const marketsPagination = marketsData?.pagination;
  const positions = positionsData?.positions ?? [];
  const closedPositions = positionsData?.closedPositions ?? [];
  const positionsPagination = positionsData?.pagination;
  /** Combined list: open first, then closed (creator's own positions). */
  const allPositionsRows: UserPosition[] = [...positions, ...closedPositions];

  const sortedMarkets = useMemo(() => {
    const key = marketsSort.key;
    const dir = marketsSort.dir;
    const arr = [...markets];
    arr.sort((a, b) => {
      let aVal: string | number | boolean = "";
      let bVal: string | number | boolean = "";
      if (key === "volume") {
        aVal = a.volume;
        bVal = b.volume;
      } else if (key === "openInterest") {
        aVal = a.openInterest;
        bVal = b.openInterest;
      } else {
        const aRaw = (a as Record<string, unknown>)[key];
        const bRaw = (b as Record<string, unknown>)[key];
        aVal = typeof aRaw === "string" || typeof aRaw === "number" || typeof aRaw === "boolean" ? aRaw : "";
        bVal = typeof bRaw === "string" || typeof bRaw === "number" || typeof bRaw === "boolean" ? bRaw : "";
      }
      if (typeof aVal === "number" && typeof bVal === "number")
        return dir === "asc" ? aVal - bVal : bVal - aVal;
      if (typeof aVal === "string" && typeof bVal === "string")
        return dir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      if (typeof aVal === "boolean" && typeof bVal === "boolean")
        return dir === "asc" ? (aVal === bVal ? 0 : aVal ? 1 : -1) : (aVal === bVal ? 0 : bVal ? 1 : -1);
      return 0;
    });
    return arr;
  }, [markets, marketsSort]);

  const maxAbsPnl = useMemo(() => {
    if (allPositionsRows.length === 0) return 1;
    return Math.max(
      ...allPositionsRows.map((p) =>
        Math.abs(p.closed ? p.realizedPnl : p.cashPnl + p.realizedPnl)
      ),
      1
    );
  }, [allPositionsRows]);

  const chartData = useMemo(() => {
    if (!pnlHistory?.data || pnlHistory.data.length === 0) return [];
    return pnlHistory.data.map((point) => ({
      date: new Date(point.timestamp * 1000).toLocaleDateString(),
      timestamp: point.timestamp,
      pnl: point.cumulativePnl,
    }));
  }, [pnlHistory]);

  const currentPnl = useMemo(() => {
    if (!chartData || chartData.length === 0) return 0;
    return chartData[chartData.length - 1]?.pnl || 0;
  }, [chartData]);

  if (!slug) {
    return (
      <div className="min-h-screen bg-[#0d1117] text-slate-200 font-mono flex items-center justify-center">
        <p className="text-slate-500">Missing creator slug.</p>
      </div>
    );
  }

  const totalPagesMarkets =
    marketsPagination && marketsPagination.limit > 0
      ? Math.max(1, Math.ceil(marketsPagination.total / marketsPagination.limit))
      : 1;
  const totalPagesPositions =
    positionsPagination && positionsPagination.limit > 0
      ? Math.max(1, Math.ceil(positionsPagination.total / positionsPagination.limit))
      : 1;

  const polymarketProfileUrl = creator?.walletAddress
    ? `https://polymarket.com/profile/${creator.walletAddress}`
    : creator?.url || "#";

  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-200 font-mono">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href="/creators"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-slate-600 bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 transition-colors text-sm"
          >
            ← Back to Creators
          </Link>
        </div>

        {/* Profile Header — skeleton until creator loads */}
        {creatorError ? (
          <div className="border border-slate-700/50 rounded-lg bg-slate-900/30 p-6 mb-6 text-center">
            <p className="text-red-400">{creatorErr instanceof Error ? creatorErr.message : "Failed to load creator"}</p>
          </div>
        ) : creator ? (
          <header className="border border-slate-700/50 rounded-lg bg-slate-900/30 p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <div className="flex-shrink-0">
                <div className="h-24 w-24 rounded-full bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center text-2xl text-slate-400">
                  {creator.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={creator.image} alt={creator.name} className="h-full w-full object-cover" />
                  ) : (
                    <span>
                      {creator.name
                        .split(" ")
                        .map((p) => p[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-bold text-white tracking-tight mb-1">{creator.name}</h1>
                {creator.walletAddress && (
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm text-slate-400 font-mono">
                      {truncateWallet(creator.walletAddress)}
                    </span>
                  </div>
                )}
                {creator.handle && (
                  <a
                    href={`https://x.com/${creator.handle.replace(/^@/, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-slate-400 hover:text-amber-400 mb-4 block"
                  >
                    @{creator.handle.replace(/^@/, "")}
                  </a>
                )}
                <a
                  href={polymarketProfileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center px-4 py-2 rounded-md bg-amber-500/20 border border-amber-500/50 text-amber-400 hover:bg-amber-500/30 transition-colors text-sm font-medium"
                >
                  View Profile
                </a>
              </div>
            </div>
          </header>
        ) : (
          <ProfileHeaderSkeleton />
        )}

        {/* Stat Cards — skeleton until trader-stats loads */}
        {traderStatsLoading && !traderStats ? (
          <StatCardsSkeleton />
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              <StatCard
                label="Market Volume"
                value={traderStats?.marketVolume ?? creator?.totalVolume ?? 0}
                valueColor="text-emerald-400"
              />
              <StatCard
                label="Total Markets"
                value={traderStats?.totalMarkets ?? creator?.totalMarkets ?? 0}
                isCurrency={false}
                valueColor="text-sky-400"
              />
              <StatCard
                label="Open Interest"
                value={traderStats?.openInterest ?? creator?.openInterest ?? 0}
                valueColor="text-amber-400"
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <StatCard
                label="Trading Volume"
                value={traderStats?.tradingVolume ?? 0}
                valueColor="text-emerald-400"
              />
              <StatCard
                label="Portfolio Size"
                value={traderStats?.portfolioValue ?? 0}
                valueColor="text-sky-400"
              />
              <StatCard
                label="Markets Traded"
                value={traderStats?.marketsTraded ?? 0}
                isCurrency={false}
                valueColor="text-amber-400"
              />
            </div>
          </>
        )}

        {/* P&L Chart — skeleton until pnl loads */}
        {pnlLoading && !pnlHistory ? (
          <ChartSkeleton />
        ) : (
        <div className="border border-slate-700/50 rounded-lg bg-slate-900/30 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs text-slate-400 mb-1">Total P&L</div>
              <div className={`text-3xl font-bold ${currentPnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {formatCurrency(currentPnl)}
              </div>
            </div>
            <div className="flex gap-2">
              {(["1M", "1Y", "YTD", "Max"] as TimeRange[]).map((range) => (
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
          {chartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-500">
              No P&L data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={currentPnl >= 0 ? "#10b981" : "#ef4444"} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={currentPnl >= 0 ? "#10b981" : "#ef4444"} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  axisLine={{ stroke: "#475569" }}
                  tickLine={{ stroke: "#475569" }}
                />
                <YAxis
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  axisLine={{ stroke: "#475569" }}
                  tickLine={{ stroke: "#475569" }}
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #475569",
                    borderRadius: "6px",
                    color: "#e2e8f0",
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Area
                  type="monotone"
                  dataKey="pnl"
                  stroke={currentPnl >= 0 ? "#10b981" : "#ef4444"}
                  strokeWidth={2}
                  fill="url(#pnlGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
        )}

        {/* Markets/Positions Tabs */}
        <div className="border border-slate-700/50 rounded-lg bg-slate-900/30 overflow-hidden">
          <div className="flex border-b border-slate-700/60">
            <button
              type="button"
              onClick={() => setActiveTab("markets")}
              className={`px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === "markets"
                  ? "text-amber-400 border-b-2 border-amber-500 bg-slate-800/50"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Markets
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("positions")}
              className={`px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === "positions"
                  ? "text-amber-400 border-b-2 border-amber-500 bg-slate-800/50"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Positions
            </button>
          </div>

          <div className="p-4">
            {activeTab === "markets" && (
              <>
                {marketsLoading ? (
                  <TableSkeleton rows={5} cols={7} />
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead className="border-b border-slate-700/60">
                          <tr>
                            <th className="px-3 py-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
                              Title
                            </th>
                            <th className="px-3 py-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
                              Start
                            </th>
                            <th className="px-3 py-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
                              End
                            </th>
                            <th className="px-3 py-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                              <button
                                type="button"
                                onClick={() =>
                                  setMarketsSort((s) =>
                                    s.key === "volume" ? { key: "volume", dir: s.dir === "asc" ? "desc" : "asc" } : { key: "volume", dir: "desc" }
                                  )
                                }
                                className="hover:text-slate-200"
                              >
                                Volume {marketsSort.key === "volume" ? (marketsSort.dir === "asc" ? "↑" : "↓") : "↕"}
                              </button>
                            </th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                              <button
                                type="button"
                                onClick={() =>
                                  setMarketsSort((s) =>
                                    s.key === "openInterest"
                                      ? { key: "openInterest", dir: s.dir === "asc" ? "desc" : "asc" }
                                      : { key: "openInterest", dir: "desc" }
                                  )
                                }
                                className="hover:text-slate-200"
                              >
                                Open Interest {marketsSort.key === "openInterest" ? (marketsSort.dir === "asc" ? "↑" : "↓") : "↕"}
                              </button>
                            </th>
                            <th className="px-3 py-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
                              Tags
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedMarkets.map((row) => (
                            <tr key={row.id} className="border-b border-slate-800/70 hover:bg-slate-800/30">
                              <td className="px-3 py-2 text-xs">
                                <a
                                  href={marketUrl(row)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-2 text-slate-100 hover:text-amber-400"
                                >
                                  {row.image && (
                                    <span className="h-6 w-6 rounded-full overflow-hidden flex-shrink-0 bg-slate-800">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img src={row.image} alt="" className="h-full w-full object-cover" />
                                    </span>
                                  )}
                                  <span className="truncate max-w-[220px]">{row.title}</span>
                                </a>
                              </td>
                              <td className="px-3 py-2 text-xs text-slate-400">{formatDate(row.startDate)}</td>
                              <td className="px-3 py-2 text-xs text-slate-400">{formatDate(row.endDate)}</td>
                              <td className="px-3 py-2">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${
                                    row.closed ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400"
                                  }`}
                                >
                                  {row.closed ? "Closed" : "Active"}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-xs text-right text-emerald-400">
                                {formatCurrency(row.volume)}
                              </td>
                              <td className="px-3 py-2 text-xs text-right text-sky-400">
                                {formatCurrency(row.openInterest)}
                              </td>
                              <td className="px-3 py-2 text-xs">
                                {row.tags.length === 0 ? (
                                  "—"
                                ) : (
                                  <span className="flex items-center gap-1 flex-wrap">
                                    <span className="px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 text-[10px]">
                                      {row.tags[0].label}
                                    </span>
                                    {row.tags.length > 1 && (
                                      <span className="text-slate-500 text-[10px]">+{row.tags.length - 1}</span>
                                    )}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {marketsPagination && (
                      <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-700/50">
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-slate-500">Rows per page</label>
                          <select
                            value={marketsRowsPerPage}
                            onChange={(e) => {
                              setMarketsRowsPerPage(Number(e.target.value));
                              setMarketsPage(1);
                            }}
                            className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200"
                          >
                            {[10, 25, 50, 100].map((n) => (
                              <option key={n} value={n}>
                                {n}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="text-xs text-slate-500">
                          Page {marketsPagination.page} of {totalPagesMarkets}
                        </div>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            disabled={marketsPagination.page <= 1}
                            onClick={() => setMarketsPage((p) => Math.max(1, p - 1))}
                            className="px-2 py-1 rounded border border-slate-600 bg-slate-800 text-slate-300 text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700"
                          >
                            Previous
                          </button>
                          <button
                            type="button"
                            disabled={marketsPagination.page >= totalPagesMarkets}
                            onClick={() => setMarketsPage((p) => p + 1)}
                            className="px-2 py-1 rounded border border-slate-600 bg-slate-800 text-slate-300 text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {activeTab === "positions" && (
              <>
                {positionsLoading ? (
                  <TableSkeleton rows={5} cols={7} />
                ) : !creator?.walletAddress ? (
                  <div className="py-12 text-center text-slate-500 border border-slate-700/50 rounded-lg bg-slate-900/30">
                    Wallet not linked — positions are shown for the creator&apos;s wallet when available.
                  </div>
                ) : allPositionsRows.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 border border-slate-700/50 rounded-lg bg-slate-900/30">
                    No positions.
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead className="border-b border-slate-700/60">
                          <tr>
                            <th className="px-3 py-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
                              Market
                            </th>
                            <th className="px-3 py-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
                              Side
                            </th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                              Size
                            </th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                              Entry price
                            </th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                              Current value
                            </th>
                            <th className="px-3 py-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
                              P&L
                            </th>
                            <th className="px-3 py-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {allPositionsRows.map((p) => {
                            const pnl = p.closed ? p.realizedPnl : p.cashPnl + p.realizedPnl;
                            const rowKey = p.closed
                              ? `${p.conditionId}-${p.asset}-${p.timestamp ?? 0}-closed`
                              : `${p.conditionId}-${p.asset}-open`;
                            return (
                              <tr key={rowKey} className="border-b border-slate-800/70 hover:bg-slate-800/30">
                                <td className="px-3 py-2 text-xs text-slate-300 max-w-[200px] truncate" title={p.title}>
                                  {p.title || "—"}
                                </td>
                                <td className="px-3 py-2 text-xs text-slate-300">{p.outcome || "—"}</td>
                                <td className="px-3 py-2 text-xs text-right text-slate-300">
                                  {p.size.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                </td>
                                <td className="px-3 py-2 text-xs text-right text-slate-300">
                                  {formatCurrency(p.avgPrice)}
                                </td>
                                <td className="px-3 py-2 text-xs text-right text-slate-300">
                                  {formatCurrency(p.currentValue)}
                                </td>
                                <td className="px-3 py-2">
                                  <PnLCell value={pnl} maxAbs={maxAbsPnl} />
                                </td>
                                <td className="px-3 py-2 text-xs text-slate-400">
                                  {p.closed ? "Closed" : "Open"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    {positionsPagination && positionsPagination.total > 0 && (
                      <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-700/50">
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-slate-500">Rows per page</label>
                          <select
                            value={positionsRowsPerPage}
                            onChange={(e) => {
                              setPositionsRowsPerPage(Number(e.target.value));
                              setPositionsPage(1);
                            }}
                            className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200"
                          >
                            {[10, 25, 50, 100].map((n) => (
                              <option key={n} value={n}>
                                {n}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="text-xs text-slate-500">
                          Page {positionsPagination.page} of {totalPagesPositions}
                        </div>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            disabled={positionsPagination.page <= 1}
                            onClick={() => setPositionsPage((p) => Math.max(1, p - 1))}
                            className="px-2 py-1 rounded border border-slate-600 bg-slate-800 text-slate-300 text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700"
                          >
                            Previous
                          </button>
                          <button
                            type="button"
                            disabled={positionsPagination.page >= totalPagesPositions}
                            onClick={() => setPositionsPage((p) => p + 1)}
                            className="px-2 py-1 rounded border border-slate-600 bg-slate-800 text-slate-300 text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
