"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MatchedOpportunity } from "@/lib/matching";

interface EVCardProps {
  opportunity: MatchedOpportunity;
}

function formatOdds(american: number): string {
  if (american > 0) return `+${Math.round(american)}`;
  return String(Math.round(american));
}

function getEVColor(ev: number): string {
  if (ev >= 5) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/50";
  if (ev > 0) return "bg-blue-500/20 text-blue-400 border-blue-500/50";
  if (Math.abs(ev) < 0.05) return "bg-slate-500/20 text-slate-400 border-slate-500/50";
  if (ev > -5) return "bg-amber-500/20 text-amber-400 border-amber-500/50";
  return "bg-red-500/20 text-red-400 border-red-500/50";
}

export function EVCard({ opportunity }: EVCardProps) {
  const hasSportsbook =
    opportunity.sportsbookName != null && opportunity.sportsbookOdds != null;
  const evPercent = opportunity.evPercent ?? 0;

  return (
    <Card className="border-slate-700/50 bg-slate-900/50 hover:border-slate-600/50 transition-colors">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-mono text-sm text-slate-300">{opportunity.matchup}</h3>
            <p className="font-semibold text-white mt-0.5">{opportunity.outcome}</p>
          </div>
          {hasSportsbook ? (
            <Badge
              className={`font-mono ${getEVColor(evPercent)} border`}
              variant="outline"
            >
              {evPercent > 0 ? "+" : ""}{evPercent.toFixed(1)}% EV
            </Badge>
          ) : (
            <Badge
              className="font-mono bg-slate-500/20 text-slate-400 border-slate-500/50"
              variant="outline"
            >
              Polymarket only
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-3 text-slate-400">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider">Polymarket</p>
            <p className="font-mono text-slate-300">
              {(opportunity.polymarketPrice * 100).toFixed(1)}¢ ({(opportunity.polymarketImpliedProb).toFixed(1)}%)
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider">
              {hasSportsbook ? opportunity.sportsbookName : "—"}
            </p>
            <p className="font-mono text-slate-300">
              {hasSportsbook
                ? `${formatOdds(opportunity.sportsbookOdds!)} (${(opportunity.sportsbookImpliedProb ?? 0).toFixed(1)}%)`
                : "No sportsbook comparison"}
            </p>
          </div>
        </div>

        {hasSportsbook && (
          <div className="pt-2 border-t border-slate-700/50 space-y-1">
            <p className="text-xs text-slate-500">
              $100 stake → ${Math.round(opportunity.profitIfWin100 ?? 0).toLocaleString()} profit if win
            </p>
            <p className="text-xs text-slate-500">
              {(opportunity.expectedProfit100 ?? 0) >= 0 ? "$" : "-$"}
              {Math.abs(opportunity.expectedProfit100 ?? 0).toFixed(0)} expected profit
            </p>
          </div>
        )}

        <Button
          asChild
          variant="outline"
          size="sm"
          className="w-full border-slate-600 hover:bg-slate-800 hover:border-slate-500"
        >
          <a
            href={opportunity.polymarketUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-300"
          >
            Bet on Polymarket →
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
