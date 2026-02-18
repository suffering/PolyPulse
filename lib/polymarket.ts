const GAMMA_API_BASE = "https://gamma-api.polymarket.com";

export interface PolymarketOutcome {
  name: string;
  price: number;
  tokenID?: string;
}

export interface PolymarketMarket {
  id: string;
  question: string;
  conditionId: string;
  slug: string | null;
  outcomes: string;
  outcomePrices: string;
  clobTokenIds: string | null;
  groupItemTitle?: string;
  teamAID?: string;
  teamBID?: string;
  gameStartTime?: string;
  gameId?: string;
  volumeNum?: number;
  volume24h?: number;
  liquidity?: number;
  liquidityNum?: number;
  /** May be present on some Gamma responses; used for Active Markets counts when available. */
  active?: boolean;
  /** Nested events (e.g. from Gamma API); may include commentCount for "Users" column */
  events?: Array<{ commentCount?: number }>;
}

export interface EventCreator {
  id: string;
  creatorName: string | null;
  creatorHandle: string | null;
  creatorUrl: string | null;
  creatorImage: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface PolymarketEvent {
  id: string;
  slug: string | null;
  title: string | null;
  startDate: string | null;
  endDate: string | null;
  closed: boolean;
  markets: PolymarketMarket[];
  tags?: { id: string; label: string; slug: string }[];
  /** Event-level liquidity (open interest) from Gamma API */
  liquidity?: number | string;
  /** Event-level volume (notional) from Gamma API */
  volume?: number | string;
  openInterest?: number;
  /** Creator attribution from Gamma API when available. */
  eventCreators?: EventCreator[] | null;
}

export interface SportsMetadata {
  sport: string;
  tags: string;
  image?: string;
  resolution?: string;
}

const SPORT_TAG_MAP: Record<string, string> = {
  basketball_nba: "745",
  basketball_nba_championship_winner: "745",
  soccer_usa_mls: "100100",
  soccer_epl: "82",
  soccer_spain_la_liga: "780",
  soccer_france_ligue_one: "102070",
  soccer_italy_serie_a: "101962",
  soccer_germany_bundesliga: "1494",
  americanfootball_nfl: "450",
  icehockey_nhl: "899",
  baseball_mlb: "100381",
  baseball_mlb_world_series_winner: "100381",
  icehockey_nhl_championship_winner: "899",
  tennis: "864",
};

const SPORT_SERIES_MAP: Record<string, string> = {
  basketball_nba: "10345",
  icehockey_nhl: "10346",
  baseball_mlb: "10347",
};

export function isSupportedPolymarketSport(sport: string): boolean {
  return Boolean(SPORT_TAG_MAP[sport] || SPORT_SERIES_MAP[sport]);
}

async function getResponseErrorBody(res: Response): Promise<string> {
  try {
    const body = await res.text();
    return body ? ` ${body}` : "";
  } catch {
    return "";
  }
}

export async function getSportsMetadata(): Promise<SportsMetadata[]> {
  const res = await fetch(`${GAMMA_API_BASE}/sports`);
  if (!res.ok) {
    const body = await getResponseErrorBody(res);
    throw new Error(`Polymarket sports error: ${res.status}.${body}`);
  }
  return res.json();
}

export async function fetchSportsEvents(
  tagId: string,
  limit = 50
): Promise<PolymarketEvent[]> {
  const params = new URLSearchParams({
    tag_id: tagId,
    closed: "false",
    limit: String(limit),
    order: "startDate",
    ascending: "true",
  });
  const res = await fetch(`${GAMMA_API_BASE}/events?${params}`);
  if (!res.ok) {
    const body = await getResponseErrorBody(res);
    throw new Error(`Polymarket events error: ${res.status}.${body}`);
  }
  return res.json();
}

export async function fetchSeriesEvents(
  seriesId: string,
  limit = 50
): Promise<PolymarketEvent[]> {
  const params = new URLSearchParams({
    series_id: seriesId,
    closed: "false",
    limit: String(limit),
    order: "startDate",
    ascending: "true",
  });
  const res = await fetch(`${GAMMA_API_BASE}/events?${params}`);
  if (!res.ok) {
    const body = await getResponseErrorBody(res);
    throw new Error(`Polymarket events error: ${res.status}.${body}`);
  }
  return res.json();
}

export async function fetchPolymarketBySport(
  sport: string
): Promise<PolymarketEvent[]> {
  const seriesId = SPORT_SERIES_MAP[sport];
  if (seriesId) {
    const seriesEvents = await fetchSeriesEvents(seriesId, 100);
    const tagId = SPORT_TAG_MAP[sport];
    if (tagId) {
      const tagEvents = await fetchSportsEvents(tagId, 100);
      return [...seriesEvents, ...tagEvents];
    }
    return seriesEvents;
  }
  
  const tagId = SPORT_TAG_MAP[sport];
  if (!tagId) return [];
  return fetchSportsEvents(tagId, 100);
}

/** Fetch active events (parent questions) from Gamma API for event-level listing. */
export async function fetchPolymarketEvents(
  limit = 100,
  offset = 0,
  options?: { active?: boolean; closed?: boolean; order?: string; ascending?: boolean }
): Promise<PolymarketEvent[]> {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  if (typeof options?.active === "boolean") {
    params.set("active", String(options.active));
  }
  if (typeof options?.closed === "boolean") {
    params.set("closed", String(options.closed));
  }
  if (options?.order) {
    params.set("order", options.order);
  }
  if (typeof options?.ascending === "boolean") {
    params.set("ascending", String(options.ascending));
  }
  const res = await fetch(`${GAMMA_API_BASE}/events?${params}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await getResponseErrorBody(res);
    throw new Error(`Polymarket events error: ${res.status}.${body}`);
  }
  return res.json();
}

export function parseMarketOutcomes(market: PolymarketMarket): PolymarketOutcome[] {
  const outcomesStr = market.outcomes || "[]";
  const pricesStr = market.outcomePrices || "[]";
  const tokenIdsStr = market.clobTokenIds || "[]";
  let outcomes: string[] = [];
  let prices: number[] = [];
  let tokenIds: string[] = [];

  try {
    outcomes = JSON.parse(outcomesStr.replace(/'/g, '"'));
  } catch {
    outcomes = outcomesStr.split(",").map((s) => s.trim().replace(/^["']|["']$/g, ""));
  }

  try {
    prices = JSON.parse(pricesStr.replace(/'/g, '"')).map((p: string) => parseFloat(p));
  } catch {
    prices = pricesStr.split(",").map((s) => parseFloat(s.trim()) || 0);
  }

  try {
    tokenIds = JSON.parse(tokenIdsStr.replace(/'/g, '"'));
  } catch {
    tokenIds = tokenIdsStr.split(",").map((s) => s.trim().replace(/^["']|["']$/g, ""));
  }

  return outcomes.map((name, i) => ({
    name,
    price: prices[i] ?? 0,
    tokenID: tokenIds[i] || undefined,
  }));
}

export function getPolymarketUrl(event: PolymarketEvent, market?: PolymarketMarket): string {
  const slug = event.slug || event.id;
  const base = `https://polymarket.com/event/${slug}`;
  return market ? `${base}?market=${market.id}` : base;
}
