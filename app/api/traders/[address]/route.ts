import { NextRequest, NextResponse } from "next/server";
import { fetchTraderStats, type TraderStats } from "@/lib/leaderboard";

export const dynamic = "force-dynamic";
export const revalidate = 120;

type TraderResponse = { address: string; stats: TraderStats; lastUpdated: string };
const cache = new Map<string, { data: TraderResponse; timestamp: number }>();
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

    const stats = await fetchTraderStats(address);

    const result = {
      address,
      stats,
      lastUpdated: new Date().toISOString(),
    };

    cache.set(address, {
      data: result,
      timestamp: now,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Trader stats API error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch trader stats",
      },
      { status: 500 }
    );
  }
}
