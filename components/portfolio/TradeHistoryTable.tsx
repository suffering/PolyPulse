"use client";

import Link from "next/link";
import { TableSkeleton } from "@/components/ui/Skeleton";
import type { TradeItem } from "@/lib/portfolio";

function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) return "$0.00";
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

function formatTimestamp(ts: number | undefined): string {
  if (ts == null || !Number.isFinite(ts)) return "—";
  const ms = ts > 1e12 ? ts : ts * 1000;
  return new Date(ms).toLocaleString();
}

interface TradeHistoryTableProps {
  trades: TradeItem[];
  hasMore: boolean;
  onLoadMore?: () => void;
  isLoading: boolean;
  isLoadingMore?: boolean;
  isError: boolean;
  refetch?: () => void;
}

export function TradeHistoryTable({
  trades,
  hasMore,
  onLoadMore,
  isLoading,
  isLoadingMore,
  isError,
  refetch,
}: TradeHistoryTableProps) {
  if (isLoading && trades.length === 0) {
    return (
      <div className="border border-slate-700/50 rounded-lg bg-slate-900/30 p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Trade History</h2>
        <TableSkeleton rows={5} cols={6} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="border border-slate-700/50 rounded-lg bg-slate-900/30 p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Trade History</h2>
        <p className="text-slate-400 mb-2">Failed to load trades.</p>
        {refetch && (
          <button
            type="button"
            onClick={() => refetch()}
            className="text-sm text-amber-400 hover:text-amber-300"
          >
            Try again
          </button>
        )}
      </div>
    );
  }

  if (trades.length === 0) {
    return (
      <div className="border border-slate-700/50 rounded-lg bg-slate-900/30 p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Trade History</h2>
        <p className="text-slate-500">No trades yet.</p>
      </div>
    );
  }

  return (
    <div className="border border-slate-700/50 rounded-lg bg-slate-900/30 p-6 mb-6 overflow-x-auto">
      <h2 className="text-lg font-semibold text-white mb-4">Trade History</h2>
      <table className="w-full text-left border-collapse min-w-[800px]">
        <thead className="border-b border-slate-700/60">
          <tr>
            <th className="px-3 py-2 text-xs font-medium text-slate-400">Date</th>
            <th className="px-3 py-2 text-xs font-medium text-slate-400">Market</th>
            <th className="px-3 py-2 text-xs font-medium text-slate-400">Side</th>
            <th className="px-3 py-2 text-xs font-medium text-slate-400">Size</th>
            <th className="px-3 py-2 text-xs font-medium text-slate-400">Price</th>
            <th className="px-3 py-2 text-xs font-medium text-slate-400">Realized PnL</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade, i) => {
            const eventSlug = trade.eventSlug ?? "";
            const marketUrl = eventSlug
              ? `https://polymarket.com/event/${eventSlug}`
              : "#";
            return (
              <tr key={trade.transactionHash ?? `${i}-${trade.timestamp}`} className="border-b border-slate-800/70">
                <td className="px-3 py-2 text-slate-300 text-sm">
                  {formatTimestamp(trade.timestamp)}
                </td>
                <td className="px-3 py-2">
                  {marketUrl !== "#" ? (
                    <Link
                      href={marketUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-200 hover:text-amber-400 truncate max-w-[200px] block"
                    >
                      {trade.title ?? "—"}
                    </Link>
                  ) : (
                    <span className="text-slate-200 truncate max-w-[200px] block">
                      {trade.title ?? "—"}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-slate-300">{trade.side ?? trade.outcome ?? "—"}</td>
                <td className="px-3 py-2 text-slate-300">
                  {typeof trade.size === "number" ? trade.size.toLocaleString() : "—"}
                </td>
                <td className="px-3 py-2 text-slate-300">
                  {typeof trade.price === "number" ? formatCurrency(trade.price) : "—"}
                </td>
                <td className="px-3 py-2 text-slate-400">—</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {hasMore && onLoadMore && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="rounded-md border border-slate-600 bg-slate-800/50 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700/50 disabled:opacity-50"
          >
            {isLoadingMore ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
