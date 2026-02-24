import { NextRequest, NextResponse } from "next/server";
import { normalizeWallet } from "@/lib/leaderboard";

const DATA_API_BASE = "https://data-api.polymarket.com";

export const dynamic = "force-dynamic";
export const revalidate = 120;

const CACHE_TTL_MS = 60 * 1000;
const cache = new Map<string, { data: unknown; timestamp: number }>();

export async function GET(request: NextRequest) {
  try {
    const address = request.nextUrl.searchParams.get("address");
    const limit = Math.min(
      50,
      Math.max(0, parseInt(request.nextUrl.searchParams.get("limit") || "50", 10))
    );
    const offset = Math.max(
      0,
      parseInt(request.nextUrl.searchParams.get("offset") || "0", 10)
    );

    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json(
        { error: "Invalid wallet address" },
        { status: 400 }
      );
    }

    const user = normalizeWallet(address);
    const cacheKey = `${user}-${limit}-${offset}`;
    const now = Date.now();
    const cached = cache.get(cacheKey);
    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json(cached.data);
    }

    const params = new URLSearchParams({
      user,
      limit: String(limit),
      offset: String(offset),
      sortBy: "TIMESTAMP",
      sortDirection: "DESC",
    });

    const res = await fetch(`${DATA_API_BASE}/closed-positions?${params}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch closed positions" },
        { status: res.status }
      );
    }

    const raw = await res.json();
    const items = Array.isArray(raw) ? raw : [];

    const closedPositions = items.map((p: any) => {
      let ts = Number(p.timestamp) || 0;
      if (ts > 1e12) ts = Math.floor(ts / 1000);
      return {
        title: p.title || "",
        outcome: p.outcome || "",
        realizedPnl: Number(p.realizedPnl) || 0,
        timestamp: ts,
        avgPrice: Number(p.avgPrice) || 0,
        curPrice: Number(p.curPrice) || 0,
        totalBought: Number(p.totalBought) || 0,
        conditionId: p.conditionId || "",
        asset: p.asset || "",
      };
    });

    const hasMore = items.length === limit;
    const result = {
      closedPositions,
      hasMore,
      lastUpdated: new Date().toISOString(),
    };

    cache.set(cacheKey, { data: result, timestamp: now });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Portfolio closed-positions API error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch closed positions",
      },
      { status: 500 }
    );
  }
}

