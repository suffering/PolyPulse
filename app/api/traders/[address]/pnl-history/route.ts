import { NextRequest, NextResponse } from "next/server";
import { fetchClosedPositions, fetchOpenPositions } from "@/lib/leaderboard";
import { buildPnLHistory, filterPnLHistoryByRange, type TimeRange } from "@/lib/trader-stats";

export const dynamic = "force-dynamic";
export const revalidate = 300;

const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const address = params.address;
    const searchParams = request.nextUrl.searchParams;
    const range = (searchParams.get("range") as TimeRange) || "MAX";

    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json(
        { error: "Invalid wallet address" },
        { status: 400 }
      );
    }

    const cacheKey = `${address}-${range}`;
    const now = Date.now();
    const cached = cache.get(cacheKey);

    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json(cached.data);
    }

    const [closedPositions, openPositions] = await Promise.all([
      fetchClosedPositions(address),
      fetchOpenPositions(address),
    ]);

    const fullData = buildPnLHistory(closedPositions, openPositions);
    const data = filterPnLHistoryByRange(fullData, range);

    const result = {
      address,
      range,
      data,
      lastUpdated: new Date().toISOString(),
    };

    cache.set(cacheKey, {
      data: result,
      timestamp: now,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("P&L history API error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch P&L history",
      },
      { status: 500 }
    );
  }
}
