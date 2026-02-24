import { NextRequest, NextResponse } from "next/server";
import { fetchOpenPositions } from "@/lib/leaderboard";

export const dynamic = "force-dynamic";
export const revalidate = 30;

const CACHE_TTL_MS = 30 * 1000;
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

    const normalized = address.toLowerCase();
    const now = Date.now();
    const cached = cache.get(normalized);
    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json(cached.data);
    }

    const positions = await fetchOpenPositions(address);
    const result = { positions, lastUpdated: new Date().toISOString() };
    cache.set(normalized, { data: result, timestamp: now });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Portfolio positions API error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch positions",
      },
      { status: 500 }
    );
  }
}
