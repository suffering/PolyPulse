import type { MatchedOpportunity } from "@/lib/matching";
import type {
  LeaderboardCategory,
  LeaderboardEntry,
  LeaderboardOrderBy,
  LeaderboardTimePeriod,
} from "@/lib/leaderboard";
import {
  detectSportsFromMessage,
  opportunitySportToKey,
  type EvSportKey,
} from "@/lib/ai/evSportDetection";

function toAIBetSummary(opp: MatchedOpportunity) {
  return {
    market: opp.polymarketQuestion || opp.matchup,
    polymarket: {
      probability: opp.polymarketImpliedProb,
      price: opp.polymarketPrice,
      url: opp.polymarketUrl,
    },
    sportsbook: { name: opp.sportsbookName ?? null, odds: opp.sportsbookOdds ?? null },
    evPercent: opp.evPercent ?? null,
    expectedProfitOn100: opp.expectedProfit100 ?? null,
    profitIfWinOn100: opp.profitIfWin100 ?? null,
    timeframe: opp.timeframe,
    category: opp.category,
  };
}

export type EvPageState = {
  sport: string;
  timeframe: string;
  category: string;
  sort: string;
  /** Opportunities currently shown (after filters) */
  displayed: MatchedOpportunity[];
  /** Full list for the current sport before filters */
  allForCurrentSport: MatchedOpportunity[];
  quotaRemaining: number | null;
  oddsLastUpdated: string | null;
};

export type LeaderboardPageState = {
  category: LeaderboardCategory;
  timePeriod: LeaderboardTimePeriod;
  orderBy: LeaderboardOrderBy;
  sortColumn: string;
  sortDirection: "asc" | "desc";
  topThree: LeaderboardEntry[];
  tableRows: LeaderboardEntry[];
  lastUpdated: string | null;
};

export type VolumePageState = {
  polymarket: {
    volume24h?: number;
    week?: number;
    month: number;
    allTime: number;
    lastUpdated: string;
  };
};

export type LiveFeedTrade = {
  timestamp: number;
  title: string;
  side: "BUY" | "SELL";
  outcome: string;
  price: number;
  size: number;
  dollarValue: number;
  proxyWallet: string;
};

export type LiveFeedPageState = {
  lastTrades: LiveFeedTrade[];
  totalReceived: number;
};

export type ExtraDataPageState = {
  searchQuery: string;
  page: number;
  totalPages: number;
  eventsVisible: Array<{ id: string; title?: string | null; liquidity?: unknown; volume?: unknown }>;
  marketsVisible: Array<{ id: string; question?: string | null; groupItemTitle?: string | null; liquidityNum?: number; volumeNum?: number }>;
  totalFilteredEvents: number;
  totalFilteredMarkets: number;
  hasMore: boolean;
};

export function collectEVPageContext(state: EvPageState) {
  const allOpps = state.allForCurrentSport ?? state.displayed;
  const countsByTimeframe: Record<string, number> = {};
  const countsByCategory: Record<string, number> = {};
  for (const opp of allOpps) {
    const tf = opp.timeframe ?? "all";
    countsByTimeframe[tf] = (countsByTimeframe[tf] ?? 0) + 1;
    const cat = opp.category ?? "other";
    countsByCategory[cat] = (countsByCategory[cat] ?? 0) + 1;
  }

  const betsDisplayed = state.displayed.map((opp) => ({
    market: opp.polymarketQuestion || opp.matchup,
    polymarket: {
      probability: opp.polymarketImpliedProb,
      price: opp.polymarketPrice,
      url: opp.polymarketUrl,
    },
    sportsbook: {
      name: opp.sportsbookName ?? null,
      odds: opp.sportsbookOdds ?? null,
    },
    evPercent: opp.evPercent ?? null,
    expectedProfitOn100: opp.expectedProfit100 ?? null,
    profitIfWinOn100: opp.profitIfWin100 ?? null,
    timeframe: opp.timeframe,
    category: opp.category,
  }));

  const betsAllForSport = allOpps.map((opp) => ({
    market: opp.polymarketQuestion || opp.matchup,
    timeframe: opp.timeframe,
    category: opp.category,
    evPercent: opp.evPercent ?? null,
  }));

  const evsAll = allOpps.map((o) => o.evPercent ?? null).filter((v): v is number => typeof v === "number");
  const avgEvAll = evsAll.length ? evsAll.reduce((a, b) => a + b, 0) / evsAll.length : null;
  const highestAll = [...allOpps].sort((a, b) => (b.evPercent ?? -999) - (a.evPercent ?? -999))[0];
  const lowestAll = [...allOpps].sort((a, b) => (a.evPercent ?? -999) - (b.evPercent ?? -999))[0];
  return {
    dataCollectedAt: new Date().toISOString(),
    page: "ev",
    filters: {
      sport: state.sport,
      timeframe: state.timeframe,
      category: state.category,
      sort: state.sort,
    },
    totalDisplayed: state.displayed.length,
    bets: betsDisplayed,
    allForCurrentSport: betsAllForSport,
    highestEV: highestAll
      ? { market: highestAll.polymarketQuestion || highestAll.matchup, evPercent: highestAll.evPercent ?? null }
      : null,
    lowestEV: lowestAll
      ? { market: lowestAll.polymarketQuestion || lowestAll.matchup, evPercent: lowestAll.evPercent ?? null }
      : null,
    averageEVPercent: avgEvAll,
    lastUpdated: state.oddsLastUpdated,
    apiRequestsRemaining: state.quotaRemaining,
  };
}

/**
 * Build EV context for the AI using sport detection on the user's message.
 * Injects only relevant sport(s) data to stay within context limits; if no sport detected, injects summary only.
 */
export function buildEVContextForMessage(state: EvPageState, userMessage: string): ReturnType<typeof collectEVPageContext> {
  const fullDataset = state.allEVDataForAI && state.allEVDataForAI.length > 0
    ? state.allEVDataForAI
    : (state.allForCurrentSport ?? state.displayed);

  const detected = detectSportsFromMessage(userMessage, fullDataset);

  if (detected.length === 0) {
    const summaryPerSport: { sport: string; count: number; topEVPercent: number | null; sampleMarket: string | null }[] = [];
    const seenKeys = new Set<EvSportKey>();
    for (const opp of fullDataset) {
      const key = opportunitySportToKey(opp.sport);
      if (!key || seenKeys.has(key)) continue;
      seenKeys.add(key);
      const sportOpps = fullDataset.filter((o) => opportunitySportToKey(o.sport) === key);
      const withEv = sportOpps.filter((o) => o.evPercent != null);
      const top = withEv.length ? Math.max(...withEv.map((o) => o.evPercent ?? 0)) : null;
      const sample = sportOpps[0] ? (sportOpps[0].polymarketQuestion || sportOpps[0].matchup) : null;
      summaryPerSport.push({
        sport: SPORT_LABELS[key],
        count: sportOpps.length,
        topEVPercent: top,
        sampleMarket: sample,
      });
    }
    for (const k of SPORT_KEYS) {
      if (seenKeys.has(k)) continue;
      summaryPerSport.push({ sport: SPORT_LABELS[k], count: 0, topEVPercent: null, sampleMarket: null });
    }

    return {
      dataCollectedAt: new Date().toISOString(),
      page: "ev",
      summaryOnly: true,
      note: "No specific sport was detected in the user's question. You have only a per-sport summary below. Respond with this summary and ask the user which sport they want details for (e.g. NBA, Soccer, MLB, NHL, Tennis).",
      currentFilters: { sport: state.sport, timeframe: state.timeframe, category: state.category, sort: state.sort },
      totalDisplayed: state.displayed.length,
      summaryPerSport,
      lastUpdated: state.oddsLastUpdated,
      apiRequestsRemaining: state.quotaRemaining,
    };
  }

  const filtered = fullDataset.filter((opp) => {
    const key = opportunitySportToKey(opp.sport);
    return key != null && detected.includes(key);
  });

  const countsBySport: Record<string, number> = {};
  const countsByTimeframe: Record<string, number> = {};
  const countsByCategory: Record<string, number> = {};
  for (const opp of filtered) {
    const s = opp.sport ?? "unknown";
    countsBySport[s] = (countsBySport[s] ?? 0) + 1;
    const tf = opp.timeframe ?? "all";
    countsByTimeframe[tf] = (countsByTimeframe[tf] ?? 0) + 1;
    const cat = opp.category ?? "other";
    countsByCategory[cat] = (countsByCategory[cat] ?? 0) + 1;
  }

  const bets = filtered.map(toAIBetSummary);
  const evs = filtered.map((o) => o.evPercent ?? null).filter((v): v is number => typeof v === "number");
  const avgEv = evs.length ? evs.reduce((a, b) => a + b, 0) / evs.length : null;
  const highest = [...filtered].sort((a, b) => (b.evPercent ?? -999) - (a.evPercent ?? -999))[0];
  const lowest = [...filtered].sort((a, b) => (a.evPercent ?? -999) - (b.evPercent ?? -999))[0];

  const detectedLabels = detected.map((k) => SPORT_LABELS[k]).join(", ");

  return {
    dataCollectedAt: new Date().toISOString(),
    page: "ev",
    note: `User question matched sport(s): ${detectedLabels}. Data below is limited to these sports only. Answer using this dataset.`,
    currentFilters: { sport: state.sport, timeframe: state.timeframe, category: state.category, sort: state.sort },
    totalDisplayed: state.displayed.length,
    totalInFullDataset: filtered.length,
    countsBySport,
    countsByTimeframe,
    countsByCategory,
    fullDataset: bets,
    highestEV: highest ? toAIBetSummary(highest) : null,
    lowestEV: lowest ? toAIBetSummary(lowest) : null,
    averageEVPercent: avgEv,
    lastUpdated: state.oddsLastUpdated,
    apiRequestsRemaining: state.quotaRemaining,

  };
}

export function collectLeaderboardContext(state: LeaderboardPageState) {
  const allVisible = [...state.topThree, ...state.tableRows];

  const highestPnl = allVisible.reduce<LeaderboardEntry | null>((best, cur) => {
    if (!best) return cur;
    return cur.pnl > best.pnl ? cur : best;
  }, null);

  const highestVol = allVisible.reduce<LeaderboardEntry | null>((best, cur) => {
    if (!best) return cur;
    return cur.vol > best.vol ? cur : best;
  }, null);

  return {
    dataCollectedAt: new Date().toISOString(),
    page: "leaderboard",
    filters: {
      category: state.category,
      timePeriod: state.timePeriod,
      sort: state.orderBy,
      tableSort: {
        column: state.sortColumn,
        direction: state.sortDirection,
      },
    },
    top3: state.topThree.map((e) => ({
      rank: e.rank,
      name: e.userName ?? e.proxyWallet,
      pnl: e.pnl,
      volume: e.vol,
      totalTrades: e.totalTrades ?? null,
      wallet: e.proxyWallet,
    })),
    table: state.tableRows.map((e) => ({
      rank: e.rank,
      name: e.userName ?? e.proxyWallet,
      pnl: e.pnl,
      volume: e.vol,
      wallet: e.proxyWallet,
    })),
    totalTradersDisplayed: allVisible.length,
    highestPnlTrader: highestPnl
      ? { name: highestPnl.userName ?? highestPnl.proxyWallet, pnl: highestPnl.pnl }
      : null,
    highestVolumeTrader: highestVol
      ? { name: highestVol.userName ?? highestVol.proxyWallet, volume: highestVol.vol }
      : null,
    lastUpdated: state.lastUpdated,
  };
}

export function collectVolumePageContext(state: VolumePageState) {
  return {
    dataCollectedAt: new Date().toISOString(),
    page: "volume",
    exchange: "Polymarket",
    volume: {
      volume24h: state.polymarket.volume24h ?? null,
      week: state.polymarket.week ?? null,
      month: state.polymarket.month,
      allTime: state.polymarket.allTime,
    },
    lastUpdated: state.polymarket.lastUpdated,
  };
}

export function collectLiveFeedContext(state: LiveFeedPageState) {
  const trades = state.lastTrades.slice(0, 100);
  const nowSec = Math.floor(Date.now() / 1000);
  const last60 = trades.filter((t) => t.timestamp >= nowSec - 60);

  const tradesPerMinute = last60.length;
  const volumeLast60s = last60.reduce((sum, t) => sum + (t.dollarValue || 0), 0);

  const byMarket = new Map<string, number>();
  const byTrader = new Map<string, number>();
  let yesCount = 0;
  let noCount = 0;
  let biggest: LiveFeedTrade | null = null;

  for (const t of trades) {
    byMarket.set(t.title, (byMarket.get(t.title) ?? 0) + 1);
    byTrader.set(t.proxyWallet, (byTrader.get(t.proxyWallet) ?? 0) + 1);
    const outcomeUpper = (t.outcome || "").toUpperCase();
    if (outcomeUpper === "YES") yesCount++;
    if (outcomeUpper === "NO") noCount++;
    if (!biggest || (t.dollarValue ?? 0) > (biggest.dollarValue ?? 0)) biggest = t;
  }

  const mostActiveMarket =
    Array.from(byMarket.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const mostActiveTrader =
    Array.from(byTrader.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  return {
    dataCollectedAt: new Date().toISOString(),
    page: "live",
    lastTrades: trades.map((t) => ({
      market: t.title,
      side: t.side,
      outcome: t.outcome,
      price: t.price,
      shares: t.size,
      dollarValue: t.dollarValue,
      trader: t.proxyWallet,
      timestamp: t.timestamp,
    })),
    totalTradesReceivedThisSession: state.totalReceived,
    tradesPerMinuteLast60s: tradesPerMinute,
    totalVolumeLast60s: volumeLast60s,
    mostActiveMarket,
    biggestSingleTrade: biggest
      ? { market: biggest.title, dollarValue: biggest.dollarValue, trader: biggest.proxyWallet }
      : null,
    mostCommonOutcome: { yesCount, noCount },
    mostActiveTrader,
  };
}

export function collectExtraDataContext(state: ExtraDataPageState) {
  return {
    dataCollectedAt: new Date().toISOString(),
    page: "extra",
    searchQuery: state.searchQuery,
    pagination: {
      page: state.page,
      totalPages: state.totalPages,
    },
    totals: {
      events: state.totalFilteredEvents,
      markets: state.totalFilteredMarkets,
    },
    visibleEvents: state.eventsVisible.map((e) => ({
      id: e.id,
      title: e.title ?? null,
    })),
    visibleMarkets: state.marketsVisible.map((m) => ({
      id: m.id,
      question: m.question ?? m.groupItemTitle ?? null,
      openInterest: m.liquidityNum ?? null,
      notionalVolume: m.volumeNum ?? null,
    })),
    hasMoreToLoad: state.hasMore,
  };
}

export function getCurrentPageContext(
  pathname: string,
  pageState: EvPageState | LeaderboardPageState | VolumePageState | LiveFeedPageState | ExtraDataPageState
) {
  if (pathname === "/" || pathname.includes("ev")) {
    return collectEVPageContext(pageState as EvPageState);
  }
  if (pathname.includes("leaderboard")) {
    return collectLeaderboardContext(pageState as LeaderboardPageState);
  }
  if (pathname.includes("volume")) {
    return collectVolumePageContext(pageState as VolumePageState);
  }
  if (pathname.includes("live")) {
    return collectLiveFeedContext(pageState as LiveFeedPageState);
  }
  if (pathname.includes("extra")) {
    return collectExtraDataContext(pageState as ExtraDataPageState);
  }
  // search/portfolio handled by trader context builder
  return {
    dataCollectedAt: new Date().toISOString(),
    page: "unknown",
    note: "No page context available for this route.",
  };
}

