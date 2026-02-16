import { NextResponse } from "next/server";
import { fetchOdds } from "@/lib/odds-api";
import { fetchPolymarketBySport } from "@/lib/polymarket";
import { matchOutrights, matchH2HGames, matchSoccerH2H } from "@/lib/matching";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

type ApiSport = "nba" | "mls";

const SPORT_CONFIG: Record<
  ApiSport,
  {
    oddsGameSport: string;
    oddsFuturesSport?: string; // optional (many leagues have no outrights)
    polymarketSport: string;
    label: string;
    league?: string; // soccer league label
  }
> = {
  nba: {
    oddsGameSport: "basketball_nba",
    oddsFuturesSport: "basketball_nba_championship_winner",
    polymarketSport: "basketball_nba",
    label: "NBA",
  },
  mls: {
    oddsGameSport: "soccer_usa_mls",
    polymarketSport: "soccer_usa_mls",
    label: "Soccer",
    league: "MLS",
  },
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sport = (searchParams.get("sport") || "nba") as ApiSport;

  const config = SPORT_CONFIG[sport];
  if (!config) {
    return NextResponse.json({ error: "Invalid sport" }, { status: 400 });
  }

  const apiKey = process.env.ODDS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ODDS_API_KEY not configured" }, { status: 500 });
  }

  try {
    const [gameOddsResult, futuresOddsResult, polymarketEvents] = await Promise.all([
      fetchOdds(config.oddsGameSport, apiKey, "h2h").catch((e) => {
        console.warn("[EV API] Game odds fetch failed:", e instanceof Error ? e.message : e);
        return { events: [], quotaRemaining: undefined };
      }),
      config.oddsFuturesSport
        ? fetchOdds(config.oddsFuturesSport, apiKey, "outrights").catch((e) => {
            console.warn(
              "[EV API] Futures odds fetch failed:",
              e instanceof Error ? e.message : e
            );
            return { events: [], quotaRemaining: undefined };
          })
        : Promise.resolve({ events: [], quotaRemaining: undefined }),
      fetchPolymarketBySport(config.polymarketSport),
    ]);

    const h2hOpportunities =
      sport === "nba"
        ? matchH2HGames(polymarketEvents, gameOddsResult.events, config.label)
        : matchSoccerH2H(
            polymarketEvents,
            gameOddsResult.events,
            config.label,
            config.league || "MLS"
          );

    const futuresOpportunities =
      sport === "nba" && config.oddsFuturesSport
        ? matchOutrights(polymarketEvents, futuresOddsResult.events, config.label)
        : [];

    const allOpportunitiesRaw = [
      ...h2hOpportunities,
      ...futuresOpportunities,
    ];

    // EV-only: only show opportunities where we have sportsbook odds + computed EV
    const evOnly = allOpportunitiesRaw.filter(
      (o) => o.evPercent != null && o.sportsbookOdds != null && o.sportsbookName != null
    );

    // For now: only futures + the most recent moneyline games
    const filtered = evOnly.filter((o) => {
      if (o.timeframe === "futures") return true;
      if (o.marketType === "game" && (o.timeframe === "today" || o.timeframe === "week")) {
        return true;
      }
      return false;
    });

    const allOpportunities = filtered.sort(
      (a, b) => (b.evPercent ?? -999) - (a.evPercent ?? -999)
    );

    return NextResponse.json({
      opportunities: allOpportunities,
      quotaRemaining: futuresOddsResult.quotaRemaining ?? gameOddsResult.quotaRemaining ?? null,
      oddsLastUpdated: new Date().toISOString(),
      polymarketLastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    console.error("EV API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to compute EV" },
      { status: 500 }
    );
  }
}
