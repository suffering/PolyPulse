"use client";

import Link from "next/link";
import { TableSkeleton } from "@/components/ui/Skeleton";
import type { OpenPosition } from "@/lib/leaderboard";

function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) return "$0.00";
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

interface OpenPositionsTableProps {
  positions: OpenPosition[];
  isLoading: boolean;
  isError: boolean;
  refetch?: () => void;
}

export function OpenPositionsTable({
  positions,
  isLoading,
  isError,
  refetch,
}: OpenPositionsTableProps) {
  if (isLoading && positions.length === 0) {
    return (
      <div className="border border-slate-700/50 rounded-lg bg-slate-900/30 p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Open Positions</h2>
        <TableSkeleton rows={5} cols={7} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="border border-slate-700/50 rounded-lg bg-slate-900/30 p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Open Positions</h2>
        <p className="text-slate-400 mb-2">Failed to load positions.</p>
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
        <h2 className="text-lg font-semibold text-white mb-4">Open Positions</h2>
        <p className="text-slate-500">No open positions.</p>
      </div>
    );
  }

  return (
    <div className="border border-slate-700/50 rounded-lg bg-slate-900/30 p-6 mb-6 overflow-x-auto">
      <h2 className="text-lg font-semibold text-white mb-4">Open Positions</h2>
      <table className="w-full text-left border-collapse min-w-[800px]">
        <thead className="border-b border-slate-700/60">
          <tr>
            <th className="px-3 py-2 text-xs font-medium text-slate-400">Market</th>
            <th className="px-3 py-2 text-xs font-medium text-slate-400">Side</th>
            <th className="px-3 py-2 text-xs font-medium text-slate-400">Shares</th>
            <th className="px-3 py-2 text-xs font-medium text-slate-400">Entry</th>
            <th className="px-3 py-2 text-xs font-medium text-slate-400">Current</th>
            <th className="px-3 py-2 text-xs font-medium text-slate-400">Value</th>
            <th className="px-3 py-2 text-xs font-medium text-slate-400">Unrealized PnL</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((pos, i) => {
            const marketUrl = pos.eventSlug
              ? `https://polymarket.com/event/${pos.eventSlug}`
              : "#";
            return (
              <tr key={`${pos.conditionId}-${pos.asset}-${i}`} className="border-b border-slate-800/70">
                <td className="px-3 py-2">
                  {marketUrl !== "#" ? (
                    <Link
                      href={marketUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-200 hover:text-amber-400 truncate max-w-[200px] block"
                    >
                      {pos.title || "—"}
                    </Link>
                  ) : (
                    <span className="text-slate-200 truncate max-w-[200px] block">{pos.title || "—"}</span>
                  )}
                </td>
                <td className="px-3 py-2 text-slate-300">{pos.outcome || "—"}</td>
                <td className="px-3 py-2 text-slate-300">
                  {typeof pos.size === "number" ? pos.size.toLocaleString() : "—"}
                </td>
                <td className="px-3 py-2 text-slate-300">
                  {typeof pos.avgPrice === "number" ? formatCurrency(pos.avgPrice) : "—"}
                </td>
                <td className="px-3 py-2 text-slate-300">
                  {typeof pos.curPrice === "number" ? formatCurrency(pos.curPrice) : "—"}
                </td>
                <td className="px-3 py-2 text-slate-300">
                  {typeof pos.currentValue === "number" ? formatCurrency(pos.currentValue) : "—"}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={
                      typeof pos.cashPnl === "number" && pos.cashPnl >= 0
                        ? "text-emerald-400"
                        : "text-red-400"
                    }
                  >
                    {typeof pos.cashPnl === "number" ? formatCurrency(pos.cashPnl) : "—"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
