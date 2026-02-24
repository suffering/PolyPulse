import { NextRequest, NextResponse } from "next/server";
import { normalizeWallet } from "@/lib/leaderboard";

const DATA_API_BASE = "https://data-api.polymarket.com";

export const dynamic = "force-dynamic";
export const revalidate = 120;

export async function GET(request: NextRequest) {
  try {
    const address = request.nextUrl.searchParams.get("address");
    // Data API /trades: max limit 500, max offset 1000 (Polymarket changelog Aug 2025)
    const limit = Math.min(
      500,
      Math.max(0, parseInt(request.nextUrl.searchParams.get("limit") || "50", 10))
    );
    const offset = Math.min(
      1000,
      Math.max(0, parseInt(request.nextUrl.searchParams.get("offset") || "0", 10))
    );

    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json(
        { error: "Invalid wallet address" },
        { status: 400 }
      );
    }

    const user = normalizeWallet(address);
    // Use /activity with newest-first so we show latest trades (today, 25d ago, etc.). /trades has no sort.
    const params = new URLSearchParams({
      user,
      limit: String(limit),
      offset: String(offset),
      type: "TRADE",
      sortBy: "TIMESTAMP",
      sortDirection: "DESC",
    });
    const res = await fetch(`${DATA_API_BASE}/activity?${params}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch trades" },
        { status: res.status }
      );
    }

    const trades = await res.json();
    const hasMore = Array.isArray(trades) && trades.length === limit;

    return NextResponse.json({
      trades: Array.isArray(trades) ? trades : [],
      hasMore,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Portfolio trades API error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch trades",
      },
      { status: 500 }
    );
  }
}
