"use client";

import type { MatchedOpportunity } from "@/lib/matching";

interface EVCardProps {
  opportunity: MatchedOpportunity;
  isTopEv?: boolean;
}

function formatOdds(american: number): string {
  if (american > 0) return `+${Math.round(american)}`;
  return String(Math.round(american));
}

export function EVCard({ opportunity }: EVCardProps) {
  const hasSportsbook =
    opportunity.sportsbookName != null && opportunity.sportsbookOdds != null;
  const evPercent = opportunity.evPercent ?? 0;
  const isMlb = opportunity.sport === "MLB";
  const displayEvPercent = isMlb
    ? Math.min(500, Math.max(-100, evPercent))
    : Math.min(50, Math.max(-100, evPercent));

  const formatPct = (v: number) => (isMlb && v < 10 ? v.toFixed(2) : v.toFixed(1));
  const formatCents = (v: number) => (isMlb && v < 10 ? v.toFixed(2) : v.toFixed(1));

  const evPositive = evPercent >= 0;
  // Keep Expected Profit perfectly consistent with the displayed (clamped) EV%.
  // For a $100 stake: expected profit = stake × (EV% / 100) = EV% numerically.
  const expectedProfit = displayEvPercent;
  const profitPositive = expectedProfit >= 0;

  return (
    <a
      href={opportunity.polymarketUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block group"
    >
      <div
        className={`relative bg-[#0b0b12] rounded-2xl transition-all duration-200 overflow-hidden flex flex-col h-full border border-white/[0.07] hover:border-[#4B4BF7]/50 hover:shadow-[0_0_24px_rgba(75,75,247,0.18)]`}
      >
        {/* Header: Sport + EV Badge */}
        <div className="flex items-center justify-between px-6 pt-6">
          <span className="text-[10px] uppercase tracking-widest font-semibold text-white/40">
            {opportunity.sport?.toUpperCase()}
          </span>
          {hasSportsbook && (
            <span
              className={`font-mono text-sm font-bold tabular-nums ${
                evPositive ? "text-[#4ade80]" : "text-white/40"
              }`}
            >
              {displayEvPercent > 0 ? "+" : ""}
              {displayEvPercent.toFixed(1)}% EV
            </span>
          )}
        </div>

        {/* Matchup + Outcome */}
        <div className="px-6 pt-4 pb-6">
          <h2 className="text-white font-semibold text-[15px] leading-snug mb-1 group-hover:text-[#8b8bff] transition-colors line-clamp-2">
            {opportunity.matchup}
          </h2>
          <p className="text-white/50 text-[13px] font-medium">
            {opportunity.outcome}
          </p>
        </div>

        {/* Odds Comparison */}
        <div className="mx-6 p-4 rounded-xl bg-white/[0.03] border border-white/[0.05]">
          {hasSportsbook ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] uppercase text-white/35 tracking-wider mb-2 font-semibold">
                  Polymarket
                </p>
                <p className="text-white font-mono text-2xl font-bold tabular-nums leading-none">
                  {formatPct(opportunity.polymarketImpliedProb)}%
                </p>
                <p className="text-white/35 font-mono text-[11px] tabular-nums mt-1.5">
                  {formatCents(opportunity.polymarketPrice * 100)}¢
                </p>
              </div>
              <div className="pl-4 border-l border-white/[0.06]">
                <p className="text-[10px] uppercase text-white/35 tracking-wider mb-2 font-semibold">
                  {opportunity.sportsbookName}
                </p>
                <p className="text-white font-mono text-2xl font-bold tabular-nums leading-none">
                  {formatPct(opportunity.sportsbookImpliedProb ?? 0)}%
                </p>
                <p className="text-white/35 font-mono text-[11px] tabular-nums mt-1.5">
                  {formatOdds(opportunity.sportsbookOdds!)}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 items-center">
              <div>
                <p className="text-[10px] uppercase text-white/35 tracking-wider mb-2 font-semibold">
                  Polymarket
                </p>
                <p className="text-white font-mono text-2xl font-bold tabular-nums leading-none">
                  {formatPct(opportunity.polymarketImpliedProb)}%
                </p>
                <p className="text-white/35 font-mono text-[11px] tabular-nums mt-1.5">
                  {formatCents(opportunity.polymarketPrice * 100)}¢
                </p>
              </div>
              <div className="pl-4 border-l border-white/[0.06]">
                <p className="text-[10px] uppercase text-white/35 tracking-wider mb-2 font-semibold">
                  No book yet
                </p>
                <p className="text-amber-400/80 text-[13px] font-medium">
                  Polymarket only
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Profit Row — only for sportsbook cards */}
        {hasSportsbook && (
          <div className="px-6 py-4 mt-4 flex items-baseline justify-between border-t border-white/[0.05]">
            <span className="text-[11px] uppercase tracking-wider text-white/35 font-semibold">
              Expected Profit
              <span className="ml-1.5 text-white/25 normal-case font-normal">on $100</span>
            </span>
            <span
              className={`font-mono text-lg font-bold tabular-nums ${
                profitPositive ? "text-[#4ade80]" : "text-red-400"
              }`}
            >
              {profitPositive ? "+$" : "-$"}
              {Math.abs(expectedProfit).toFixed(2)}
            </span>
          </div>
        )}

        {/* Button */}
        <div className="px-6 pb-6 mt-auto pt-2">
          <div className="w-full text-center px-4 py-2.5 bg-white/[0.04] border border-white/10 group-hover:bg-[#4B4BF7] group-hover:border-[#4B4BF7] group-hover:text-white text-white/60 text-sm font-semibold rounded-xl transition-all duration-200">
            Bet on Polymarket →
          </div>
        </div>
      </div>
    </a>
  );
}
