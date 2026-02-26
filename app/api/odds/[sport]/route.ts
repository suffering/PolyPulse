import { NextResponse } from "next/server";
import { fetchOdds } from "@/lib/odds-api";

export const dynamic = "force-dynamic";
export const revalidate = 300;

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
    "icehockey_nhl_championship_winner",
    "baseball_mlb",
    "baseball_mlb_world_series_winner",
    "soccer_usa_mls",
    "soccer_epl",
    "soccer_spain_la_liga",
    "soccer_france_ligue_one",
    "soccer_italy_serie_a",
    "soccer_germany_bundesliga",
    "tennis_atp_indian_wells",
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
