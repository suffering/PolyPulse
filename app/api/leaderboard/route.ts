import { NextRequest, NextResponse } from "next/server";
import { fetchLeaderboard, fetchTradeCount, type LeaderboardParams } from "@/lib/leaderboard";

export const dynamic = "force-dynamic";
export const revalidate = 120;

let cache: { data: any; timestamp: number } | null = null;
const CACHE_TTL_MS = 2 * 60 * 1000;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const params: LeaderboardParams = {
      category: (searchParams.get("category") as any) || "OVERALL",
      timePeriod: (searchParams.get("timePeriod") as any) || "MONTH",
      orderBy: (searchParams.get("orderBy") as any) || "PNL",
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
