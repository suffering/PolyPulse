import { NextResponse } from "next/server";
import { fetchPolymarketBySport, isSupportedPolymarketSport } from "@/lib/polymarket";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sport = searchParams.get("sport") || "basketball_nba_championship_winner";

  if (!isSupportedPolymarketSport(sport)) {
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
