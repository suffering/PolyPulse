const DATA_API_BASE = "https://data-api.polymarket.com";

export interface LeaderboardEntry {
  rank: number;
  proxyWallet: string;
  userName: string | null;
  vol: number;
  pnl: number;
  profileImage: string | null;
  xUsername: string | null;
  /** Total number of trades for this user (from GET /trades). null if unavailable. */
  totalTrades?: number | null;
}

export interface TraderStats {
  tradingVolume: number;
  portfolioValue: number;
  marketsTraded: number;
  totalPnl: number;
  userName: string | null;
  profileImage: string | null;
  xUsername: string | null;
}

export interface PnLDataPoint {
  date: string;
  timestamp: number;
  pnl: number;
}

export interface ClosedPosition {
  title: string;
  outcome: string;
  realizedPnl: number;
  timestamp: number;
  avgPrice: number;
  curPrice: number;
  totalBought: number;
  conditionId: string;
  asset: string;
  /** API endDate (e.g. market end); only used for 1W/1M fallback, not for 1D or ALL */
  endDate?: string;
}

export interface OpenPosition {
  title: string;
  slug?: string;
  icon?: string;
  outcome: string;
  outcomeIndex?: number;
  size: number;
  avgPrice: number;
  initialValue: number;
  currentValue: number;
  cashPnl: number;
  percentPnl?: number;
  realizedPnl: number;
  conditionId: string;
  asset: string;
  curPrice: number;
  totalBought: number;
  eventSlug?: string;
  redeemable?: boolean;
  mergeable?: boolean;
}

export type LeaderboardCategory = 
  | "OVERALL" 
  | "POLITICS" 
  | "SPORTS" 
  | "CRYPTO" 
  | "CULTURE" 
  | "MENTIONS" 
  | "WEATHER" 
  | "ECONOMICS" 
  | "TECH" 
  | "FINANCE";

export type LeaderboardTimePeriod = "DAY" | "WEEK" | "MONTH" | "ALL";
export type LeaderboardOrderBy = "PNL" | "VOL";

export interface LeaderboardParams {
  category?: LeaderboardCategory;
  timePeriod?: LeaderboardTimePeriod;
  orderBy?: LeaderboardOrderBy;
  limit?: number;
  offset?: number;
  user?: string;
  userName?: string;
}

async function getResponseErrorBody(res: Response): Promise<string> {
  try {
    const body = await res.text();
    return body ? ` ${body}` : "";
  } catch {
    return "";
  }
}

/** Normalize wallet for Data API (lowercase 0x + 40 hex). */
export function normalizeWallet(wallet: string): string {
  if (!wallet || !/^0x[a-fA-F0-9]{40}$/.test(wallet)) return wallet;
  return wallet.toLowerCase();
}

/** API returns at most 1000 per request; we paginate to sum count. */
const TRADES_PAGE_SIZE = 1000;
const TRADES_MAX_PAGES = 20;

/**
 * Fetches total trade count for a user via GET /trades.
 * Paginates (1000 per page) and sums; API caps response at 1000 per request.
 * Returns null if the request fails or wallet is invalid.
 */
export async function fetchTradeCount(address: string): Promise<number | null> {
  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) return null;
  const user = normalizeWallet(address);
  try {
    let total = 0;
    let offset = 0;
    for (let page = 0; page < TRADES_MAX_PAGES; page++) {
      const params = new URLSearchParams({
        user,
        limit: String(TRADES_PAGE_SIZE),
        offset: String(offset),
      });
      const res = await fetch(`${DATA_API_BASE}/trades?${params}`, {
        cache: "no-store",
      });
      if (!res.ok) return page === 0 ? null : total || null;
      const data = await res.json();
      if (!Array.isArray(data)) return page === 0 ? null : total || null;
      total += data.length;
      if (data.length < TRADES_PAGE_SIZE) break;
      offset += TRADES_PAGE_SIZE;
    }
    return total;
  } catch (error) {
    console.error(`Error fetching trade count for ${address}:`, error);
    return null;
  }
}

export async function fetchLeaderboard(
  params: LeaderboardParams = {}
): Promise<LeaderboardEntry[]> {
  const searchParams = new URLSearchParams();
  
  if (params.category) searchParams.set("category", params.category);
  if (params.timePeriod) searchParams.set("timePeriod", params.timePeriod);
  if (params.orderBy) searchParams.set("orderBy", params.orderBy);
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.offset) searchParams.set("offset", String(params.offset));
  if (params.user) searchParams.set("user", params.user);
  if (params.userName) searchParams.set("userName", params.userName);

  const url = `${DATA_API_BASE}/v1/leaderboard?${searchParams}`;
  
  const res = await fetch(url, {
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await getResponseErrorBody(res);
    throw new Error(`Leaderboard API error: ${res.status}.${body}`);
  }

  const jsonData = await res.json();

  return jsonData;
}

/**
 * Fetch PnL for a user from the leaderboard API for a given time period.
 * Returns the same value Polymarket uses on profile (1D, 1W, 1M, ALL). Returns null on failure.
 */
export async function fetchLeaderboardPnl(
  address: string,
  timePeriod: LeaderboardTimePeriod
): Promise<number | null> {
  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) return null;
  try {
    const entries = await fetchLeaderboard({
      user: normalizeWallet(address),
      timePeriod,
      orderBy: "PNL",
      limit: 1,
    });
    const entry = entries?.[0];
    const pnl = entry?.pnl;
    return typeof pnl === "number" ? pnl : null;
  } catch (error) {
    console.error(`[Leaderboard PnL] Error for ${address} ${timePeriod}:`, error);
    return null;
  }
}

export async function fetchTraderVolume(address: string): Promise<number> {
  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) return 0;

  try {
    const params = new URLSearchParams({
      user: address,
      timePeriod: "ALL",
      orderBy: "VOL",
      limit: "1",
    });

    const res = await fetch(`${DATA_API_BASE}/v1/leaderboard?${params}`, {
      cache: "no-store",
    });

    if (!res.ok) return 0;

    const data = await res.json();
    if (Array.isArray(data) && data.length > 0 && data[0].vol !== undefined) {
      return Number(data[0].vol) || 0;
    }

    return 0;
  } catch (error) {
    console.error(`Error fetching trading volume for ${address}:`, error);
    return 0;
  }
}

export async function fetchPortfolioValue(address: string): Promise<number> {
  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) return 0;

  try {
    const params = new URLSearchParams({ user: normalizeWallet(address) });
    const res = await fetch(`${DATA_API_BASE}/value?${params}`, {
      cache: "no-store",
    });

    if (!res.ok) return 0;

    const data = await res.json();
    if (Array.isArray(data) && data.length > 0 && data[0].value !== undefined) {
      return Number(data[0].value) || 0;
    }

    return 0;
  } catch (error) {
    console.error(`Error fetching portfolio value for ${address}:`, error);
    return 0;
  }
}

export async function fetchMarketsTraded(address: string): Promise<number> {
  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) return 0;

  try {
    const params = new URLSearchParams({ user: normalizeWallet(address) });
    const res = await fetch(`${DATA_API_BASE}/traded?${params}`, {
      cache: "no-store",
    });

    if (!res.ok) return 0;

    const data = await res.json();
    if (data.traded !== undefined) {
      return Number(data.traded) || 0;
    }

    return 0;
  } catch (error) {
    console.error(`Error fetching markets traded for ${address}:`, error);
    return 0;
  }
}

export async function fetchTraderStats(address: string): Promise<TraderStats> {
  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    throw new Error("Invalid wallet address");
  }

  const normalized = normalizeWallet(address);
  const [volumeData, portfolioValue, marketsTraded] = await Promise.all([
    fetchLeaderboard({ user: normalized, timePeriod: "ALL", orderBy: "VOL", limit: 1 }),
    fetchPortfolioValue(address),
    fetchMarketsTraded(address),
  ]);

  const entry = volumeData[0];

  return {
    tradingVolume: entry?.vol || 0,
    portfolioValue,
    marketsTraded,
    totalPnl: entry?.pnl || 0,
    userName: entry?.userName || null,
    profileImage: entry?.profileImage || null,
    xUsername: entry?.xUsername || null,
  };
}

/**
 * Parse closed position timestamp from API. Docs: timestamp is integer int64.
 * Use only timestamp — do not use endDate (market resolution date), which is not close time.
 * If value > 1e12 treat as milliseconds and convert to seconds.
 */
function closedPositionTimestamp(p: { timestamp?: number }): number {
  let ts = Number(p.timestamp) ?? 0;
  if (ts > 1e12) ts = Math.floor(ts / 1000);
  return ts;
}

export async function fetchClosedPositions(
  address: string,
  startTime?: number
): Promise<ClosedPosition[]> {
  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) return [];

  const allPositions: ClosedPosition[] = [];
  // API max limit per docs: 50; offset max 100000
  const pageSize = 50;
  const maxOffset = 100000;

  for (let offset = 0; offset <= maxOffset; offset += pageSize) {
    const params = new URLSearchParams({
      user: normalizeWallet(address),
      limit: String(pageSize),
      offset: String(offset),
      sortBy: "TIMESTAMP",
      sortDirection: "ASC",
    });

    const res = await fetch(`${DATA_API_BASE}/closed-positions?${params}`, {
      cache: "no-store",
    });

    if (!res.ok) break;

    const page = await res.json();
    if (!Array.isArray(page) || page.length === 0) break;

    for (const p of page) {
      const ts = closedPositionTimestamp(p);
      if (startTime && ts > 0 && ts < startTime) continue;

      allPositions.push({
        title: p.title || "",
        outcome: p.outcome || "",
        realizedPnl: Number(p.realizedPnl) || 0,
        timestamp: ts,
        avgPrice: Number(p.avgPrice) || 0,
        curPrice: Number(p.curPrice) || 0,
        totalBought: Number(p.totalBought) || 0,
        conditionId: p.conditionId || "",
        asset: p.asset || "",
        endDate: typeof p.endDate === "string" ? p.endDate : undefined,
      });
    }

    if (page.length < pageSize) break;
  }

  return allPositions;
}

export async function fetchOpenPositions(address: string): Promise<OpenPosition[]> {
  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) return [];

  const allPositions: OpenPosition[] = [];
  const limit = 500;
  const maxOffset = 10000;

  for (let offset = 0; offset <= maxOffset; offset += limit) {
    const params = new URLSearchParams({
      user: normalizeWallet(address),
      limit: String(limit),
      offset: String(offset),
      sizeThreshold: "0",
    });

    const res = await fetch(`${DATA_API_BASE}/positions?${params}`, {
      cache: "no-store",
    });

    if (!res.ok) break;

    const page = await res.json();
    if (!Array.isArray(page) || page.length === 0) break;

    for (const p of page) {
      allPositions.push({
        title: p.title || "",
        slug: p.slug || undefined,
        icon: p.icon || undefined,
        outcome: p.outcome || "",
        outcomeIndex: Number.isFinite(Number(p.outcomeIndex))
          ? Number(p.outcomeIndex)
          : undefined,
        size: Number(p.size) || 0,
        avgPrice: Number(p.avgPrice) || 0,
        initialValue: Number(p.initialValue) || 0,
        currentValue: Number(p.currentValue) || 0,
        cashPnl: Number(p.cashPnl) || 0,
        percentPnl: Number.isFinite(Number(p.percentPnl))
          ? Number(p.percentPnl)
          : undefined,
        realizedPnl: Number(p.realizedPnl) || 0,
        conditionId: p.conditionId || "",
        asset: p.asset || "",
        curPrice: Number(p.curPrice) || 0,
        totalBought: Number(p.totalBought) || 0,
        eventSlug: p.eventSlug,
        redeemable:
          typeof p.redeemable === "boolean" ? p.redeemable : undefined,
        mergeable: typeof p.mergeable === "boolean" ? p.mergeable : undefined,
      });
    }

    if (page.length < limit) break;
  }

  return allPositions;
}
