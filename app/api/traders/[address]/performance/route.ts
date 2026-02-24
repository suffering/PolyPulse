import { NextRequest, NextResponse } from "next/server";
import { fetchClosedPositions, fetchOpenPositions } from "@/lib/leaderboard";
import { calculatePerformance } from "@/lib/trader-stats";

export const dynamic = "force-dynamic";
export const revalidate = 120;

const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 2 * 60 * 1000;

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const address = params.address;

    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json(
        { error: "Invalid wallet address" },
        { status: 400 }
      );
    }

    const now = Date.now();
    const cached = cache.get(address);

    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json(cached.data);
    }

    const [closedPositions, openPositions] = await Promise.all([
      fetchClosedPositions(address),
      fetchOpenPositions(address),
    ]);

    const performance = calculatePerformance(closedPositions, openPositions);

    const result = {
      address,
      performance,
      lastUpdated: new Date().toISOString(),
    };

    cache.set(address, {
      data: result,
      timestamp: now,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Performance API error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch performance metrics",
      },
      { status: 500 }
    );
  }
}
