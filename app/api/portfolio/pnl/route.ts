import { NextRequest, NextResponse } from "next/server";
import {
  fetchClosedPositions,
  fetchOpenPositions,
  fetchLeaderboardPnl,
} from "@/lib/leaderboard";
import {
  buildChartDataForRange,
  getPeriodPnl,
  type TimeRange,
} from "@/lib/trader-stats";

export const dynamic = "force-dynamic";
export const revalidate = 120;

const CACHE_TTL_MS = 2 * 60 * 1000;
const cache = new Map<string, { data: unknown; timestamp: number }>();

type UserPnlPoint = { t: number; p: number };

async function fetchUserPnlSeries(
  address: string,
  range: "1W" | "1M"
): Promise<UserPnlPoint[]> {
  const interval = range === "1W" ? "1w" : "1m";
  const params = new URLSearchParams({
    user_address: address.toLowerCase(),
    interval,
    fidelity: "1d",
  });

  const res = await fetch(`https://user-pnl-api.polymarket.com/user-pnl?${params}`, {
    cache: "no-store",
  });
  if (!res.ok) return [];

  const raw = await res.json();
  if (!Array.isArray(raw)) return [];

  return raw
    .map((p) => ({ t: Number(p?.t), p: Number(p?.p) }))
    .filter((p) => Number.isFinite(p.t) && Number.isFinite(p.p) && p.t > 0)
    .sort((a, b) => a.t - b.t);
}

export async function GET(request: NextRequest) {
  try {
    const address = request.nextUrl.searchParams.get("address");
    const range = (request.nextUrl.searchParams.get("range") as TimeRange) || "MAX";
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json(
        { error: "Invalid wallet address" },
        { status: 400 }
      );
    }

    const cacheKey = `${address.toLowerCase()}-${range}`;
    const now = Date.now();
    const cached = cache.get(cacheKey);
    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json(cached.data);
    }

    // 1D and ALL: use leaderboard only (do not touch). 1W and 1M: use computed from closed positions; use endDate fallback for timestamp so period includes all positions.
    if (range === "1W" || range === "1M") {
      const series = await fetchUserPnlSeries(address, range);
      if (series.length > 0) {
        const base = series[0].p;
        const data = series.map((point) => ({
          timestamp: point.t,
          pnl: point.p - base,
          date: new Date(point.t * 1000).toLocaleDateString(),
        }));
        const summaryPnl = series[series.length - 1].p - base;
        const result = {
          address,
          range,
          data,
          summaryPnl,
          lastUpdated: new Date().toISOString(),
        };
        cache.set(cacheKey, { data: result, timestamp: now });
        return NextResponse.json(result);
      }
    }

    const useLeaderboardForSummary = range === "1D" || range === "MAX";
    const leaderboardPeriod =
      range === "MAX" ? "ALL" : range === "1D" ? "DAY" : null;

    const [closedPositions, openPositions, leaderboardPnl] = await Promise.all([
      fetchClosedPositions(address),
      fetchOpenPositions(address),
      useLeaderboardForSummary ? fetchLeaderboardPnl(address, leaderboardPeriod!) : Promise.resolve(null),
    ]);

    // For 1W and 1M only: use endDate as timestamp fallback so period sum and chart include positions that lack timestamp (1D and ALL never use this).
    const closedForRange =
      range === "1W" || range === "1M"
        ? closedPositions.map((p) => ({
            ...p,
            timestamp:
              p.timestamp ||
              (p.endDate ? Math.floor(new Date(p.endDate).getTime() / 1000) : 0),
          }))
        : closedPositions;

    const data = buildChartDataForRange(
      closedForRange,
      openPositions,
      range,
      useLeaderboardForSummary && leaderboardPnl !== null
        ? leaderboardPnl
        : undefined
    );
    const computedPnl = getPeriodPnl(closedForRange, openPositions, range);
    const summaryPnl =
      useLeaderboardForSummary && leaderboardPnl !== null
        ? leaderboardPnl
        : computedPnl;

    const result = {
      address,
      range,
      data,
      summaryPnl,
      lastUpdated: new Date().toISOString(),
    };

    cache.set(cacheKey, { data: result, timestamp: now });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Portfolio PnL API error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch P&L history",
      },
      { status: 500 }
    );
  }
}
