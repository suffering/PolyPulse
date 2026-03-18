"use client";

import type { MatchedOpportunity } from "@/lib/matching";

interface EVCardProps {
  opportunity: MatchedOpportunity;
}

function formatOdds(american: number): string {
  if (american > 0) return `+${Math.round(american)}`;
  return String(Math.round(american));
}

function getSportBadgeColor(sport: string): string {
  switch (sport?.toUpperCase()) {
    case "NBA":
      return "bg-amber-500/20 text-amber-400 border-amber-500/50";
    case "MLS":
      return "bg-blue-500/20 text-blue-400 border-blue-500/50";
    case "MLB":
      return "bg-green-500/20 text-green-400 border-green-500/50";
    case "NHL":
      return "bg-cyan-500/20 text-cyan-400 border-cyan-500/50";
    case "TENNIS":
      return "bg-purple-500/20 text-purple-400 border-purple-500/50";
    default:
      return "bg-gray-500/20 text-gray-400 border-gray-500/50";
  }
}

function getEVBadgeColor(ev: number): string {
  if (ev >= 10) return "text-green-400 font-semibold";
  if (ev >= 5) return "text-green-400";
  if (ev >= 0) return "text-green-300";
  return "text-gray-400";
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

  return (
    <a
      href={opportunity.polymarketUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block group"
    >
      <div className="bg-[#0a0a0a] border border-white/8 hover:border-blue-500/40 rounded-lg transition-all duration-200 overflow-hidden hover:shadow-lg hover:shadow-blue-500/20 flex flex-col h-full">
        {/* Section 1: Sport Badge + EV Badge + Matchup + Outcome */}
        <div className="px-5 py-4 border-b border-white/5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className={`text-xs uppercase font-semibold tracking-wider rounded-full px-3 py-1 border ${getSportBadgeColor(opportunity.sport)}`}>
              {opportunity.sport?.toUpperCase()}
            </div>
            {hasSportsbook && (
              <div className={`text-sm font-mono font-bold ${getEVBadgeColor(evPercent)}`}>
                {displayEvPercent > 0 ? "+" : ""}{displayEvPercent.toFixed(1)}% EV
              </div>
            )}
          </div>
          <h2 className="text-white font-bold text-lg mb-1 group-hover:text-blue-400 transition-colors">
            {opportunity.matchup}
          </h2>
          <p className="text-white font-semibold text-base">
            {opportunity.outcome}
          </p>
        </div>

        {/* Section 2: Odds Comparison */}
        {hasSportsbook ? (
          <div className="px-5 py-4 border-b border-white/5">
            <div className="grid grid-cols-2 gap-6">
              {/* Polymarket Column */}
              <div>
                <p className="text-[10px] uppercase text-gray-600 tracking-wider mb-2 font-medium">Polymarket</p>
                <p className="text-white font-mono text-lg font-semibold mb-1">
                  {formatPct(opportunity.polymarketImpliedProb)}%
                </p>
                <p className="text-gray-500 font-mono text-xs">
                  {formatCents(opportunity.polymarketPrice * 100)}¢
                </p>
              </div>

              {/* Sportsbook Column */}
              <div>
                <p className="text-[10px] uppercase text-gray-600 tracking-wider mb-2 font-medium">
                  {opportunity.sportsbookName}
                </p>
                <p className="text-white font-mono text-lg font-semibold mb-1">
                  {formatPct(opportunity.sportsbookImpliedProb ?? 0)}%
                </p>
                <p className="text-gray-500 font-mono text-xs">
                  {formatOdds(opportunity.sportsbookOdds!)}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="px-5 py-4 border-b border-white/5">
            <div className="grid grid-cols-2 gap-6">
              {/* Polymarket Column */}
              <div>
                <p className="text-[10px] uppercase text-gray-600 tracking-wider mb-2 font-medium">Polymarket</p>
                <p className="text-white font-mono text-lg font-semibold mb-1">
                  {formatPct(opportunity.polymarketImpliedProb)}%
                </p>
                <p className="text-gray-500 font-mono text-xs">
                  {formatCents(opportunity.polymarketPrice * 100)}¢
                </p>
              </div>

              {/* Polymarket Only Column */}
              <div>
                <p className="text-[10px] uppercase text-gray-600 tracking-wider mb-2 font-medium">NO BOOK YET</p>
                <div className="inline-flex items-center rounded-full px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-xs text-amber-400/70 font-medium">
                  Polymarket only
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section 3: Profit Calculations - Only show for sportsbook cards */}
        {hasSportsbook && (
          <div className="px-5 py-4 border-b border-white/5 space-y-3">
            {/* Stake to Profit */}
            <div className="flex items-center justify-between">
              <p className="text-gray-600 text-sm">$100 stake:</p>
              <p className="text-green-400 font-mono text-sm font-semibold">
                ${Math.round(opportunity.profitIfWin100 ?? 0).toLocaleString()} profit if win
              </p>
            </div>

            {/* Expected Profit */}
            <div className="flex items-center justify-between">
              <p className="text-gray-600 text-sm">Expected profit:</p>
              <p className="text-green-400 font-mono text-base font-bold">
                {(opportunity.expectedProfit100 ?? 0) >= 0 ? "$" : "-$"}
                {Math.abs(opportunity.expectedProfit100 ?? 0).toFixed(2)}
              </p>
            </div>
          </div>
        )}

        {/* Button */}
        <div className="px-5 py-4 mt-auto">
          <div className="w-full text-center px-4 py-3 bg-[#0d0d0d] border border-white/8 group-hover:bg-blue-500/10 group-hover:border-blue-500/40 group-hover:text-blue-400 text-gray-400 text-sm font-medium rounded-lg transition-all duration-200">
            Bet on Polymarket →
          </div>
        </div>
      </div>
    </a>
  );
}
