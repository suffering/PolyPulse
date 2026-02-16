"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { EVCard } from "@/components/EVCard";
import { QuotaTracker } from "@/components/QuotaTracker";
import type { MatchedOpportunity } from "@/lib/matching";
import type { Timeframe, MarketCategory } from "@/lib/types";
import { getTimeframeLabel, getMarketCategoryLabel } from "@/lib/types";

type UiSport = "nba" | "mls";

async function fetchEV(sport: UiSport) {
  const res = await fetch(`/api/ev?sport=${sport}`);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

type SortOption = "highest_ev" | "lowest_ev";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "highest_ev", label: "Highest EV" },
  { value: "lowest_ev", label: "Lowest EV" },
];

function sortOpportunities(opps: MatchedOpportunity[], sort: SortOption): MatchedOpportunity[] {
  const sorted = [...opps];
  if (sort === "highest_ev") {
    sorted.sort((a, b) => (b.evPercent ?? -999) - (a.evPercent ?? -999));
  } else {
    sorted.sort((a, b) => (a.evPercent ?? -999) - (b.evPercent ?? -999));
  }
  return sorted;
}

export default function Home() {
  const [sport, setSport] = useState<UiSport>("nba");
  const [timeframe, setTimeframe] = useState<Timeframe>("all");
  const [category, setCategory] = useState<MarketCategory | "all">("all");
  const [league, setLeague] = useState<string | "all">("all");
  const [sort, setSort] = useState<SortOption>("highest_ev");

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["ev", sport],
    queryFn: () => fetchEV(sport),
    refetchInterval: 60 * 1000,
  });

  const opportunities: MatchedOpportunity[] = data?.opportunities ?? [];
  const quotaRemaining = data?.quotaRemaining ?? null;

  const { filtered, timeframeCounts, categoryCounts, leagueCounts } = useMemo(() => {
    const opps: MatchedOpportunity[] = data?.opportunities ?? [];
    const tfCounts: Record<Timeframe, number> = {
      today: 0,
      week: 0,
      month: 0,
      futures: 0,
      all: 0,
    };
    const catCounts: Record<MarketCategory | "all", number> = {
      all: 0,
      championship: 0,
      conference: 0,
      division: 0,
      mvp: 0,
      awards: 0,
      playoffs: 0,
      games: 0,
      win_totals: 0,
      stat_leaders: 0,
      other: 0,
    };
    const lgCounts: Record<string, number> = {};

    for (const opp of opps) {
      tfCounts[opp.timeframe]++;
      tfCounts.all++;
      catCounts[opp.category]++;
      catCounts.all++;
      if (opp.league) lgCounts[opp.league] = (lgCounts[opp.league] ?? 0) + 1;
    }

    let filtered = opps.filter((opp) => {
      const tfMatch = timeframe === "all" || opp.timeframe === timeframe;
      const catMatch = category === "all" || opp.category === category;
      const leagueMatch = sport === "nba" || league === "all" || opp.league === league;
      return tfMatch && catMatch && leagueMatch;
    });

    filtered = sortOpportunities(filtered, sort);

    return { filtered, timeframeCounts: tfCounts, categoryCounts: catCounts, leagueCounts: lgCounts };
  }, [data?.opportunities, timeframe, category, league, sort, sport]);

  const categoriesWithCounts = useMemo(() => {
    const cats: (MarketCategory | "all")[] = [
      "all",
      "championship",
      "conference",
      "division",
      "mvp",
      "awards",
      "playoffs",
      "games",
      "win_totals",
      "stat_leaders",
      "other",
    ];
    return cats.filter((c) => c === "all" || categoryCounts[c] > 0);
  }, [categoryCounts]);

  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-200 font-mono">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            PolyPulse +EV Engine
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Positive expected value bets on Polymarket vs sportsbooks
          </p>
        </header>

        <div className="mb-6">
          <QuotaTracker
            quotaRemaining={quotaRemaining}
            lastUpdated={data?.oddsLastUpdated ?? ""}
            onRefresh={() => refetch()}
            isLoading={isLoading}
          />
        </div>

        {!isLoading && !isError && opportunities.length > 0 && (
          <div className="mb-6 space-y-4">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Sport</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setSport("nba");
                    setLeague("all");
                    setCategory("all");
                    setTimeframe("all");
                  }}
                  className={`px-3 py-1.5 rounded-md font-mono text-sm border transition-colors ${
                    sport === "nba"
                      ? "bg-amber-500/20 text-amber-400 border-amber-500/50"
                      : "bg-slate-800/50 text-slate-400 border-slate-600 hover:border-slate-500"
                  }`}
                  aria-pressed={sport === "nba"}
                >
                  NBA
                </button>
                <button
                  onClick={() => {
                    setSport("mls");
                    setLeague("MLS");
                    setCategory("all");
                    setTimeframe("all");
                  }}
                  className={`px-3 py-1.5 rounded-md font-mono text-sm border transition-colors ${
                    sport === "mls"
                      ? "bg-amber-500/20 text-amber-400 border-amber-500/50"
                      : "bg-slate-800/50 text-slate-400 border-slate-600 hover:border-slate-500"
                  }`}
                  aria-pressed={sport === "mls"}
                >
                  Soccer
                </button>
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Timeframe</p>
              <div className="flex flex-wrap gap-2">
                {(["today", "week", "month", "futures", "all"] as const).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-3 py-1.5 rounded-md font-mono text-sm border transition-colors ${
                      timeframe === tf
                        ? "bg-amber-500/20 text-amber-400 border-amber-500/50"
                        : "bg-slate-800/50 text-slate-400 border-slate-600 hover:border-slate-500"
                    }`}
                  >
                    {getTimeframeLabel(tf)} ({timeframeCounts[tf]})
                  </button>
                ))}
              </div>
            </div>

            {sport === "nba" ? (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Category</p>
                <div className="flex flex-wrap gap-2">
                  {categoriesWithCounts.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`px-3 py-1.5 rounded-md font-mono text-sm border transition-colors ${
                        category === cat
                          ? "bg-amber-500/20 text-amber-400 border-amber-500/50"
                          : "bg-slate-800/50 text-slate-400 border-slate-600 hover:border-slate-500"
                      }`}
                    >
                      {cat === "all" ? "All" : getMarketCategoryLabel(cat)} (
                      {cat === "all" ? opportunities.length : categoryCounts[cat]})
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">League</p>
                <div className="flex flex-wrap gap-2">
                  {["MLS"].map((lg) => (
                    <button
                      key={lg}
                      onClick={() => setLeague(lg)}
                      className={`px-3 py-1.5 rounded-md font-mono text-sm border transition-colors ${
                        league === lg
                          ? "bg-amber-500/20 text-amber-400 border-amber-500/50"
                          : "bg-slate-800/50 text-slate-400 border-slate-600 hover:border-slate-500"
                      }`}
                    >
                      {lg} ({leagueCounts[lg] ?? 0})
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Sort by</p>
              <div className="flex flex-wrap gap-2">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSort(opt.value)}
                    className={`px-3 py-1.5 rounded-md font-mono text-sm border transition-colors ${
                      sort === opt.value
                        ? "bg-amber-500/20 text-amber-400 border-amber-500/50"
                        : "bg-slate-800/50 text-slate-400 border-slate-600 hover:border-slate-500"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="text-center py-12 text-slate-500">
            Loading opportunities...
          </div>
        )}

        {isError && (
          <div className="text-center py-12 text-red-400">
            Error: {error instanceof Error ? error.message : "Failed to load"}
          </div>
        )}

        {!isLoading && !isError && opportunities.length === 0 && (
          <div className="text-center py-12 text-slate-500 border border-slate-700/50 rounded-lg bg-slate-900/30">
            No +EV opportunities found right now. Check back later.
          </div>
        )}

        {!isLoading && !isError && opportunities.length > 0 && filtered.length === 0 && (
          <div className="text-center py-12 text-slate-500 border border-slate-700/50 rounded-lg bg-slate-900/30">
            No opportunities match the selected filters.
          </div>
        )}

        {!isLoading && !isError && filtered.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {filtered.map((opp) => (
              <EVCard key={opp.id} opportunity={opp} />
            ))}
          </div>
        )}

        <footer className="mt-12 pt-6 border-t border-slate-800 text-xs text-slate-600">
          <p>
            EV% = (Expected Value / Stake) × 100. Excellent: ≥5%, Good: 2-5%, Marginal: 0-2%.
          </p>
          <p className="mt-1">
            Odds API cached 5min. Polymarket refreshed every 60s. ~16 Odds API requests/day max.
          </p>
        </footer>
      </div>
    </div>
  );
}
