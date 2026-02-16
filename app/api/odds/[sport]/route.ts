import { NextResponse } from "next/server";
import { fetchOdds } from "@/lib/odds-api";

export const dynamic = "force-dynamic";
export const revalidate = 300; // 5 min

export async function GET(
  _req: Request,
  { params }: { params: { sport: string } }
) {
  const apiKey = process.env.ODDS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ODDS_API_KEY not configured" }, { status: 500 });
  }

  const sport = params.sport || "basketball_nba_championship_winner";
  const validSports = [
    "basketball_nba",
    "basketball_nba_championship_winner",
    "americanfootball_nfl",
    "icehockey_nhl",
    "baseball_mlb",
    "baseball_mlb_world_series_winner",
    "icehockey_nhl_championship_winner",
  ];
  if (!validSports.includes(sport)) {
    return NextResponse.json({ error: "Invalid sport" }, { status: 400 });
  }

  try {
    const { events, quotaRemaining } = await fetchOdds(sport, apiKey);
    return NextResponse.json({
      events,
      quotaRemaining: quotaRemaining ?? null,
      cached: true,
    });
  } catch (err) {
    console.error("Odds API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch odds" },
      { status: 500 }
    );
  }
}
