"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown, ExternalLink } from "lucide-react";
import { TableSkeleton } from "@/components/ui/Skeleton";
import type { OpenPosition } from "@/lib/leaderboard";
import type { TradeItem } from "@/lib/portfolio";

const PLACEHOLDER_ICON =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="#0f172a"/><rect x="1" y="1" width="62" height="62" fill="none" stroke="#334155"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#64748b" font-family="Arial" font-size="11">PM</text></svg>`
  );

function toCentsLabel(price: number | undefined): string {
  if (!Number.isFinite(price)) return "0¢";
  return `${(price! * 100).toFixed(price! * 100 >= 10 ? 0 : 1)}¢`;
}

function formatCurrency(value: number | undefined): string {
  if (!Number.isFinite(value)) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value!);
}

function formatShares(value: number | undefined): string {
  if (!Number.isFinite(value)) return "0.0 shares";
  return `${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value!)} shares`;
}

function formatPercent(value: number | undefined): string {
  if (!Number.isFinite(value)) return "0.00%";
  return `${value! >= 0 ? "+" : ""}${value!.toFixed(2)}%`;
}

function relativeTimeLabel(timestamp: number | undefined): string {
  if (!Number.isFinite(timestamp)) return "—";
  const ms = timestamp! > 1e12 ? timestamp! : timestamp! * 1000;
  const diffSec = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay}d ago`;
}

function outcomeTone(outcome: string | undefined, outcomeIndex?: number, price?: number) {
  const text = (outcome || "").toLowerCase();
  if (text.includes("yes") || text.includes("over")) return "green";
  if (text.includes("no") || text.includes("under")) return "red";
  if (Number.isFinite(price)) {
    if ((price ?? 0) >= 0.999) return "green";
    if ((price ?? 0) <= 0.001) return "red";
  }
  if (outcomeIndex === 0) return "green";
  if (outcomeIndex === 1) return "red";
  return "green";
}

function badgeClass(tone: "green" | "red") {
  return tone === "green"
    ? "bg-emerald-500/20 text-emerald-300"
    : "bg-rose-500/20 text-rose-300";
}

interface SearchPositionsActivityPanelProps {
  positions: OpenPosition[];
  trades: TradeItem[];
  tradesHasMore: boolean;
  onLoadMoreTrades?: () => void;
  isPositionsLoading: boolean;
  isTradesLoading: boolean;
  isTradesLoadingMore?: boolean;
  isPositionsError: boolean;
  isTradesError: boolean;
  refetchPositions?: () => void;
  refetchTrades?: () => void;
}

export function SearchPositionsActivityPanel({
  positions,
  trades,
  tradesHasMore,
  onLoadMoreTrades,
  isPositionsLoading,
  isTradesLoading,
  isTradesLoadingMore,
  isPositionsError,
  isTradesError,
  refetchPositions,
  refetchTrades,
}: SearchPositionsActivityPanelProps) {
  const [topTab, setTopTab] = useState<"positions" | "activity">("positions");
  const [positionsTab, setPositionsTab] = useState<"active" | "closed">("active");
  const [query, setQuery] = useState("");
  const [valueSortDesc, setValueSortDesc] = useState(true);

  const positionRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = positions.filter((p) => {
      const isClosed = (p.curPrice ?? 0) <= 0 || Boolean(p.redeemable);
      if (positionsTab === "active" && isClosed) return false;
      if (positionsTab === "closed" && !isClosed) return false;
      if (!q) return true;
      return (
        (p.title || "").toLowerCase().includes(q) ||
        (p.outcome || "").toLowerCase().includes(q)
      );
    });

    filtered.sort((a, b) => {
      const va = a.currentValue ?? 0;
      const vb = b.currentValue ?? 0;
      return valueSortDesc ? vb - va : va - vb;
    });

    return filtered;
  }, [positions, positionsTab, query, valueSortDesc]);

  const activityRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return trades
      .filter((t) => {
        if (!q) return true;
        return (
          (String(t.title || "")).toLowerCase().includes(q) ||
          (String(t.outcome || "")).toLowerCase().includes(q)
        );
      })
      .sort((a, b) => (Number(b.timestamp) || 0) - (Number(a.timestamp) || 0));
  }, [trades, query]);

  const showPositionsLoading = isPositionsLoading && positions.length === 0;
  const showTradesLoading = isTradesLoading && trades.length === 0;

  return (
    <div className="border border-slate-700/50 rounded-lg bg-slate-900/30 p-4 md:p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <button
          type="button"
          onClick={() => setTopTab("positions")}
          className={`px-2 py-1 text-sm font-medium ${
            topTab === "positions" ? "text-white" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Positions
        </button>
        <button
          type="button"
          onClick={() => setTopTab("activity")}
          className={`px-2 py-1 text-sm font-medium ${
            topTab === "activity" ? "text-white" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Activity
        </button>
      </div>

      {topTab === "positions" && (
        <>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <div className="inline-flex rounded-md border border-slate-700/70 overflow-hidden">
              <button
                type="button"
                onClick={() => setPositionsTab("active")}
                className={`px-3 py-1.5 text-sm ${
                  positionsTab === "active"
                    ? "bg-slate-800 text-slate-100"
                    : "bg-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => setPositionsTab("closed")}
                className={`px-3 py-1.5 text-sm border-l border-slate-700/70 ${
                  positionsTab === "closed"
                    ? "bg-slate-800 text-slate-100"
                    : "bg-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                Closed
              </button>
            </div>

            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search positions"
              className="flex-1 min-w-[220px] rounded-md border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-500"
            />
            <button
              type="button"
              onClick={() => setValueSortDesc((prev) => !prev)}
              className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-sm text-slate-200"
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              Value
            </button>
          </div>

          {showPositionsLoading ? (
            <TableSkeleton rows={8} cols={5} />
          ) : isPositionsError ? (
            <div className="text-sm text-slate-400">
              Failed to load positions.
              {refetchPositions && (
                <button
                  type="button"
                  onClick={() => refetchPositions()}
                  className="ml-2 text-amber-400 hover:text-amber-300"
                >
                  Try again
                </button>
              )}
            </div>
          ) : positionRows.length === 0 ? (
            <div className="text-sm text-slate-500">No {positionsTab} positions.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] border-collapse">
                <thead className="border-b border-slate-700/60">
                  <tr>
                    <th className="px-2 py-2 text-left text-xs font-medium text-slate-400">MARKET</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-slate-400">AVG</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-slate-400">CURRENT</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-slate-400">VALUE</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-slate-400"></th>
                  </tr>
                </thead>
                <tbody>
                  {positionRows.map((p, idx) => {
                    const tone = outcomeTone(p.outcome, p.outcomeIndex, p.curPrice);
                    const marketHref = p.eventSlug
                      ? `https://polymarket.com/event/${p.eventSlug}`
                      : p.slug
                      ? `https://polymarket.com/event/${p.slug}`
                      : "#";
                    const amount = p.currentValue ?? 0;
                    const pnl = p.cashPnl ?? 0;
                    const pnlPct = p.percentPnl ?? ((p.initialValue ?? 0) > 0 ? (pnl / (p.initialValue ?? 1)) * 100 : 0);
                    return (
                      <tr key={`${p.conditionId}-${p.asset}-${idx}`} className="border-b border-slate-800/70">
                        <td className="px-2 py-3">
                          <div className="flex items-start gap-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={p.icon || PLACEHOLDER_ICON}
                              onError={(e) => {
                                e.currentTarget.src = PLACEHOLDER_ICON;
                              }}
                              alt={p.title || "Market"}
                              className="h-9 w-9 rounded object-cover border border-slate-700/70 shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-slate-100 truncate max-w-[520px]">
                                {p.title || "—"}
                              </div>
                              <div className="mt-0.5 text-xs text-slate-400 flex items-center gap-2">
                                <span className={`rounded px-1.5 py-0.5 ${badgeClass(tone as "green" | "red")}`}>
                                  {p.outcome || "Outcome"} {toCentsLabel(p.avgPrice)}
                                </span>
                                <span>{formatShares(p.size)}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-3 text-sm text-slate-200">{toCentsLabel(p.avgPrice)}</td>
                        <td className="px-2 py-3 text-sm text-slate-200">{toCentsLabel(p.curPrice)}</td>
                        <td className="px-2 py-3">
                          <div className="text-sm text-slate-100">{formatCurrency(amount)}</div>
                          <div
                            className={`text-xs mt-0.5 ${
                              pnl >= 0 ? "text-emerald-400" : "text-rose-400"
                            }`}
                          >
                            {formatCurrency(pnl)} ({formatPercent(pnlPct)})
                          </div>
                        </td>
                        <td className="px-2 py-3 text-right">
                          {marketHref !== "#" && (
                            <a
                              href={marketHref}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex h-7 w-7 items-center justify-center rounded border border-slate-700/70 text-slate-300 hover:text-slate-100"
                              aria-label="Open market"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {topTab === "activity" && (
        <>
          <div className="overflow-x-auto">
            {showTradesLoading ? (
              <TableSkeleton rows={8} cols={3} />
            ) : isTradesError ? (
              <div className="text-sm text-slate-400">
                Failed to load activity.
                {refetchTrades && (
                  <button
                    type="button"
                    onClick={() => refetchTrades()}
                    className="ml-2 text-amber-400 hover:text-amber-300"
                  >
                    Try again
                  </button>
                )}
              </div>
            ) : (
              <table className="w-full min-w-[980px] border-collapse">
                <thead className="border-b border-slate-700/60">
                  <tr>
                    <th className="px-2 py-2 text-left text-xs font-medium text-slate-400">TYPE</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-slate-400">MARKET</th>
                    <th className="px-2 py-2 text-right text-xs font-medium text-slate-400">AMOUNT <ArrowUpDown className="inline h-3 w-3" /></th>
                  </tr>
                </thead>
                <tbody>
                  {activityRows.map((t, idx) => {
                    const price = Number(t.price) || 0;
                    const size = Number(t.size) || 0;
                    const amount = price * size;
                    const tone = outcomeTone(String(t.outcome || ""), t.outcomeIndex, undefined);
                    const marketHref = t.eventSlug
                      ? `https://polymarket.com/event/${t.eventSlug}`
                      : t.slug
                      ? `https://polymarket.com/event/${t.slug}`
                      : "#";
                    return (
                      <tr key={`${t.transactionHash || `${t.timestamp}-${idx}`}`} className="border-b border-slate-800/70">
                        <td className="px-2 py-3 text-sm text-slate-200">{String(t.side || "").toLowerCase() === "sell" ? "Sell" : "Buy"}</td>
                        <td className="px-2 py-3">
                          <div className="flex items-start gap-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={String(t.icon || PLACEHOLDER_ICON)}
                              onError={(e) => {
                                e.currentTarget.src = PLACEHOLDER_ICON;
                              }}
                              alt={String(t.title || "Market")}
                              className="h-9 w-9 rounded object-cover border border-slate-700/70 shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-slate-100 truncate max-w-[520px]">
                                {t.title || "—"}
                              </div>
                              <div className="mt-0.5 text-xs text-slate-400 flex items-center gap-2">
                                <span className={`rounded px-1.5 py-0.5 ${badgeClass(tone as "green" | "red")}`}>
                                  {String(t.outcome || "Outcome")} {toCentsLabel(price)}
                                </span>
                                <span>{formatShares(size)}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-3 text-right">
                          <div className="text-sm text-slate-100">{formatCurrency(amount)}</div>
                          <div className="mt-0.5 text-xs text-slate-400 inline-flex items-center gap-2">
                            <span>{relativeTimeLabel(Number(t.timestamp) || 0)}</span>
                            {marketHref !== "#" && (
                              <a
                                href={marketHref}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex h-5 w-5 items-center justify-center rounded border border-slate-700/70 text-slate-300 hover:text-slate-100"
                                aria-label="Open trade market"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {activityRows.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-2 py-4 text-sm text-slate-500">
                        No activity found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
          {tradesHasMore && onLoadMoreTrades && (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={onLoadMoreTrades}
                disabled={isTradesLoadingMore}
                className="rounded-md border border-slate-600 bg-slate-800/50 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700/50 disabled:opacity-50"
              >
                {isTradesLoadingMore ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

