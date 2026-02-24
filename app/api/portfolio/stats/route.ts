import { NextRequest, NextResponse } from "next/server";
import {
  fetchTraderStats,
  fetchOpenPositions,
  fetchClosedPositions,
  fetchLeaderboardPnl,
  normalizeWallet,
} from "@/lib/leaderboard";
import { computeWinRate } from "@/lib/trader-stats";

export const dynamic = "force-dynamic";
export const revalidate = 60;

const CACHE_TTL_MS = 60 * 1000;
const cache = new Map<string, { data: unknown; timestamp: number }>();

export async function GET(request: NextRequest) {
  try {
    const address = request.nextUrl.searchParams.get("address");
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json(
        { error: "Invalid wallet address" },
        { status: 400 }
      );
    }

    const normalized = normalizeWallet(address);
    const now = Date.now();
    const cached = cache.get(normalized);
    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json(cached.data);
    }

    const [traderStats, openPositions, closedPositions, leaderboardPnl] =
      await Promise.all([
        fetchTraderStats(address),
        fetchOpenPositions(address),
        fetchClosedPositions(address),
        fetchLeaderboardPnl(address, "ALL"),
      ]);

    const openInterest = openPositions.reduce((sum, p) => sum + p.currentValue, 0);
    const { wins, total, percent } = computeWinRate(closedPositions);

    const totalPnlFromPositions =
      closedPositions.reduce((sum, p) => sum + p.realizedPnl, 0) +
      openPositions.reduce((sum, p) => sum + p.cashPnl, 0);
    const totalPnl =
      leaderboardPnl !== null ? leaderboardPnl : totalPnlFromPositions;

    const result = {
      ...traderStats,
      totalPnl,
      openInterest,
      winRate: percent,
      winRateWins: wins,
      winRateTotal: total,
      lastUpdated: new Date().toISOString(),
    };

    cache.set(normalized, { data: result, timestamp: now });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Portfolio stats API error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch stats",
      },
      { status: 500 }
    );
  }
}
