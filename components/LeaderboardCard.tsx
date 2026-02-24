"use client";

import { useRouter } from "next/navigation";

interface LeaderboardCardProps {
  rank: number;
  userName: string | null;
  profileImage: string | null;
  /** Total trades; null means unavailable (show —) */
  totalTrades: number | null;
  pnl: number;
  walletAddress: string;
}

function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) return "$0.00";
  if (Math.abs(value) >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

function getRankBadgeClass(rank: number): string {
  if (rank === 1) return "bg-amber-500/20 text-amber-400 border-amber-500/50";
  if (rank === 2) return "bg-slate-400/20 text-slate-300 border-slate-400/50";
  if (rank === 3) return "bg-orange-600/20 text-orange-400 border-orange-600/50";
  return "bg-slate-700/50 text-slate-400 border-slate-600/50";
}

export function LeaderboardCard({
  rank,
  userName,
  profileImage,
  totalTrades,
  pnl,
  walletAddress,
}: LeaderboardCardProps) {
  const router = useRouter();
  const displayName = userName || `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
  const isPositive = pnl >= 0;

  return (
    <div
      onClick={() => router.push(`/traders/${walletAddress}`)}
      className="border border-slate-700/50 rounded-lg bg-slate-900/30 p-6 hover:bg-slate-800/40 transition-colors cursor-pointer"
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="h-16 w-16 rounded-full bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center text-xl text-slate-400">
            {profileImage ? (
              <img
                src={profileImage}
                alt={displayName}
                className="h-full w-full object-cover"
              />
            ) : (
              <span>
                {walletAddress.slice(2, 4).toUpperCase()}
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`inline-block px-2 py-0.5 rounded text-xs font-bold border ${getRankBadgeClass(
                rank
              )}`}
            >
              #{rank}
            </span>
          </div>

          <h3 className="text-lg font-bold text-white mb-1 truncate">
            {displayName}
          </h3>

          <p className="text-xs text-slate-400 mb-3">
            Total Trades: {totalTrades !== null && totalTrades !== undefined
              ? totalTrades === 4000
                ? "4,000+"
                : totalTrades.toLocaleString()
              : "—"}
          </p>

          <div className={`text-2xl font-bold ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
            {isPositive ? "+" : ""}
            {formatCurrency(pnl)}
          </div>
        </div>
      </div>
    </div>
  );
}
