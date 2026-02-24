import { NextRequest, NextResponse } from "next/server";
import { fetchPolymarketMarkets } from "@/lib/polymarket";

export const dynamic = "force-dynamic";
export const revalidate = 300;

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      Math.max(1, parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT),
      MAX_LIMIT
    );
    const offset = Math.max(0, parseInt(searchParams.get("offset") ?? "0", 10) || 0);

    const markets = await fetchPolymarketMarkets(limit, offset, {
      active: true,
      order: "liquidityNum",
      ascending: false,
    });

    const hasMore = markets.length === limit;

    return NextResponse.json({
      markets,
      hasMore,
    });
  } catch (error) {
    console.error("Markets API error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch markets",
      },
      { status: 500 }
    );
  }
}
