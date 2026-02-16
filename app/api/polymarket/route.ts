import { NextResponse } from "next/server";
import { fetchPolymarketBySport } from "@/lib/polymarket";

export const dynamic = "force-dynamic";
export const revalidate = 60; // 1 min - Polymarket has no limit

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sport = searchParams.get("sport") || "basketball_nba_championship_winner";

  const sportToTag: Record<string, string> = {
    basketball_nba: "745",
    basketball_nba_championship_winner: "745",
    americanfootball_nfl: "450",
    icehockey_nhl: "899",
    baseball_mlb: "100381",
    baseball_mlb_world_series_winner: "100381",
    icehockey_nhl_championship_winner: "899",
  };

  if (!sportToTag[sport]) {
    return NextResponse.json({ error: "Invalid sport" }, { status: 400 });
  }

  try {
    const events = await fetchPolymarketBySport(sport);
    return NextResponse.json({
      events,
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Polymarket API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch Polymarket" },
      { status: 500 }
    );
  }
}
