import { NextRequest, NextResponse } from "next/server";

const DATA_API_BASE = "https://data-api.polymarket.com";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const limit = Math.min(
      100,
      Math.max(1, parseInt(request.nextUrl.searchParams.get("limit") || "100", 10)),
    );

    const params = new URLSearchParams({
      limit: String(limit),
    });

    const res = await fetch(`${DATA_API_BASE}/trades?${params.toString()}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch live trades from Polymarket" },
        { status: res.status },
      );
    }

    const trades = await res.json();

    return NextResponse.json({
      trades: Array.isArray(trades) ? trades : [],
      fetchedAt: Date.now(),
    });
  } catch (error) {
    console.error("Live trades API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch live trades" },
      { status: 500 },
    );
  }
}

