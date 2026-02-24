"use client";

import { useRouter } from "next/navigation";
import type { LeaderboardEntry } from "@/lib/leaderboard";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  onSort?: (column: string) => void;
  sortColumn?: string;
  sortDirection?: "asc" | "desc";
}

function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) return "$0.00";
  if (Math.abs(value) >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

export function LeaderboardTable({
  entries,
  onSort,
  sortColumn,
  sortDirection,
}: LeaderboardTableProps) {
  const router = useRouter();

  const handleSort = (column: string) => {
    if (onSort) {
      onSort(column);
    }
  };

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) return "↕";
    return sortDirection === "asc" ? "↑" : "↓";
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[700px]">
        <thead className="border-b border-slate-700/60">
          <tr>
            <th className="px-3 py-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
              Rank
            </th>
            <th className="px-3 py-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
              <button
                type="button"
                onClick={() => handleSort("userName")}
                className="flex items-center gap-1 hover:text-slate-200"
              >
                <span>Trader</span>
                <span className="text-[10px]">{getSortIcon("userName")}</span>
              </button>
            </th>
            <th className="px-3 py-2 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
              <span>Total Trades</span>
            </th>
            <th className="px-3 py-2 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
              <button
                type="button"
                onClick={() => handleSort("vol")}
                className="flex items-center gap-1 ml-auto hover:text-slate-200"
              >
                <span>Volume</span>
                <span className="text-[10px]">{getSortIcon("vol")}</span>
              </button>
            </th>
            <th className="px-3 py-2 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
              <button
                type="button"
                onClick={() => handleSort("pnl")}
                className="flex items-center gap-1 ml-auto hover:text-slate-200"
              >
                <span>P&L</span>
                <span className="text-[10px]">{getSortIcon("pnl")}</span>
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const displayName =
              entry.userName ||
              `${entry.proxyWallet.slice(0, 6)}...${entry.proxyWallet.slice(-4)}`;
            const isPositive = entry.pnl >= 0;

            return (
              <tr
                key={entry.proxyWallet}
                onClick={() => router.push(`/traders/${entry.proxyWallet}`)}
                className="border-b border-slate-800/70 hover:bg-slate-800/40 transition-colors cursor-pointer"
              >
                <td className="px-3 py-3 text-sm text-slate-300 font-mono">
                  #{entry.rank}
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center text-xs text-slate-400">
                      {entry.profileImage ? (
                        <img
                          src={entry.profileImage}
                          alt={displayName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span>
                          {entry.proxyWallet.slice(2, 4).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-100 truncate">
                        {displayName}
                      </div>
                      {entry.xUsername && (
                        <div className="text-xs text-slate-500 truncate">
                          @{entry.xUsername}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 text-sm text-right text-slate-300">
                  {entry.totalTrades !== null && entry.totalTrades !== undefined
                    ? entry.totalTrades === 4000
                      ? "4,000+"
                      : entry.totalTrades.toLocaleString()
                    : "—"}
                </td>
                <td className="px-3 py-3 text-sm text-right text-slate-300">
                  {formatCurrency(entry.vol)}
                </td>
                <td className="px-3 py-3 text-sm text-right">
                  <span className={isPositive ? "text-emerald-400" : "text-red-400"}>
                    {isPositive ? "+" : ""}
                    {formatCurrency(entry.pnl)}
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
