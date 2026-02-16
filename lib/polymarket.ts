/**
 * Polymarket API client - fetches sports prediction markets
 * No API key needed, can refresh every 30-60 seconds
 */

const GAMMA_API_BASE = "https://gamma-api.polymarket.com";

export interface PolymarketOutcome {
  name: string;
  price: number; // 0-1 probability
  tokenID?: string;
}

export interface PolymarketMarket {
  id: string;
  question: string;
  conditionId: string;
  slug: string | null;
  outcomes: string; // "Yes,No" or team names
  outcomePrices: string; // "0.45,0.55"
  clobTokenIds: string | null;
  groupItemTitle?: string;
  teamAID?: string;
  teamBID?: string;
  gameStartTime?: string;
  gameId?: string;
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
}

export interface SportsMetadata {
  sport: string;
  tags: string; // comma-separated tag IDs
  image?: string;
  resolution?: string;
}

// Sport key to Polymarket tag mapping (from /sports endpoint)
const SPORT_TAG_MAP: Record<string, string> = {
  basketball_nba: "745",
  basketball_nba_championship_winner: "745",
  soccer_usa_mls: "100100",
  americanfootball_nfl: "450",
  icehockey_nhl: "899",
  baseball_mlb: "100381",
  baseball_mlb_world_series_winner: "100381",
  icehockey_nhl_championship_winner: "899",
};

export async function getSportsMetadata(): Promise<SportsMetadata[]> {
  const res = await fetch(`${GAMMA_API_BASE}/sports`);
  if (!res.ok) throw new Error(`Polymarket sports error: ${res.status}`);
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
  if (!res.ok) throw new Error(`Polymarket events error: ${res.status}`);
  return res.json();
}

export async function fetchPolymarketBySport(
  sport: string
): Promise<PolymarketEvent[]> {
  const tagId = SPORT_TAG_MAP[sport];
  if (!tagId) return [];
  return fetchSportsEvents(tagId, 100);
}

export function parseMarketOutcomes(market: PolymarketMarket): PolymarketOutcome[] {
  const outcomes = (market.outcomes || "").split(",").map((s) => s.trim());
  const prices = (market.outcomePrices || "")
    .split(",")
    .map((s) => parseFloat(s.trim()) || 0);
  return outcomes.map((name, i) => ({
    name,
    price: prices[i] ?? 0,
  }));
}

export function getPolymarketUrl(event: PolymarketEvent, market?: PolymarketMarket): string {
  const slug = event.slug || event.id;
  const base = `https://polymarket.com/event/${slug}`;
  return market ? `${base}?market=${market.id}` : base;
}
