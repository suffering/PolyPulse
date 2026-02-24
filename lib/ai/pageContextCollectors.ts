import type { MatchedOpportunity } from "@/lib/matching";
import type {
  LeaderboardCategory,
  LeaderboardEntry,
  LeaderboardOrderBy,
  LeaderboardTimePeriod,
} from "@/lib/leaderboard";

export type EvPageState = {
  sport: string;
  timeframe: string;
  category: string;
  sort: string;
  displayed: MatchedOpportunity[];
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
    day: number;
    month: number;
    allTime: number;
    lastUpdated: string;
    volume24h?: number;
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
  const bets = state.displayed.map((opp) => ({
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
  }));

  const evs = state.displayed.map((o) => o.evPercent ?? null).filter((v): v is number => typeof v === "number");
  const avgEv = evs.length ? evs.reduce((a, b) => a + b, 0) / evs.length : null;

  const highest = [...state.displayed].sort((a, b) => (b.evPercent ?? -999) - (a.evPercent ?? -999))[0];
  const lowest = [...state.displayed].sort((a, b) => (a.evPercent ?? -999) - (b.evPercent ?? -999))[0];

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
    bets,
    highestEV: highest
      ? { market: highest.polymarketQuestion || highest.matchup, evPercent: highest.evPercent ?? null }
      : null,
    lowestEV: lowest
      ? { market: lowest.polymarketQuestion || lowest.matchup, evPercent: lowest.evPercent ?? null }
      : null,
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
      week: state.polymarket.day,
      month: state.polymarket.month,
      allTime: state.polymarket.allTime,
      volume24h: state.polymarket.volume24h ?? null,
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

export function getCurrentPageContext(pathname: string, pageState: any) {
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

