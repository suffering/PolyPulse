const ODDS_API_BASE = "https://api.the-odds-api.com/v4";
const CACHE_TTL_MS = 5 * 60 * 1000;
const RATE_LIMIT_RETRY_DELAYS_MS = [1000, 2000];

/** Outcome from /odds; price is American odds when request uses oddsFormat=american */
export interface OddsApiOutcome {
  name: string;
  price: number;
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

const cache = new Map<
  string,
  { data: OddsApiEvent[]; timestamp: number; quotaRemaining?: number }
>();

let lastKnownQuotaRemaining: number | null = null;

export function getLastKnownQuotaRemaining(): number | null {
  return lastKnownQuotaRemaining;
}

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

/**
 * Fetch odds from The Odds API (v4).
 * @param regions - Comma-delimited bookmaker regions (e.g. "us", "us,uk"). Soccer leagues
 *   often have little or no coverage in "us" alone; use "us,uk" for soccer to include UK/EU bookmakers.
 */
export async function fetchOdds(
  sport: string,
  apiKey: string,
  markets?: string,
  options?: { skipCache?: boolean; regions?: string }
): Promise<{ events: OddsApiEvent[]; quotaRemaining?: number }> {
  const defaultMarkets = OUTRIGHTS_SPORTS.includes(sport) ? "outrights" : "h2h,totals";
  const marketsParam = markets || defaultMarkets;
  const regionsParam = options?.regions ?? "us";

  const cacheKey = `odds:${sport}:${marketsParam}:${regionsParam}`;
  if (!options?.skipCache) {
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      if (sport === "baseball_mlb" || sport === "baseball_mlb_world_series_winner") {
        console.log("[Odds API] MLB served from cache", {
          sport,
          marketsParam,
          regionsParam,
          eventCount: cached.data.length,
          ageMs: Date.now() - cached.timestamp,
        });
      }
      const quota =
        lastKnownQuotaRemaining !== null ? lastKnownQuotaRemaining : cached.quotaRemaining;
      return { events: cached.data, quotaRemaining: quota };
    }
  }

  // get-odds.md: markets default to h2h (moneyline); oddsFormat defaults to decimal — we require american so outcome.price is American odds.
  const url = `${ODDS_API_BASE}/sports/${sport}/odds?regions=${encodeURIComponent(regionsParam)}&markets=${encodeURIComponent(marketsParam)}&oddsFormat=american&apiKey=${apiKey}`;
  let res: Response | null = null;
  for (let attempt = 0; attempt <= RATE_LIMIT_RETRY_DELAYS_MS.length; attempt++) {
    res = await fetch(url);
    if (res.status !== 429) break;
    if (attempt === RATE_LIMIT_RETRY_DELAYS_MS.length) break;
    await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_RETRY_DELAYS_MS[attempt]));
  }

  if (!res) {
    throw new Error("Odds API error: request did not return a response");
  }

  if (res.status === 429) {
    const body = await res.text();
    throw new Error(`Odds API rate limit exceeded (429). ${body}`);
  }

  if (!res.ok) {
    throw new Error(`Odds API error: ${res.status} ${await res.text()}`);
  }

  const quotaRemaining = res.headers.get("x-requests-remaining")
    ? parseInt(res.headers.get("x-requests-remaining")!, 10)
    : undefined;

  if (quotaRemaining != null) {
    lastKnownQuotaRemaining = quotaRemaining;
  }

  const raw = await res.json();
  if (!Array.isArray(raw)) {
    throw new Error(`Odds API error: expected array of events, got ${typeof raw}`);
  }
  const events: OddsApiEvent[] = raw;

  // Debug: log raw MLB odds from The Odds API to verify fetch and structure
  if (sport === "baseball_mlb" || sport === "baseball_mlb_world_series_winner") {
    const sample = events.slice(0, 2).map((e) => ({
      id: e.id,
      sport_key: e.sport_key,
      home_team: e.home_team,
      away_team: e.away_team,
      bookmakers: e.bookmakers?.map((b) => ({
        key: b.key,
        title: b.title,
        markets: b.markets?.map((m) => ({
          key: m.key,
          outcomes: m.outcomes?.slice(0, 5).map((o) => ({ name: o.name, price: o.price })),
        })),
      })),
    }));
    console.log(`[Odds API] MLB raw response sport=${sport} events=${events.length}:\n${JSON.stringify(sample, null, 2)}`);
  }

  if (events.length > 0) {
    cache.set(cacheKey, {
      data: events,
      timestamp: Date.now(),
      quotaRemaining:
        lastKnownQuotaRemaining !== null ? lastKnownQuotaRemaining : undefined,
    });
  }

  const quota =
    lastKnownQuotaRemaining !== null ? lastKnownQuotaRemaining : quotaRemaining;
  return { events, quotaRemaining: quota };
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

    const outcome = h2h.outcomes.find((o) => {
      const oNorm = normalizeTeamName(o.name);
      const tNorm = normalizeTeamName(teamName);
      return oNorm === tNorm || oNorm.includes(tNorm) || tNorm.includes(oNorm);
    });
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
