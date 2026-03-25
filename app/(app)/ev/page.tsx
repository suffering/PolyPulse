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

  return (
    <div className="min-h-screen bg-[#000000]">
      <main className="min-h-screen bg-[#000000] py-10 pl-[220px] flex flex-col items-center">
        <div className="w-full max-w-7xl mx-auto px-6">
        {/* Filter Section */}
        {!isLoading && !isError && (
          <div className="mb-8 space-y-6">
            {/* Sport Filter */}
            <div>
              <p className="text-gray-600 text-xs uppercase tracking-[0.15em] mb-3 font-medium text-center">Sport</p>
              <div className="flex gap-2 flex-wrap justify-center">
                {(["nba", "mls", "mlb", "nhl", "tennis"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setSport(s);
                      setLeague("all");
                      setCategory("all");
                      setTimeframe("all");
                    }}
                    className={`text-sm rounded-full px-5 py-2 transition-all duration-150 cursor-pointer active:scale-95 font-medium ${
                      sport === s
                        ? "bg-[#4B4BF7]/15 border border-[#4B4BF7]/50 text-[#4B4BF7] shadow-sm shadow-[#4B4BF7]/20"
                        : "bg-[#0d0d0d] border border-white/8 text-gray-500 hover:text-gray-200 hover:border-white/20 hover:bg-white/5"
                    }`}
                  >
                    {s === "mls" ? "Soccer" : s.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Timeframe Filter */}
            <div>
              <p className="text-gray-600 text-xs uppercase tracking-[0.15em] mb-3 font-medium text-center">Timeframe</p>
              <div className="flex gap-2 flex-wrap justify-center">
                {(["today", "week", "month", "futures", "all"] as const).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`text-sm rounded-full px-5 py-2 transition-all duration-150 cursor-pointer active:scale-95 font-medium ${
                      timeframe === tf
                        ? "bg-amber-500/15 border border-amber-500/50 text-amber-400 shadow-sm shadow-amber-500/20"
                        : "bg-[#0d0d0d] border border-white/8 text-gray-500 hover:text-gray-200 hover:border-white/20 hover:bg-white/5"
                    }`}
                  >
                    {getTimeframeLabel(tf)} ({timeframeCounts[tf]})
                  </button>
                ))}
              </div>
            </div>

            {/* Soccer League Filter */}
            {sport === "mls" && (
              <div>
                <p className="text-gray-600 text-xs uppercase tracking-[0.15em] mb-3 font-medium text-center">League</p>
                <div className="flex gap-2 flex-wrap justify-center">
                  {SOCCER_LEAGUES_UI.map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setSoccerLeague(key)}
                      className={`text-sm rounded-full px-5 py-2 transition-all duration-150 cursor-pointer active:scale-95 font-medium ${
                        soccerLeague === key
                          ? "bg-[#4B4BF7]/15 border border-[#4B4BF7]/50 text-[#4B4BF7] shadow-sm shadow-[#4B4BF7]/20"
                          : "bg-[#0d0d0d] border border-white/8 text-gray-500 hover:text-gray-200 hover:border-white/20 hover:bg-white/5"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sort Filter */}
            <div>
              <p className="text-gray-600 text-xs uppercase tracking-[0.15em] mb-3 font-medium text-center">Sort By</p>
              <div className="flex gap-2 flex-wrap justify-center">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSort(opt.value)}
                    className={`text-sm rounded-full px-5 py-2 transition-all duration-150 cursor-pointer active:scale-95 font-medium ${
                      sort === opt.value
                        ? "bg-[#4B4BF7]/15 border border-[#4B4BF7]/50 text-[#4B4BF7] shadow-sm shadow-[#4B4BF7]/20"
                        : "bg-[#0d0d0d] border border-white/8 text-gray-500 hover:text-gray-200 hover:border-white/20 hover:bg-white/5"
                    }`}
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
          <div className="grid grid-cols-2 gap-4 mb-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-[#0d0d0d] border border-white/5 rounded-2xl p-5 animate-pulse"
              >
                <div className="flex items-start justify-between mb-3">
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
          <div className="py-20 flex flex-col items-center justify-center">
            <AlertCircle className="w-12 h-12 text-red-500/50 mx-auto" />
            <p className="text-gray-500 text-base mt-4">Failed to load odds data</p>
            <p className="text-gray-700 text-sm mt-2">Check your Odds API key and try refreshing.</p>
            <button
              onClick={() => refetch()}
              className="bg-[#4B4BF7]/10 border border-[#4B4BF7]/30 text-[#4B4BF7] rounded-full px-6 py-2 text-sm hover:bg-[#4B4BF7]/20 active:scale-95 transition mt-6"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && opportunities.length === 0 && (
          <div className="py-20 flex flex-col items-center justify-center">
            <Inbox className="w-12 h-12 text-gray-700 mx-auto" />
            <p className="text-gray-500 text-base mt-4">No +EV opportunities found</p>
            <p className="text-gray-700 text-sm mt-2">
              Try selecting a different sport or timeframe.
            </p>
          </div>
        )}

        {/* No Filter Match State */}
        {!isLoading && !isError && opportunities.length > 0 && filtered.length === 0 && (
          <div className="py-20 flex flex-col items-center justify-center">
            <Inbox className="w-12 h-12 text-gray-700 mx-auto" />
            <p className="text-gray-500 text-base mt-4">No +EV opportunities found</p>
            <p className="text-gray-700 text-sm mt-2">
              Try selecting a different sport or timeframe.
            </p>
          </div>
        )}

        {/* Cards Grid */}
        {!isLoading && !isError && filtered.length > 0 && (
          <div className="w-full grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {filtered.map((opp) => (
              <EVCard key={opp.id} opportunity={opp} />
            ))}
          </div>
        )}
        </div>
      </main>

      {/* Floating Ask AI Button */}
      <button
        onClick={() => {
          // This will be handled by the UniversalAiAssistant in layout
        }}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full px-5 py-3 flex items-center gap-2 shadow-lg shadow-amber-500/30 hover:scale-110 hover:shadow-xl hover:shadow-amber-500/50 active:scale-95 transition-all duration-200 group"
      >
        <Sparkles className="w-4 h-4 text-black" />
        <span className="text-sm font-semibold text-black">Ask AI</span>
        <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-pulse group-hover:animate-none" />
      </button>
    </div>
  );
}
