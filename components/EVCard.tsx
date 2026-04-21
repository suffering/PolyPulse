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

function getSportBadgeColor(sport: string): string {
  switch (sport?.toUpperCase()) {
    case "NBA":
      return "bg-amber-900/30 text-amber-400 border-amber-700/40";
    case "MLS":
      return "bg-blue-900/30 text-blue-300 border-blue-700/40";
    case "MLB":
      return "bg-green-900/30 text-green-400 border-green-700/40";
    case "NHL":
      return "bg-cyan-900/30 text-cyan-300 border-cyan-700/40";
    case "TENNIS":
      return "bg-purple-900/30 text-purple-300 border-purple-700/40";
    default:
      return "bg-white/5 text-white/50 border-white/10";
  }
}

export function EVCard({ opportunity, isTopEv = false }: EVCardProps) {
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

  return (
    <a
      href={opportunity.polymarketUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block group"
    >
      <div
        className={`relative bg-[#0e0e1a] border rounded-2xl transition-all duration-200 overflow-hidden flex flex-col h-full min-h-[320px] min-w-0 ${
          isTopEv
            ? "border-[#4B4BF7]/60 shadow-[0_0_30px_rgba(75,75,247,0.25)] hover:shadow-[0_0_40px_rgba(75,75,247,0.45)]"
            : "border-white/10 hover:border-[#4B4BF7]/50 hover:shadow-[0_0_20px_rgba(75,75,247,0.15)]"
        }`}
      >
        {/* Subtle gradient glow accent on top edge for high-EV card */}
        {isTopEv && (
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#4B4BF7] to-transparent pointer-events-none" />
        )}

        {/* Section 1: Sport Badge + EV Badge + Matchup + Outcome */}
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center justify-between gap-2 flex-nowrap mb-3">
            <div
              className={`text-[10px] uppercase font-semibold tracking-widest rounded-full px-2.5 py-1 border shrink-0 ${getSportBadgeColor(
                opportunity.sport
              )}`}
            >
              {opportunity.sport?.toUpperCase()}
            </div>
            {hasSportsbook && (
              <div
                className={`text-xs font-mono font-bold shrink-0 rounded-full px-2.5 py-1 border ${
                  evPositive
                    ? "bg-[#4ade80]/10 text-[#4ade80] border-[#4ade80]/30"
                    : "bg-white/5 text-white/40 border-white/10"
                }`}
              >
                {displayEvPercent > 0 ? "+" : ""}
                {displayEvPercent.toFixed(1)}% EV
              </div>
            )}
          </div>
          <h2 className="text-white font-semibold text-base leading-snug mb-1 group-hover:text-[#4B4BF7] transition-colors">
            {opportunity.matchup}
          </h2>
          <p className="text-white/70 font-medium text-sm">
            {opportunity.outcome}
          </p>
        </div>

        {/* Section 2: Odds Comparison */}
        {hasSportsbook ? (
          <div className="p-5 border-b border-white/5">
            <div className="grid grid-cols-2 gap-4">
              {/* Polymarket Column */}
              <div>
                <p className="text-[10px] uppercase text-white/30 tracking-widest mb-2 font-medium">
                  Polymarket
                </p>
                <p className="text-white font-mono text-xl font-bold mb-1 tabular-nums">
                  {formatPct(opportunity.polymarketImpliedProb)}%
                </p>
                <p className="text-white/40 font-mono text-xs tabular-nums">
                  {formatCents(opportunity.polymarketPrice * 100)}¢
                </p>
              </div>

              {/* Sportsbook Column */}
              <div>
                <p className="text-[10px] uppercase text-white/30 tracking-widest mb-2 font-medium">
                  {opportunity.sportsbookName}
                </p>
                <p className="text-white font-mono text-xl font-bold mb-1 tabular-nums">
                  {formatPct(opportunity.sportsbookImpliedProb ?? 0)}%
                </p>
                <p className="text-white/40 font-mono text-xs tabular-nums">
                  {formatOdds(opportunity.sportsbookOdds!)}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-5 border-b border-white/5">
            <div className="grid grid-cols-2 gap-4">
              {/* Polymarket Column */}
              <div>
                <p className="text-[10px] uppercase text-white/30 tracking-widest mb-2 font-medium">
                  Polymarket
                </p>
                <p className="text-white font-mono text-xl font-bold mb-1 tabular-nums">
                  {formatPct(opportunity.polymarketImpliedProb)}%
                </p>
                <p className="text-white/40 font-mono text-xs tabular-nums">
                  {formatCents(opportunity.polymarketPrice * 100)}¢
                </p>
              </div>

              {/* Polymarket Only Column */}
              <div>
                <p className="text-[10px] uppercase text-white/30 tracking-widest mb-2 font-medium">
                  No Book Yet
                </p>
                <div className="inline-flex items-center rounded-full px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-xs text-amber-400/80 font-medium">
                  Polymarket only
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section 3: Profit Calculations - Only show for sportsbook cards */}
        {hasSportsbook && (
          <div className="p-5 border-b border-white/5 space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="text-white/40 text-xs">$100 stake:</p>
              <p className="text-[#4ade80] font-mono text-xs font-semibold tabular-nums">
                ${Math.round(opportunity.profitIfWin100 ?? 0).toLocaleString()}{" "}
                <span className="text-white/30 font-normal">profit if win</span>
              </p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-white/40 text-xs">Expected profit:</p>
              <p
                className={`font-mono text-base font-bold tabular-nums ${
                  (opportunity.expectedProfit100 ?? 0) >= 0
                    ? "text-[#4ade80]"
                    : "text-red-400"
                }`}
              >
                {(opportunity.expectedProfit100 ?? 0) >= 0 ? "$" : "-$"}
                {Math.abs(opportunity.expectedProfit100 ?? 0).toFixed(2)}
              </p>
            </div>
          </div>
        )}

        {/* Button */}
        <div className="p-5 mt-auto">
          <div className="w-full text-center px-4 py-2.5 bg-white/5 border border-white/10 group-hover:bg-[#4B4BF7]/10 group-hover:border-[#4B4BF7]/50 group-hover:text-[#4B4BF7] text-white/60 text-sm font-medium rounded-xl transition-all duration-200">
            Bet on Polymarket →
          </div>
        </div>
      </div>
    </a>
  );
}
