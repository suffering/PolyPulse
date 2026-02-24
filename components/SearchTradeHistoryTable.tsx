"use client";

import { TableSkeleton } from "@/components/ui/Skeleton";
import type { PortfolioClosedPositionsResponse } from "@/lib/portfolio";

type ClosedPosition = PortfolioClosedPositionsResponse["closedPositions"][number];

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

interface SearchTradeHistoryTableProps {
  positions: ClosedPosition[];
  hasMore: boolean;
  onLoadMore?: () => void;
  isLoading: boolean;
  isLoadingMore?: boolean;
  isError: boolean;
  refetch?: () => void;
}

export function SearchTradeHistoryTable({
  positions,
  hasMore,
  onLoadMore,
  isLoading,
  isLoadingMore,
  isError,
  refetch,
}: SearchTradeHistoryTableProps) {
  if (isLoading && positions.length === 0) {
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
        <p className="text-slate-400 mb-2">Failed to load trade history.</p>
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

  if (positions.length === 0) {
    return (
      <div className="border border-slate-700/50 rounded-lg bg-slate-900/30 p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Trade History</h2>
        <p className="text-slate-500">No closed positions or trade history.</p>
      </div>
    );
  }

  return (
    <div className="border border-slate-700/50 rounded-lg bg-slate-900/30 p-6 mb-6 overflow-x-auto">
      <h2 className="text-lg font-semibold text-white mb-4">Trade History</h2>
      <table className="w-full text-left border-collapse min-w-[900px]">
        <thead className="border-b border-slate-700/60">
          <tr>
            <th className="px-3 py-2 text-xs font-medium text-slate-400">Date closed</th>
            <th className="px-3 py-2 text-xs font-medium text-slate-400">Market</th>
            <th className="px-3 py-2 text-xs font-medium text-slate-400">Side</th>
            <th className="px-3 py-2 text-xs font-medium text-slate-400">Entry price</th>
            <th className="px-3 py-2 text-xs font-medium text-slate-400">Exit price</th>
            <th className="px-3 py-2 text-xs font-medium text-slate-400">Realized PnL</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((pos, i) => (
            <tr
              key={`${pos.conditionId}-${pos.asset}-${pos.timestamp}-${i}`}
              className="border-b border-slate-800/70"
            >
              <td className="px-3 py-2 text-slate-300 text-sm">
                {formatTimestamp(pos.timestamp)}
              </td>
              <td className="px-3 py-2">
                <span className="text-slate-200 truncate max-w-[260px] block">
                  {pos.title || "—"}
                </span>
              </td>
              <td className="px-3 py-2 text-slate-300">
                {pos.outcome || "—"}
              </td>
              <td className="px-3 py-2 text-slate-300">
                {typeof pos.avgPrice === "number"
                  ? formatCurrency(pos.avgPrice)
                  : "—"}
              </td>
              <td className="px-3 py-2 text-slate-300">
                {typeof pos.curPrice === "number"
                  ? formatCurrency(pos.curPrice)
                  : "—"}
              </td>
              <td className="px-3 py-2">
                <span
                  className={
                    typeof pos.realizedPnl === "number" && pos.realizedPnl >= 0
                      ? "text-emerald-400"
                      : "text-red-400"
                  }
                >
                  {typeof pos.realizedPnl === "number"
                    ? formatCurrency(pos.realizedPnl)
                    : "—"}
                </span>
              </td>
            </tr>
          ))}
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

