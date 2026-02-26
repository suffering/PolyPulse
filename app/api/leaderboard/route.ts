import { NextRequest, NextResponse } from "next/server";
import { fetchLeaderboard, fetchTradeCount, type LeaderboardParams, type LeaderboardCategory, type LeaderboardTimePeriod, type LeaderboardOrderBy } from "@/lib/leaderboard";

export const dynamic = "force-dynamic";
export const revalidate = 120;

type LeaderboardResult = {
  entries: Awaited<ReturnType<typeof fetchLeaderboard>>;
  pagination: { limit: number; offset: number; hasMore: boolean };
  lastUpdated: string;
};
let cache: { data: { cacheKey: string; result: LeaderboardResult }; timestamp: number } | null = null;
const CACHE_TTL_MS = 2 * 60 * 1000;

const VALID_CATEGORIES: LeaderboardCategory[] = ["OVERALL", "POLITICS", "SPORTS", "CRYPTO", "CULTURE", "MENTIONS", "WEATHER", "ECONOMICS", "TECH", "FINANCE"];
const VALID_TIME_PERIODS: LeaderboardTimePeriod[] = ["DAY", "WEEK", "MONTH", "ALL"];
const VALID_ORDER_BY: LeaderboardOrderBy[] = ["PNL", "VOL"];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const catParam = searchParams.get("category");
    const periodParam = searchParams.get("timePeriod");
    const orderParam = searchParams.get("orderBy");
    const params: LeaderboardParams = {
      category: (catParam && VALID_CATEGORIES.includes(catParam as LeaderboardCategory) ? catParam : "OVERALL") as LeaderboardCategory,
      timePeriod: (periodParam && VALID_TIME_PERIODS.includes(periodParam as LeaderboardTimePeriod) ? periodParam : "MONTH") as LeaderboardTimePeriod,
      orderBy: (orderParam && VALID_ORDER_BY.includes(orderParam as LeaderboardOrderBy) ? orderParam : "PNL") as LeaderboardOrderBy,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 50,
      offset: searchParams.get("offset") ? Number(searchParams.get("offset")) : 0,
    };

    const cacheKey = JSON.stringify(params);
    const now = Date.now();

    if (cache && now - cache.timestamp < CACHE_TTL_MS && cache.data.cacheKey === cacheKey) {
      return NextResponse.json(cache.data.result);
    }

    const rawEntries = await fetchLeaderboard(params);

    const tradeCountResults = await Promise.allSettled(
      rawEntries.map((entry) => fetchTradeCount(entry.proxyWallet))
    );

    const entries = rawEntries.map((entry, i) => {
      const countResult = tradeCountResults[i];
      const totalTrades =
        countResult?.status === "fulfilled" && countResult.value != null
          ? countResult.value
          : null;
      return { ...entry, totalTrades };
    });

    const result = {
      entries,
      pagination: {
        limit: params.limit || 50,
        offset: params.offset || 0,
        hasMore: rawEntries.length === (params.limit || 50),
      },
      lastUpdated: new Date().toISOString(),
    };

    cache = {
      data: { cacheKey, result },
      timestamp: now,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Leaderboard API error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch leaderboard",
      },
      { status: 500 }
    );
  }
}
