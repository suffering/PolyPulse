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

function getRankCardClass(rank: number): string {
  if (rank === 1) return "border-yellow-400/30 shadow-[0_0_35px_rgba(234,179,8,0.12)] scale-105";
  if (rank === 2) return "border-slate-400/20 shadow-[0_0_20px_rgba(148,163,184,0.07)]";
  if (rank === 3) return "border-amber-700/20 shadow-[0_0_20px_rgba(180,83,9,0.07)]";
  return "border-white/10";
}

function getRankAvatarRing(rank: number): string {
  if (rank === 1) return "ring-2 ring-yellow-400/50";
  if (rank === 2) return "ring-2 ring-slate-400/40";
  if (rank === 3) return "ring-2 ring-amber-700/40";
  return "";
}

function getRankBadgeClass(rank: number): string {
  if (rank === 1) return "bg-yellow-400/10 text-yellow-400";
  if (rank === 2) return "bg-slate-400/10 text-slate-400";
  if (rank === 3) return "bg-amber-800/10 text-amber-600";
  return "bg-white/5 text-white/40";
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
      className={`bg-[#0f0f14] border rounded-2xl p-6 flex flex-col items-center gap-3 transition-all duration-200 cursor-pointer ${getRankCardClass(rank)}`}
    >
      <div className={`w-16 h-16 rounded-full bg-white/10 overflow-hidden flex items-center justify-center text-white/60 text-sm font-mono ${getRankAvatarRing(rank)}`}>
        {profileImage ? (
          <img src={profileImage} alt={displayName} className="w-full h-full object-cover rounded-full" />
        ) : (
          <span>{walletAddress.slice(2, 4).toUpperCase()}</span>
        )}
      </div>

      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getRankBadgeClass(rank)}`}>
        #{rank}
      </span>

      <p className="text-white font-semibold text-sm tracking-tight text-center truncate w-full text-center">
        {displayName}
      </p>

      <p className="text-white/30 text-xs font-mono">
        Total Trades: {totalTrades !== null && totalTrades !== undefined
          ? totalTrades === 4000 ? "4,000+" : totalTrades.toLocaleString()
          : "—"}
      </p>

      <div className={`text-2xl font-bold font-mono ${isPositive ? "text-[#4ade80]" : "text-red-400"}`}>
        {isPositive ? "+" : ""}{formatCurrency(pnl)}
      </div>
    </div>
  );
}
