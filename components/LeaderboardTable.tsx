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

function getRankColor(rank: number): string {
  if (rank === 1) return "text-yellow-400 font-bold font-mono text-sm";
  if (rank === 2) return "text-slate-400 font-bold font-mono text-sm";
  if (rank === 3) return "text-amber-600 font-bold font-mono text-sm";
  return "text-white/25 font-mono text-sm";
}

export function LeaderboardTable({
  entries,
  onSort,
  sortColumn,
  sortDirection,
}: LeaderboardTableProps) {
  const router = useRouter();

  const handleSort = (column: string) => {
    if (onSort) onSort(column);
  };

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) return <span className="text-white/20 ml-1 text-[10px]">↕</span>;
    return <span className="text-[#4B4BF7] ml-1 text-[10px]">{sortDirection === "asc" ? "↑" : "↓"}</span>;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[700px]">
        <thead className="border-b border-[#4B4BF7]/20">
          <tr>
            <th className="px-5 py-3 text-[10px] uppercase tracking-widest text-white/30">
              Rank
            </th>
            <th className="px-5 py-3 text-[10px] uppercase tracking-widest text-white/30">
              <button type="button" onClick={() => handleSort("userName")} className="flex items-center hover:text-white/60 transition-colors">
                <span>Trader</span>{getSortIcon("userName")}
              </button>
            </th>
            <th className="px-5 py-3 text-right text-[10px] uppercase tracking-widest text-white/30">
              Total Trades
            </th>
            <th className="px-5 py-3 text-right text-[10px] uppercase tracking-widest text-white/30">
              <button type="button" onClick={() => handleSort("vol")} className="flex items-center ml-auto hover:text-white/60 transition-colors">
                <span>Volume</span>{getSortIcon("vol")}
              </button>
            </th>
            <th className="px-5 py-3 text-right text-[10px] uppercase tracking-widest text-white/30">
              <button type="button" onClick={() => handleSort("pnl")} className="flex items-center ml-auto hover:text-white/60 transition-colors">
                <span>P&amp;L</span>{getSortIcon("pnl")}
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
                className="grid-cols-5 border-b border-white/5 border-l-2 border-l-transparent hover:bg-white/5 hover:border-l-[#4B4BF7] transition-all duration-150 cursor-pointer"
              >
                <td className={`px-5 py-3 ${getRankColor(entry.rank)}`}>
                  #{entry.rank}
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white/10 overflow-hidden flex items-center justify-center text-white/50 text-xs font-mono flex-shrink-0">
                      {entry.profileImage ? (
                        <img src={entry.profileImage} alt={displayName} className="w-full h-full object-cover" />
                      ) : (
                        <span>{entry.proxyWallet.slice(2, 4).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-white/80 text-sm font-medium truncate">{displayName}</div>
                      {entry.xUsername && (
                        <div className="text-xs text-white/30 truncate">@{entry.xUsername}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 text-sm text-right text-white/40 font-mono">
                  {entry.totalTrades !== null && entry.totalTrades !== undefined
                    ? entry.totalTrades === 4000 ? "4,000+" : entry.totalTrades.toLocaleString()
                    : "—"}
                </td>
                <td className="px-5 py-3 text-sm text-right text-white/60 font-mono">
                  {formatCurrency(entry.vol)}
                </td>
                <td className="px-5 py-3 text-sm text-right">
                  <span className={`font-mono font-semibold ${isPositive ? "text-[#4ade80]" : "text-red-400"}`}>
                    {isPositive ? "+" : ""}{formatCurrency(entry.pnl)}
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
