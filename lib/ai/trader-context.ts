import type {
  PortfolioProfile,
  PortfolioStats,
  PortfolioPnLResponse,
  TradeItem,
} from "@/lib/portfolio";
import type { ClosedPosition, OpenPosition } from "@/lib/leaderboard";
import type { TimeRange } from "@/lib/trader-stats";

// High-level shape sent to OpenAI as JSON context
export interface TraderContext {
  walletAddress: string;
  mode: "active" | "closed";
  dataCollectedAt: string;
  profile: {
    walletAddress: string;
    displayName: string | null;
    profileImage: string | null;
    xUsername: string | null;
    bio: string | null;
    joinDate?: string | null;
    totalViews?: number | null;
  };
  statistics: {
    tradingVolume: number | null;
    portfolioValue: number | null;
    marketsTraded: number | null;
    totalPnl: number | null;
    openInterest: number | null;
    winRatePercent: number | null;
    winRateWins: number | null;
    winRateTotal: number | null;
    biggestSingleWinUsd: number | null;
    biggestSingleWinMarket: string | null;
  };
  pnlOverTime: {
    "1D": number | null;
    "1W": number | null;
    "1M": number | null;
    "MAX": number | null;
    trendDirection: "improving" | "declining" | "flat" | "unknown";
    activeRange: TimeRange;
  };
  activeOpenPositions: Array<{
    market: string;
    outcome: string;
    side: "YES" | "NO" | "OTHER";
    avgEntryPriceCents: number;
    currentPriceCents: number;
    shares: number;
    currentValueUsd: number;
    unrealizedPnlUsd: number;
    unrealizedPnlPercent: number | null;
    profitable: boolean | null;
  }>;
  tradeHistorySummary: {
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    biggestWinUsd: number | null;
    biggestWinMarket: string | null;
    biggestLossUsd: number | null;
    biggestLossMarket: string | null;
    averageProfitPerWinUsd: number | null;
    averageLossPerLossUsd: number | null;
    mostCommonCategories: string[];
    yesNoRatio: {
      yesCount: number;
      noCount: number;
    };
    lastClosedTrades: Array<{
      market: string;
      side: "BUY" | "SELL";
      outcome: string | null;
      entryPriceCents: number | null;
      exitPriceCents: number | null;
      realizedPnlUsd: number | null;
    }>;
  };
  closedPositions: Array<{
    market: string;
    side: "BUY" | "SELL";
    outcome: string | null;
    realizedPnlUsd: number | null;
  }>;
  leaderboard?: {
    rank: number | null;
    top10Comparison?: {
      pnlVsTop10: string | null;
      winRateVsTop10: string | null;
    };
  };
  liveMarketData?: {
    matchingOpenPositions: string[];
  };
}

export interface CollectTraderContextInput {
  walletAddress: string;
  profile: PortfolioProfile | null | undefined;
  stats: PortfolioStats | null | undefined;
  pnl: PortfolioPnLResponse | null | undefined;
  timeRange: TimeRange;
  openPositions: OpenPosition[];
  trades: TradeItem[];
  leaderboardRank?: number | null;
  closedPositions?: ClosedPosition[];
  mode?: "active" | "closed";
  dataCollectedAt?: string;
}

function safeNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function collectTraderContext(input: CollectTraderContextInput): TraderContext {
  const {
    walletAddress,
    profile,
    stats,
    pnl,
    timeRange,
    openPositions,
    trades,
    leaderboardRank,
    closedPositions = [],
    mode = "active",
    dataCollectedAt,
  } = input;

  const contextMode: "active" | "closed" =
    mode === "closed" ? "closed" : "active";
  const collectedAt =
    dataCollectedAt && typeof dataCollectedAt === "string"
      ? dataCollectedAt
      : new Date().toISOString();

  const displayName =
    profile?.displayUsernamePublic ?? profile?.name ?? profile?.pseudonym ?? null;

  const totalPnlAllTime = stats?.totalPnl ?? null;
  const activeRangePnl = pnl?.summaryPnl ?? null;

  let trendDirection: TraderContext["pnlOverTime"]["trendDirection"] = "unknown";
  if (activeRangePnl !== null && totalPnlAllTime !== null) {
    if (Math.abs(activeRangePnl) < 1e-6) {
      trendDirection = "flat";
    } else if (activeRangePnl >= 0 && totalPnlAllTime >= 0) {
      trendDirection = "improving";
    } else if (activeRangePnl < 0 && totalPnlAllTime > 0) {
      trendDirection = "declining";
    }
  }

  // Filter to truly active open positions (exclude resolved / expired / $0 or $1 markets)
  const nowMs = Date.now();
  const trueOpenPositions = openPositions.filter((p) => {
    const curPrice = Number(p.curPrice ?? 0);
    const currentValue = Number(p.currentValue ?? p.size * p.curPrice ?? 0);

    const anyP = p as any;
    const endDateRaw =
      anyP?.endDate ||
      anyP?.closeTime ||
      anyP?.expiryDate ||
      anyP?.resolutionDate ||
      anyP?.end_date ||
      anyP?.close_date;
    const isNotExpired =
      !endDateRaw || Number.isNaN(Date.parse(endDateRaw))
        ? true
        : new Date(endDateRaw).getTime() > nowMs;

    const resolvedFlag = Boolean(anyP?.resolved) || Boolean(anyP?.closed);
    const hasWinner =
      anyP?.winner !== undefined && anyP?.winner !== null ? true : false;
    const isNotResolved = !resolvedFlag && !hasWinner;

    const isActivePrice = curPrice > 0.01 && curPrice < 0.99;

    return isActivePrice && currentValue > 0 && isNotExpired && isNotResolved;
  });

  const openPositionsMapped = trueOpenPositions.map((p) => {
    const avgPriceCents = (p.avgPrice ?? 0) * 100;
    const curPriceCents = (p.curPrice ?? 0) * 100;
    const shares = p.size ?? 0;
    const currentValue = p.currentValue ?? p.size * p.curPrice ?? 0;
    const unrealized = p.cashPnl ?? 0;
    const percent =
      p.percentPnl !== undefined && p.percentPnl !== null
        ? Number(p.percentPnl)
        : null;

    const profitable =
      percent !== null ? percent > 0 : unrealized !== 0 ? unrealized > 0 : null;

    const normalizedOutcome = (p.outcome || "").toUpperCase();
    const side: "YES" | "NO" | "OTHER" =
      normalizedOutcome === "YES"
        ? "YES"
        : normalizedOutcome === "NO"
          ? "NO"
          : "OTHER";

    return {
      market: p.title || "",
      outcome: p.outcome || "",
      side,
      avgEntryPriceCents: avgPriceCents,
      currentPriceCents: curPriceCents,
      shares,
      currentValueUsd: currentValue,
      unrealizedPnlUsd: unrealized,
      unrealizedPnlPercent: percent,
      profitable,
    };
  });

  // Trade history statistics – best-effort based on /activity payload
  let winningTrades = 0;
  let losingTrades = 0;
  let sumWin = 0;
  let sumLoss = 0;
  let biggestWin = { pnl: -Infinity, market: null as string | null };
  let biggestLoss = { pnl: Infinity, market: null as string | null };
  let yesCount = 0;
  let noCount = 0;

  const lastClosedTrades: TraderContext["tradeHistorySummary"]["lastClosedTrades"] =
    [];

  for (const t of trades.slice(0, 50)) {
    const pnlUsd =
      safeNumber(
        (t as any).realizedPnlUsd ??
          (t as any).realizedPnlUSD ??
          (t as any).realizedPnl ??
          (t as any).pnlUsd ??
          (t as any).pnlUSD ??
          (t as any).pnl,
      ) ?? 0;

    if (pnlUsd > 0) {
      winningTrades += 1;
      sumWin += pnlUsd;
      if (pnlUsd > biggestWin.pnl) {
        biggestWin = { pnl: pnlUsd, market: String(t.title ?? "") || null };
      }
    } else if (pnlUsd < 0) {
      losingTrades += 1;
      sumLoss += pnlUsd;
      if (pnlUsd < biggestLoss.pnl) {
        biggestLoss = { pnl: pnlUsd, market: String(t.title ?? "") || null };
      }
    }

    const sideStr = String(t.side ?? "").toUpperCase();
    if (sideStr === "BUY" || sideStr === "YES") yesCount += 1;
    if (sideStr === "SELL" || sideStr === "NO") noCount += 1;

    lastClosedTrades.push({
      market: String(t.title ?? ""),
      side: sideStr === "SELL" ? "SELL" : "BUY",
      outcome: typeof t.outcome === "string" ? t.outcome : null,
      entryPriceCents: safeNumber((t as any).entryPrice)?.valueOf() ?? null,
      exitPriceCents: safeNumber((t as any).exitPrice)?.valueOf() ?? null,
      realizedPnlUsd: pnlUsd || null,
    });
  }

  const averageProfitPerWin =
    winningTrades > 0 ? sumWin / winningTrades : null;
  const averageLossPerLoss =
    losingTrades > 0 ? sumLoss / losingTrades : null;

  // Closed positions mapped from trades best-effort for closed-intent analysis
  const closedPositionsMapped: TraderContext["closedPositions"] = trades
    .slice(0, 200)
    .map((t) => {
      const sideStr = String(t.side ?? "").toUpperCase();
      const pnlUsd =
        safeNumber(
          (t as any).realizedPnlUsd ??
            (t as any).realizedPnlUSD ??
            (t as any).realizedPnl ??
            (t as any).pnlUsd ??
            (t as any).pnlUSD ??
            (t as any).pnl,
        ) ?? null;

      return {
        market: String(t.title ?? ""),
        side: sideStr === "SELL" ? "SELL" : "BUY",
        outcome: typeof t.outcome === "string" ? t.outcome : null,
        realizedPnlUsd: pnlUsd,
      };
    });

  const context: TraderContext = {
    walletAddress,
    mode: contextMode,
    dataCollectedAt: collectedAt,
    profile: {
      walletAddress,
      displayName,
      profileImage: profile?.profileImage ?? null,
      xUsername: profile?.xUsername ?? null,
      bio: profile?.bio ?? null,
      joinDate: null,
      totalViews: null,
    },
    statistics: {
      tradingVolume: stats?.tradingVolume ?? null,
      portfolioValue: stats?.portfolioValue ?? null,
      marketsTraded: stats?.marketsTraded ?? null,
      totalPnl: totalPnlAllTime,
      openInterest: stats?.openInterest ?? null,
      winRatePercent: stats?.winRate ?? null,
      winRateWins: stats?.winRateWins ?? null,
      winRateTotal: stats?.winRateTotal ?? null,
      biggestSingleWinUsd:
        Number.isFinite(biggestWin.pnl) && biggestWin.pnl > 0
          ? biggestWin.pnl
          : null,
      biggestSingleWinMarket: biggestWin.market,
    },
    pnlOverTime: {
      "1D": pnl?.range === "1D" ? pnl.summaryPnl : null,
      "1W": pnl?.range === "1W" ? pnl.summaryPnl : null,
      "1M": pnl?.range === "1M" ? pnl.summaryPnl : null,
      MAX: pnl?.range === "MAX" ? pnl.summaryPnl : totalPnlAllTime,
      trendDirection,
      activeRange: timeRange,
    },
    activeOpenPositions: contextMode === "active" ? openPositionsMapped : [],
    tradeHistorySummary: {
      totalTrades: trades.length,
      winningTrades,
      losingTrades,
      biggestWinUsd:
        Number.isFinite(biggestWin.pnl) && biggestWin.pnl > 0
          ? biggestWin.pnl
          : null,
      biggestWinMarket: biggestWin.market,
      biggestLossUsd:
        Number.isFinite(biggestLoss.pnl) && biggestLoss.pnl < 0
          ? biggestLoss.pnl
          : null,
      biggestLossMarket: biggestLoss.market,
      averageProfitPerWinUsd: averageProfitPerWin,
      averageLossPerLossUsd: averageLossPerLoss,
      mostCommonCategories: [],
      yesNoRatio: {
        yesCount,
        noCount,
      },
      lastClosedTrades,
    },
    closedPositions: closedPositionsMapped,
    leaderboard: {
      rank: leaderboardRank ?? null,
      top10Comparison: undefined,
    },
    liveMarketData: {
      matchingOpenPositions: [],
    },
  };

  return context;
}

export function buildSystemPrompt(context: TraderContext): string {
  const json = JSON.stringify(context, null, 2);

  const baseLines: string[] = [
    "You are an expert Polymarket trading analyst assistant.",
    "You have complete access to a trader's full portfolio data, trade history, statistics, and performance metrics.",
    "Answer questions about this specific trader's performance with precision and insight.",
    "Be direct, honest, and data-driven. Do not hedge or give generic advice — use the specific numbers provided to give concrete analysis.",
    "",
    `The data provided was collected at ${context.dataCollectedAt}.`,
    "The open positions provided in the 'activeOpenPositions' field have already been filtered to include only active markets with a current price strictly between $0.01 and $0.99 and a strictly positive current value. Any position with a $0 current price, a $0 current value, or a $1.00 price has been excluded and should be treated as a resolved market, not an open position.",
    "",
  ];

  const criticalRulesActive = [
    "CRITICAL RULES FOR POSITION ANALYSIS (ACTIVE MODE):",
    "1. Only analyze positions in the activeOpenPositions array.",
    "2. A truly active position has a currentPrice strictly between 0.01 and 0.99 — never exactly 0 or exactly 1.",
    "3. Positions at $1.00 are RESOLVED WINS — do not list them as open.",
    "4. Positions at $0.00 are RESOLVED LOSSES — do not list them as open.",
    "5. Any market with a date in its name that has already passed is resolved — do not treat it as active.",
    "6. When asked about active positions, only return positions from activeOpenPositions — never infer or include others.",
    "7. Do not give verdicts or recommendations on resolved positions under any circumstances.",
    "",
  ];

  const criticalRulesClosed = [
    "CRITICAL RULES FOR POSITION ANALYSIS (CLOSED / RESOLVED MODE):",
    "1. The user is asking about CLOSED or RESOLVED positions.",
    "2. Only analyze positions in the closedPositions array. These are markets that have already settled — prices of $0.00 mean the user lost, prices of $1.00 mean the user won.",
    "3. Use trade history and closed position data to give insight into their past performance, mistakes, and wins.",
    "4. Do not treat any closedPositions entry as an active tradable market.",
    "",
  ];

  const intentLines =
    context.mode === "closed"
      ? [
          "The user is asking about CLOSED or RESOLVED positions. Only analyze positions in closedPositions. Do not make recommendations about active positions in this mode.",
          "",
          ...criticalRulesClosed,
        ]
      : [
          "The user is asking about ACTIVE positions. Only analyze positions in activeOpenPositions and ignore closedPositions unless explicitly asked about history.",
          "",
          ...criticalRulesActive,
        ];

  const rest = [
    "Here is the complete data for the trader you are analyzing:",
    json,
    "",
    "You may be asked to:",
    "- Rate the trader's overall portfolio and strategy out of 10.",
    "- Identify patterns in their winning trades.",
    "- Identify patterns in their losing trades and where they went wrong.",
    "- Analyze specific open positions and give a recommendation.",
    "- Compare their performance to the leaderboard.",
    "- Suggest which open positions to exit or hold.",
    "- Identify which market categories they perform best and worst in.",
    "- Analyze their risk management based on position sizes.",
    "- Give an honest assessment of their trading psychology based on their trade patterns.",
    "",
    "Always reference specific trades, markets, and dollar amounts from the data provided.",
    "Never give generic advice that ignores the data.",
    "",
    "Keep responses concise and structured.",
    "Use bullet points for lists.",
    "Bold key numbers and market names.",
    "When rating something out of 10, explain the score with specific data points.",
    "Maximum response length is 400 words unless the user asks for a detailed breakdown.",
  ];

  return [...baseLines, ...intentLines, ...rest].join("\n");
}

