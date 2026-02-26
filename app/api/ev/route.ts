import { NextResponse } from "next/server";
import { fetchOdds, getLastKnownQuotaRemaining } from "@/lib/odds-api";
import { fetchPolymarketBySport } from "@/lib/polymarket";
import { matchOutrights, matchH2HGames, matchSoccerH2H, matchPolymarketOnlyOutrights } from "@/lib/matching";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

type ApiSport = "nba" | "mls" | "mlb" | "nhl" | "tennis";

type SoccerLeagueKey =
  | "mls"
  | "epl"
  | "laliga"
  | "ligue1"
  | "seriea"
  | "bundesliga";

const SOCCER_LEAGUES: Record<
  SoccerLeagueKey,
  { oddsGameSport: string; polymarketSport: string; label: string }
> = {
  mls: {
    oddsGameSport: "soccer_usa_mls",
    polymarketSport: "soccer_usa_mls",
    label: "MLS",
  },
  epl: {
    oddsGameSport: "soccer_epl",
    polymarketSport: "soccer_epl",
    label: "Premier League",
  },
  laliga: {
    oddsGameSport: "soccer_spain_la_liga",
    polymarketSport: "soccer_spain_la_liga",
    label: "La Liga",
  },
  ligue1: {
    oddsGameSport: "soccer_france_ligue_one",
    polymarketSport: "soccer_france_ligue_one",
    label: "Ligue 1",
  },
  seriea: {
    oddsGameSport: "soccer_italy_serie_a",
    polymarketSport: "soccer_italy_serie_a",
    label: "Serie A",
  },
  bundesliga: {
    oddsGameSport: "soccer_germany_bundesliga",
    polymarketSport: "soccer_germany_bundesliga",
    label: "Bundesliga",
  },
};

const SPORT_CONFIG: Record<
  ApiSport,
  {
    oddsGameSport: string;
    oddsFuturesSport?: string;
    polymarketSport: string;
    label: string;
    league?: string;
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
  mlb: {
    oddsGameSport: "baseball_mlb",
    oddsFuturesSport: "baseball_mlb_world_series_winner",
    polymarketSport: "baseball_mlb",
    label: "MLB",
  },
  nhl: {
    oddsGameSport: "icehockey_nhl",
    oddsFuturesSport: "icehockey_nhl_championship_winner",
    polymarketSport: "icehockey_nhl",
    label: "NHL",
  },
  tennis: {
    oddsGameSport: "tennis_atp_indian_wells",
    polymarketSport: "tennis",
    label: "Tennis",
  },
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sport = (searchParams.get("sport") || "nba") as ApiSport;
  const leagueParam = (searchParams.get("league") || "mls") as SoccerLeagueKey;
  const refreshOdds = searchParams.get("refresh_odds") === "1" || searchParams.get("refresh_odds") === "true";

  const config = SPORT_CONFIG[sport];
  if (!config) {
    return NextResponse.json({ error: "Invalid sport" }, { status: 400 });
  }

  const soccerLeague =
    sport === "mls" && SOCCER_LEAGUES[leagueParam]
      ? SOCCER_LEAGUES[leagueParam]
      : null;
  const oddsGameSport = soccerLeague ? soccerLeague.oddsGameSport : config.oddsGameSport;
  const polymarketSport = soccerLeague ? soccerLeague.polymarketSport : config.polymarketSport;
  const leagueLabel = soccerLeague ? soccerLeague.label : config.league;

  const apiKey = process.env.ODDS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ODDS_API_KEY not configured" }, { status: 500 });
  }

  const oddsOptions = refreshOdds ? { skipCache: true } : undefined;
  const isSoccer = oddsGameSport.startsWith("soccer_");
  const gameMarkets = isSoccer ? "h2h,h2h_3_way" : "h2h";

  try {
    const [gameOddsResult, futuresOddsResult, polymarketEvents] = await Promise.all([
      fetchOdds(oddsGameSport, apiKey, gameMarkets, oddsOptions).catch((e) => {
        console.warn("[EV API] Game odds fetch failed:", e instanceof Error ? e.message : e);
        return { events: [], quotaRemaining: undefined };
      }),
      config.oddsFuturesSport
        ? fetchOdds(config.oddsFuturesSport, apiKey, "outrights", oddsOptions).catch((e) => {
            console.warn(
              "[EV API] Futures odds fetch failed:",
              e instanceof Error ? e.message : e
            );
            return { events: [], quotaRemaining: undefined };
          })
        : Promise.resolve({ events: [], quotaRemaining: undefined }),
      fetchPolymarketBySport(polymarketSport),
    ]);

    const h2hOpportunities =
      sport === "nba" || sport === "mlb" || sport === "nhl" || sport === "tennis"
        ? matchH2HGames(polymarketEvents, gameOddsResult.events, config.label, {
            includeWithoutSportsbook: true,
          })
        : matchSoccerH2H(
            polymarketEvents,
            gameOddsResult.events,
            config.label,
            leagueLabel || "MLS",
            { includeWithoutSportsbook: true }
          );

    const futuresOpportunities =
      config.oddsFuturesSport
        ? matchOutrights(polymarketEvents, futuresOddsResult.events, config.label)
        : [];

    const polymarketOnlyFutures =
      sport === "mls"
        ? matchPolymarketOnlyOutrights(polymarketEvents, config.label, leagueLabel)
        : [];

    const allOpportunitiesRaw = [
      ...h2hOpportunities,
      ...futuresOpportunities,
      ...polymarketOnlyFutures,
    ];

    const evOnly = allOpportunitiesRaw.filter(
      (o) =>
        (o.evPercent != null && o.sportsbookOdds != null && o.sportsbookName != null) ||
        (o.timeframe === "futures" && o.sportsbookName == null) ||
        ((o.sport === "NBA" || o.sport === "MLB" || o.sport === "NHL" || o.sport === "Tennis" || o.sport === "Soccer") && o.polymarketPrice != null)
    );

    const filtered = evOnly.filter((o) => {
      if (o.timeframe === "futures") return true;
      if (o.marketType === "game" && o.timeframe !== "all") return true;
      return false;
    });

    // Only show +EV when Polymarket odds are better than the sportsbook (same bet).
    // Include Polymarket-only (no sportsbook) so user can still see those markets.
    const positiveEVOnly = filtered.filter(
      (o) =>
        o.sportsbookName == null ||
        o.evPercent == null ||
        (o.evPercent != null && o.evPercent > 0)
    );

    const allOpportunities = positiveEVOnly.sort((a, b) => {
      const timeA = new Date(a.eventTime || 0).getTime();
      const timeB = new Date(b.eventTime || 0).getTime();
      if (timeA !== timeB) return timeA - timeB;
      return (b.evPercent ?? -999) - (a.evPercent ?? -999);
    });

    const quotaRemaining =
      getLastKnownQuotaRemaining() ??
      futuresOddsResult.quotaRemaining ??
      gameOddsResult.quotaRemaining ??
      null;

    return NextResponse.json({
      opportunities: allOpportunities,
      quotaRemaining,
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
