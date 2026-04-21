"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { EVCard } from "@/components/EVCard";
import type { MatchedOpportunity } from "@/lib/matching";
import type { Timeframe, MarketCategory } from "@/lib/types";
import { getTimeframeLabel } from "@/lib/types";
import { useSetPageAiState } from "@/components/ai/PageAiContext";
import { Inbox, AlertCircle, Sparkles } from "lucide-react";

type UiSport = "nba" | "mls" | "mlb" | "nhl" | "tennis";

type SoccerLeagueKey =
  | "mls"
  | "epl"
  | "laliga"
  | "ligue1"
  | "seriea"
  | "bundesliga";

const SOCCER_LEAGUES_UI: { key: SoccerLeagueKey; label: string }[] = [
  { key: "mls", label: "MLS" },
  { key: "epl", label: "Premier League" },
  { key: "laliga", label: "La Liga" },
  { key: "ligue1", label: "Ligue 1" },
  { key: "seriea", label: "Serie A" },
  { key: "bundesliga", label: "Bundesliga" },
];

async function fetchEV(
  sport: UiSport,
  league?: SoccerLeagueKey,
  refreshOdds?: boolean
) {
  const base =
    sport === "mls"
      ? `/api/ev?sport=${sport}&league=${league ?? "mls"}`
      : `/api/ev?sport=${sport}`;
  const url = refreshOdds ? `${base}&refresh_odds=1` : base;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

type SortOption = "highest_ev" | "lowest_ev";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "highest_ev", label: "Highest EV" },
  { value: "lowest_ev", label: "Lowest EV" },
];

function sortOpportunities(opps: MatchedOpportunity[], sort: SortOption): MatchedOpportunity[] {
  // An opportunity has a real EV value only when we have sportsbook odds to compare against Polymarket.
  const hasRealEv = (o: MatchedOpportunity) =>
    o.sportsbookName != null &&
    o.sportsbookOdds != null &&
    typeof o.evPercent === "number" &&
    Number.isFinite(o.evPercent);

  const withEv = opps.filter(hasRealEv);
  const withoutEv = opps.filter((o) => !hasRealEv(o));

  if (sort === "highest_ev") {
    // Highest positive EV first, then descending.
    withEv.sort((a, b) => (b.evPercent as number) - (a.evPercent as number));
  } else {
    // Lowest (most negative) EV first, ascending.
    withEv.sort((a, b) => (a.evPercent as number) - (b.evPercent as number));
  }

  // Cards without a comparable sportsbook (no real EV) always fall to the end,
  // regardless of sort direction, so sorting feels predictable.
  return [...withEv, ...withoutEv];
}

function pillClass(active: boolean) {
  return `text-[13px] rounded-full px-4 py-1.5 transition-all duration-150 cursor-pointer active:scale-95 font-medium ${
    active
      ? "bg-white text-[#04040a] border border-white"
      : "bg-transparent border border-white/10 text-white/55 hover:text-white hover:border-white/25"
  }`;
}

export default function Home() {
  const [sport, setSport] = useState<UiSport>("nba");
  const [timeframe, setTimeframe] = useState<Timeframe>("all");
  const [category, setCategory] = useState<MarketCategory | "all">("all");
  const [league, setLeague] = useState<string | "all">("all");
  const [soccerLeague, setSoccerLeague] = useState<SoccerLeagueKey>("mls");
  const [sort, setSort] = useState<SortOption>("highest_ev");
  const queryClient = useQueryClient();
  const setPageAiState = useSetPageAiState();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["ev", sport, sport === "mls" ? soccerLeague : undefined],
    queryFn: () => fetchEV(sport, sport === "mls" ? soccerLeague : undefined),
    refetchInterval: 10 * 60 * 1000,
  });

  const opportunities: MatchedOpportunity[] = data?.opportunities ?? [];
  const quotaRemaining = data?.quotaRemaining ?? null;

  const { filtered, timeframeCounts } = useMemo(() => {
    const opps: MatchedOpportunity[] = data?.opportunities ?? [];
    const tfCounts: Record<Timeframe, number> = {
      today: 0,
      week: 0,
      month: 0,
      futures: 0,
      all: 0,
    };
    const lgCounts: Record<string, number> = {};

    for (const opp of opps) {
      const isFuturesOutright =
        opp.timeframe === "futures" && opp.category !== "games" && opp.marketType !== "game";
      if (opp.timeframe === "futures") {
        if (isFuturesOutright) tfCounts.futures++;
      } else {
        tfCounts[opp.timeframe]++;
      }
      tfCounts.all++;
      if (opp.league) lgCounts[opp.league] = (lgCounts[opp.league] ?? 0) + 1;
    }

    let filtered = opps.filter((opp) => {
      const tfMatch =
        timeframe === "all"
          ? true
          : timeframe === "futures"
            ? opp.timeframe === "futures" &&
              opp.category !== "games" &&
              opp.marketType !== "game"
            : opp.timeframe === timeframe;
      const catMatch = category === "all" || opp.category === category;
      const leagueMatch =
        sport === "nba" || sport === "mlb" || sport === "nhl" || sport === "tennis"
          ? league === "all" || opp.league === league
          : true;
      return tfMatch && catMatch && leagueMatch;
    });

    filtered = sortOpportunities(filtered, sort);

    return { filtered, timeframeCounts: tfCounts };
  }, [data?.opportunities, timeframe, category, league, sort, sport]);

  useEffect(() => {
    setPageAiState({
      kind: "ev",
      state: {
        sport,
        timeframe,
        category,
        sort,
        displayed: filtered,
        quotaRemaining,
        oddsLastUpdated: data?.oddsLastUpdated ?? null,
      },
    });
  }, [
    setPageAiState,
    sport,
    timeframe,
    category,
    sort,
    filtered,
    quotaRemaining,
    data?.oddsLastUpdated,
  ]);

  // Find the highest EV% in the filtered set to highlight the top card with a subtle glow
  const topEv = useMemo(() => {
    if (!filtered.length) return null;
    const top = filtered.reduce<MatchedOpportunity | null>((best, opp) => {
      const ev = opp.evPercent ?? -999;
      if (!best) return opp;
      return ev > (best.evPercent ?? -999) ? opp : best;
    }, null);
    return top?.id ?? null;
  }, [filtered]);

  return (
    <div className="min-h-screen bg-[#04040a]">
      <main className="min-h-screen py-10 pl-[220px] flex flex-col items-center">
        <div className="w-full max-w-7xl mx-auto px-6">
          {/* Page Header */}
          <header className="mb-10">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1 h-6 bg-[#4B4BF7] rounded-full" />
              <h1 className="text-2xl font-bold tracking-tight text-white">
                +EV Engine
              </h1>
            </div>
            <div className="flex items-center gap-2 pl-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-pulse inline-block" />
              <span className="text-xs text-white/40 font-mono">
                Live · scanning sportsbook vs polymarket edges
              </span>
            </div>
          </header>

          {/* Filter Section */}
          {!isLoading && !isError && (
            <div className="mb-10 space-y-6">
              {/* Sport Filter */}
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/30 mb-3 font-medium">
                  Sport
                </p>
                <div className="flex gap-2 flex-wrap">
                  {(["nba", "mls", "mlb", "nhl", "tennis"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setSport(s);
                        setLeague("all");
                        setCategory("all");
                        setTimeframe("all");
                      }}
                      className={pillClass(sport === s)}
                    >
                      {s === "mls" ? "Soccer" : s.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Timeframe Filter */}
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/30 mb-3 font-medium">
                  Timeframe
                </p>
                <div className="flex gap-2 flex-wrap">
                  {(["today", "week", "month", "futures", "all"] as const).map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      className={pillClass(timeframe === tf)}
                    >
                      <span>{getTimeframeLabel(tf)}</span>
                      <span className="ml-1.5 font-mono text-xs opacity-70">
                        ({timeframeCounts[tf]})
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Soccer League Filter */}
              {sport === "mls" && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/30 mb-3 font-medium">
                    League
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {SOCCER_LEAGUES_UI.map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => setSoccerLeague(key)}
                        className={pillClass(soccerLeague === key)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sort Filter */}
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/30 mb-3 font-medium">
                  Sort By
                </p>
                <div className="flex gap-2 flex-wrap">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSort(opt.value)}
                      className={pillClass(sort === opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-[#0e0e1a] border border-white/5 rounded-2xl p-6 animate-pulse"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-6 w-16 bg-white/5 rounded-full" />
                    <div className="h-6 w-24 bg-white/5 rounded-full" />
                  </div>
                  <div className="h-5 w-full bg-white/5 rounded mb-4" />
                  <div className="border-t border-white/5 my-4" />
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="h-4 w-20 bg-white/5 rounded mb-2" />
                      <div className="h-6 w-24 bg-white/5 rounded" />
                    </div>
                    <div>
                      <div className="h-4 w-20 bg-white/5 rounded mb-2" />
                      <div className="h-6 w-24 bg-white/5 rounded" />
                    </div>
                  </div>
                  <div className="border-t border-white/5 my-4" />
                  <div className="h-4 w-full bg-white/5 rounded mb-2" />
                  <div className="h-4 w-full bg-white/5 rounded mb-4" />
                  <div className="h-10 w-full bg-white/5 rounded-xl" />
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {isError && (
            <div className="py-20 flex flex-col items-center justify-center bg-[#0e0e1a] border border-white/10 rounded-2xl">
              <AlertCircle className="w-12 h-12 text-red-500/60 mx-auto" />
              <p className="text-white/60 text-base mt-4">Failed to load odds data</p>
              <p className="text-white/30 text-sm mt-2">Check your Odds API key and try refreshing.</p>
              <button
                onClick={() => refetch()}
                className="bg-[#4B4BF7]/15 border border-[#4B4BF7]/40 text-[#4B4BF7] rounded-full px-6 py-2 text-sm hover:bg-[#4B4BF7]/25 hover:border-[#4B4BF7]/60 active:scale-95 transition mt-6"
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !isError && opportunities.length === 0 && (
            <div className="py-20 flex flex-col items-center justify-center bg-[#0e0e1a] border border-white/10 rounded-2xl">
              <Inbox className="w-12 h-12 text-white/20 mx-auto" />
              <p className="text-white/60 text-base mt-4">No +EV opportunities found</p>
              <p className="text-white/30 text-sm mt-2">
                Try selecting a different sport or timeframe.
              </p>
            </div>
          )}

          {/* No Filter Match State */}
          {!isLoading && !isError && opportunities.length > 0 && filtered.length === 0 && (
            <div className="py-20 flex flex-col items-center justify-center bg-[#0e0e1a] border border-white/10 rounded-2xl">
              <Inbox className="w-12 h-12 text-white/20 mx-auto" />
              <p className="text-white/60 text-base mt-4">No +EV opportunities found</p>
              <p className="text-white/30 text-sm mt-2">
                Try selecting a different sport or timeframe.
              </p>
            </div>
          )}

          {/* Cards Grid */}
          {!isLoading && !isError && filtered.length > 0 && (
            <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
              {filtered.map((opp) => (
                <EVCard
                  key={opp.id}
                  opportunity={opp}
                  isTopEv={opp.id === topEv && (opp.evPercent ?? 0) > 0}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Floating Ask AI Button */}
      <button
        onClick={() => {
          // Handled by the UniversalAiAssistant in layout
        }}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-[#4B4BF7] to-[#7B4BF7] rounded-full px-5 py-3 flex items-center gap-2 shadow-lg shadow-[#4B4BF7]/40 hover:scale-105 hover:shadow-xl hover:shadow-[#4B4BF7]/60 active:scale-95 transition-all duration-200 group"
      >
        <Sparkles className="w-4 h-4 text-white" />
        <span className="text-sm font-semibold text-white">Ask AI</span>
        <div className="absolute inset-0 rounded-full bg-[#4B4BF7]/20 animate-pulse group-hover:animate-none pointer-events-none" />
      </button>
    </div>
  );
}
