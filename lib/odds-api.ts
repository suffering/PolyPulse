/**
 * The Odds API client - fetches sportsbook odds
 * CRITICAL: 500 requests/month = ~16/day - aggressive caching required
 */

const ODDS_API_BASE = "https://api.the-odds-api.com/v4";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export interface OddsApiOutcome {
  name: string;
  price: number; // American odds
  point?: number;
}

export interface OddsApiMarket {
  key: string;
  outcomes: OddsApiOutcome[];
}

export interface OddsApiBookmaker {
  key: string;
  title: string;
  last_update: string;
  markets: OddsApiMarket[];
}

export interface OddsApiEvent {
  id: string;
  sport_key: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: OddsApiBookmaker[];
}

export interface OddsApiResponse {
  events: OddsApiEvent[];
  quotaUsed?: number;
  quotaRemaining?: number;
}

// In-memory cache for server-side
const cache = new Map<
  string,
  { data: OddsApiEvent[]; timestamp: number; quotaRemaining?: number }
>();

function americanToDecimal(american: number): number {
  if (american > 0) {
    return 1 + american / 100;
  }
  return 1 + 100 / Math.abs(american);
}

export function americanToImpliedProbability(american: number): number {
  const decimal = americanToDecimal(american);
  return 1 / decimal;
}

const OUTRIGHTS_SPORTS = [
  "basketball_nba_championship_winner",
  "baseball_mlb_world_series_winner",
  "icehockey_nhl_championship_winner",
];

export async function fetchOdds(
  sport: string,
  apiKey: string,
  markets?: string // Optional: comma-separated markets like "h2h,spreads,totals"
): Promise<{ events: OddsApiEvent[]; quotaRemaining?: number }> {
  // Determine default markets based on sport type
  const defaultMarkets = OUTRIGHTS_SPORTS.includes(sport) ? "outrights" : "h2h,totals";
  const marketsParam = markets || defaultMarkets;
  
  const cacheKey = `odds:${sport}:${marketsParam}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return {
      events: cached.data,
      quotaRemaining: cached.quotaRemaining,
    };
  }

  const url = `${ODDS_API_BASE}/sports/${sport}/odds?regions=us&markets=${marketsParam}&oddsFormat=american&apiKey=${apiKey}`;
  const res = await fetch(url);

  const quotaRemaining = res.headers.get("x-requests-remaining")
    ? parseInt(res.headers.get("x-requests-remaining")!, 10)
    : undefined;

  if (!res.ok) {
    throw new Error(`Odds API error: ${res.status} ${await res.text()}`);
  }

  const events: OddsApiEvent[] = await res.json();

  // Empty response doesn't count against quota per docs
  if (events.length > 0) {
    cache.set(cacheKey, {
      data: events,
      timestamp: Date.now(),
      quotaRemaining,
    });
  }

  return { events, quotaRemaining };
}

export function getBestSportsbookOdds(
  event: OddsApiEvent,
  teamName: string
): { bookmaker: OddsApiBookmaker; outcome: OddsApiOutcome; decimalOdds: number } | null {
  let best: { bookmaker: OddsApiBookmaker; outcome: OddsApiOutcome; decimalOdds: number } | null =
    null;

  for (const bookmaker of event.bookmakers) {
    const h2h = bookmaker.markets.find((m) => m.key === "h2h");
    if (!h2h) continue;

    const outcome = h2h.outcomes.find((o) =>
      normalizeTeamName(o.name).includes(normalizeTeamName(teamName))
    );
    if (!outcome) continue;

    const decimalOdds = americanToDecimal(outcome.price);
    if (!best || decimalOdds > best.decimalOdds) {
      best = { bookmaker, outcome, decimalOdds };
    }
  }
  return best;
}

export function normalizeTeamName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s]/g, "")
    .trim();
}
