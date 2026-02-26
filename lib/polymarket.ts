const GAMMA_API_BASE = "https://gamma-api.polymarket.com";
const DATA_API_BASE = "https://data-api.polymarket.com";

/** Normalize wallet for Data API (lowercase 0x + 40 hex). */
function normalizeWalletForDataApi(wallet: string): string {
  if (!wallet || !/^0x[a-fA-F0-9]{40}$/.test(wallet)) return wallet;
  return wallet.toLowerCase();
}

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
  /** Some Gamma responses use volume24hr; treat as equivalent to volume24h when present. */
  volume24hr?: number;
  volume1wk?: number;
  volume1mo?: number;
  liquidity?: number;
  liquidityNum?: number;
  /** May be present on some Gamma responses; used for Active Markets counts when available. */
  active?: boolean;
  /** Some Gamma responses may include closed flag at the market level. */
  closed?: boolean;
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
  /** Gamma API: when false or missing, event may still be open; when true, event is closed. */
  closed: boolean;
  /** Gamma API: when false, event is not active for trading; when true or missing, treat as active. */
  active?: boolean;
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

export interface CreatorStats {
  id: string;
  name: string;
  handle: string | null;
  image: string | null;
  url: string | null;
  totalMarkets: number;
  activeMarkets: number;
  /** Aggregate volume of all markets created by this creator (from Gamma API) */
  totalVolume: number;
  openInterest: number;
  /** Wallet address fetched via search API profile lookup; may be null if not found. */
  walletAddress?: string | null;
  /** Total PnL calculated from Data API positions endpoint; null if wallet not found. */
  totalPnl?: number | null;
}

interface SearchProfile {
  id: string;
  name: string | null;
  proxyWallet: string | null;
  pseudonym: string | null;
}

interface Position {
  cashPnl: number;
  realizedPnl: number;
  size: number;
  currentValue: number;
  initialValue: number;
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
  soccer_usa_mls: "10189",
  soccer_epl: "10188",
  soccer_spain_la_liga: "10193",
  soccer_france_ligue_one: "10195",
  soccer_italy_serie_a: "10203",
  soccer_germany_bundesliga: "10194",
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

function toNumber(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export async function getSportsMetadata(): Promise<SportsMetadata[]> {
  const res = await fetch(`${GAMMA_API_BASE}/sports`);
  if (!res.ok) {
    const body = await getResponseErrorBody(res);
    throw new Error(`Polymarket sports error: ${res.status}.${body}`);
  }
  return res.json();
}

export async function fetchPolymarketMarkets(
  limit = 100,
  offset = 0,
  options?: { active?: boolean; order?: string; ascending?: boolean }
): Promise<PolymarketMarket[]> {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });

  if (typeof options?.active === "boolean") {
    params.set("active", String(options.active));
  }
  if (options?.order) {
    params.set("order", options.order);
  }
  if (typeof options?.ascending === "boolean") {
    params.set("ascending", String(options.ascending));
  }

  const res = await fetch(`${GAMMA_API_BASE}/markets?${params.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await getResponseErrorBody(res);
    throw new Error(`Polymarket markets error: ${res.status}.${body}`);
  }
  return res.json();
}

export async function fetchSportsEvents(
  tagId: string,
  limit = 50
): Promise<PolymarketEvent[]> {
  const params = new URLSearchParams({
    tag_id: tagId,
    active: "true",
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
    active: "true",
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

/**
 * Fetches a user's total trading volume from the Polymarket leaderboard API
 * @param walletAddress The user's wallet address (0x-prefixed)
 * @returns The user's total trading volume, or 0 if not found
 */
export async function fetchUserTradingVolume(walletAddress: string): Promise<number> {
  if (!walletAddress) return 0;
  const user = normalizeWalletForDataApi(walletAddress);
  if (!/^0x[a-fA-F0-9]{40}$/.test(user)) return 0;
  try {
    const params = new URLSearchParams({
      user,
      timePeriod: "ALL",
      orderBy: "VOL",
      category: "OVERALL",
      limit: "1",
    });
    const res = await fetch(`${DATA_API_BASE}/v1/leaderboard?${params}`, { cache: "no-store" });
    if (!res.ok) return 0;
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0 && data[0].vol !== undefined) {
      return Number(data[0].vol) || 0;
    }
    return 0;
  } catch (error) {
    console.error(`Error fetching trading volume for ${walletAddress}:`, error);
    return 0;
  }
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

async function fetchCreatorWallet(
  creatorName: string,
  creatorHandle: string | null
): Promise<string | null> {
  // Try multiple search strategies to find the wallet address
  const searchQueries: string[] = [];
  
  if (creatorHandle) {
    // Try handle variations
    searchQueries.push(`@${creatorHandle}`);
    searchQueries.push(creatorHandle.replace(/^@/, "")); // Remove @ if already present
  }
  
  // Try name variations
  searchQueries.push(creatorName);
  // Try first word of name if multi-word
  const firstName = creatorName.split(/\s+/)[0];
  if (firstName && firstName !== creatorName) {
    searchQueries.push(firstName);
  }

  for (const searchQuery of searchQueries) {
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        search_profiles: "true",
        limit_per_type: "10", // Increase limit to get more results
      });
      const res = await fetch(`${GAMMA_API_BASE}/public-search?${params}`, {
        cache: "no-store",
      });
      if (!res.ok) continue;
      
      const data = await res.json();
      const profiles: SearchProfile[] = data?.profiles || [];
      
      // Try to match by name, handle, or pseudonym (more flexible matching)
      const searchName = creatorName.toLowerCase().trim();
      const searchHandle = creatorHandle?.toLowerCase().replace(/^@/, "").trim() || "";
      
      for (const profile of profiles) {
        if (!profile.proxyWallet) continue;
        
        const profileName = (profile.name || "").toLowerCase().trim();
        const profilePseudonym = (profile.pseudonym || "").toLowerCase().trim();
        
        // Exact match on name
        if (profileName === searchName) {
          return profile.proxyWallet;
        }
        
        // Exact match on handle/pseudonym
        if (searchHandle && (profilePseudonym === searchHandle || profilePseudonym === `@${searchHandle}`)) {
          return profile.proxyWallet;
        }
        
        // Partial match - name contains search name or vice versa
        if (searchName && (profileName.includes(searchName) || searchName.includes(profileName))) {
          return profile.proxyWallet;
        }
        
        // Handle match with pseudonym
        if (searchHandle && profilePseudonym && (
          profilePseudonym.includes(searchHandle) || 
          searchHandle.includes(profilePseudonym.replace(/^@/, ""))
        )) {
          return profile.proxyWallet;
        }
        
        // Fuzzy word matching: check if any significant word matches
        const searchWords = searchName.split(/\s+/).filter(w => w.length > 2);
        const profileWords = profileName.split(/\s+/).filter(w => w.length > 2);
        const pseudoWords = profilePseudonym.split(/\s+/).filter(w => w.length > 2);
        
        if (searchWords.length > 0) {
          // Check if any search word matches any profile word
          for (const sw of searchWords) {
            if (profileWords.some(pw => pw === sw || pw.includes(sw) || sw.includes(pw))) {
              return profile.proxyWallet;
            }
            if (pseudoWords.some(psw => psw === sw || psw.includes(sw) || sw.includes(psw))) {
              return profile.proxyWallet;
            }
          }
        }
      }
    } catch {
      // Continue to next search query
      continue;
    }
  }
  
  return null;
}

async function fetchCreatorPnL(walletAddress: string): Promise<number | null> {
  try {
    let totalPnl = 0;
    let totalPositions = 0;
    
    console.log(`[PnL] Fetching PnL for wallet: ${walletAddress}`);
    
    // Fetch all positions with pagination
    // Use only /positions endpoint - it provides complete PnL via cashPnl + realizedPnl
    const limit = 500;
    const maxOffset = 10000;
    let offset = 0;
    
    while (offset <= maxOffset) {
      const params = new URLSearchParams({
        user: walletAddress,
        limit: String(limit),
        offset: String(offset),
        sortBy: "CASHPNL",
        sortDirection: "DESC",
        sizeThreshold: "0",
      });
      
      const res = await fetch(`${DATA_API_BASE}/positions?${params}`, {
        cache: "no-store",
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.warn(`[PnL] Failed to fetch positions for ${walletAddress} at offset ${offset}: ${res.status} - ${errorText}`);
        break;
      }
      
      const positions: Position[] = await res.json();
      
      if (positions.length === 0) {
        break;
      }
      
      totalPositions += positions.length;
      
      // Log first position to see structure (only on first page)
      if (offset === 0 && positions.length > 0) {
        console.log(`[PnL] Sample position for ${walletAddress.slice(0, 10)}:`, {
          cashPnl: positions[0].cashPnl,
          realizedPnl: positions[0].realizedPnl,
          size: positions[0].size,
        });
      }
      
      // Sum cashPnl (unrealized) + realizedPnl (realized) for each position
      // This gives us the complete PnL per the API docs: TOTAL_PNL = cashPnl + realizedPnl
      for (const position of positions) {
        const cashPnl = toNumber(position.cashPnl);
        const realizedPnl = toNumber(position.realizedPnl);
        totalPnl += cashPnl + realizedPnl;
      }
      
      // If we got fewer results than the limit, we've reached the end
      if (positions.length < limit) {
        break;
      }
      
      offset += limit;
    }
    
    console.log(`[PnL] Wallet ${walletAddress.slice(0, 10)}... - Total positions: ${totalPositions}, Total PnL: $${totalPnl.toFixed(2)}`);
    
    return totalPnl;
  } catch (error) {
    console.warn(`[PnL] Error fetching positions for ${walletAddress}:`, error);
    return null;
  }
}

export async function aggregateCreatorStats(): Promise<CreatorStats[]> {
  const limit = 100;
  const maxPagesActive = 20;
  const maxPagesClosed = 10;

  const creatorsMap = new Map<string, CreatorStats>();

  async function processEventsPage(
    offset: number,
    options: { active?: boolean; closed?: boolean; order?: string; ascending?: boolean }
  ): Promise<boolean> {
    const events = await fetchPolymarketEvents(limit, offset, options);
    if (!events || events.length === 0) return false;

    for (const event of events) {
      const eventCreators = event.eventCreators;
      if (!eventCreators || eventCreators.length === 0) continue;

      // Gamma API: Event has markets[] and eventCreators[]. Total Markets = count of markets in each event the creator is attributed to.
      const markets = event.markets ?? [];
      const isEventClosed = Boolean(event.closed);
      const eventVolume = toNumber(event.volume);

      // Use event.volume (authoritative total) when available; else sum of market-level volumes
      // Never count both - event.volume is the event total, summing with market data would double-count
      let eventVolumeToUse = 0;
      if (eventVolume > 0) {
        eventVolumeToUse = eventVolume;
      } else {
        const totalMarketVolume = markets.reduce(
          (sum, m) => sum + toNumber(m.volumeNum ?? m.volume24hr ?? m.volume24h ?? m.volume),
          0
        );
        eventVolumeToUse = totalMarketVolume;
      }

      for (const market of markets) {
        const marketOpenInterest =
          toNumber(market.liquidityNum ?? market.liquidity) ||
          toNumber(event.liquidity ?? event.openInterest);

        // Gamma API: Event and Market have active (boolean) and closed (boolean). Active Markets = markets that are not closed and (when present) active.
        const isEventActive = event.active !== false;
        const isMarketClosed = market.closed === true;
        const isMarketActiveFlag = market.active !== false;
        const isMarketActive = !isEventClosed && isEventActive && !isMarketClosed && isMarketActiveFlag;

        for (const creator of eventCreators) {
          const creatorId = creator.id || creator.creatorHandle || creator.creatorUrl;
          if (!creatorId) continue;

          let stats = creatorsMap.get(creatorId);
          if (!stats) {
            const name = creator.creatorName || creator.creatorHandle || "Unknown Creator";
            stats = {
              id: creatorId,
              name,
              handle: creator.creatorHandle,
              image: creator.creatorImage,
              url: creator.creatorUrl,
              totalMarkets: 0,
              activeMarkets: 0,
              totalVolume: 0,
              openInterest: 0,
              walletAddress: null,
            };
            creatorsMap.set(creatorId, stats);
          }

          stats.totalMarkets += 1;
          if (isMarketActive) {
            stats.activeMarkets += 1;
          }

          stats.openInterest += marketOpenInterest;
        }
      }

      // Add volume once per event per creator (not per market)
      if (eventVolumeToUse > 0) {
        for (const creator of eventCreators) {
          const creatorId = creator.id || creator.creatorHandle || creator.creatorUrl;
          if (!creatorId) continue;
          const stats = creatorsMap.get(creatorId);
          if (stats) {
            stats.totalVolume += eventVolumeToUse;
          }
        }
      }
    }

    return events.length === limit;
  }

  let offset = 0;
  for (let page = 0; page < maxPagesActive; page += 1) {
    const hasMore = await processEventsPage(offset, {
      active: true,
      closed: false,
      order: "volume",
      ascending: false,
    });
    if (!hasMore) break;
    offset += limit;
  }

  offset = 0;
  for (let page = 0; page < maxPagesClosed; page += 1) {
    const hasMore = await processEventsPage(offset, {
      closed: true,
      order: "volume",
      ascending: false,
    });
    if (!hasMore) break;
    offset += limit;
  }

  const creators = Array.from(creatorsMap.values());
  creators.sort((a, b) => b.totalVolume - a.totalVolume);
  return creators;
}

export async function enrichCreatorWithWallet(creator: CreatorStats): Promise<CreatorStats> {
  if (creator.walletAddress) return creator;
  
  try {
    const wallet = await fetchCreatorWallet(creator.name, creator.handle);
    if (wallet) {
      return { ...creator, walletAddress: wallet };
    }
  } catch (error) {
    console.warn(`[Creators] Wallet lookup failed for ${creator.name}:`, error);
  }
  
  return creator;
}

export async function enrichCreatorWithPnL(creator: CreatorStats): Promise<CreatorStats> {
  if (!creator.walletAddress || creator.totalPnl !== undefined) return creator;
  
  try {
    const pnl = await fetchCreatorPnL(creator.walletAddress);
    if (pnl !== null) {
      return { ...creator, totalPnl: pnl };
    }
  } catch (error) {
    console.warn(`[Creators] PnL fetch failed for ${creator.name}:`, error);
  }
  
  return creator;
}

export async function enrichCreatorWithVolume(creator: CreatorStats): Promise<CreatorStats> {
  if (!creator.walletAddress) return creator;
  
  try {
    const volume = await fetchUserTradingVolume(creator.walletAddress);
    return { ...creator, totalVolume: volume };
  } catch (error) {
    console.warn(`[Creators] Volume fetch failed for ${creator.name}:`, error);
  }
  
  return creator;
}

/**
 * Fetches portfolio value (total value of user's positions)
 * @param walletAddress The user's wallet address (0x-prefixed)
 * @returns Portfolio value in USDC, or 0 if not found
 */
export async function fetchPortfolioValue(walletAddress: string): Promise<number> {
  if (!walletAddress) return 0;
  const user = normalizeWalletForDataApi(walletAddress);
  if (!/^0x[a-fA-F0-9]{40}$/.test(user)) return 0;
  try {
    const params = new URLSearchParams({ user });
    const res = await fetch(`${DATA_API_BASE}/value?${params}`, { cache: "no-store" });
    if (!res.ok) return 0;
    const data = await res.json();
    if (typeof data === "number" && Number.isFinite(data)) return data;
    if (data && typeof data.value === "number" && Number.isFinite(data.value)) return data.value;
    if (Array.isArray(data) && data.length > 0 && data[0].value !== undefined) {
      return Number(data[0].value) || 0;
    }
    return 0;
  } catch (error) {
    console.error(`Error fetching portfolio value for ${walletAddress}:`, error);
    return 0;
  }
}

/**
 * Fetches total number of markets a user has traded
 * @param walletAddress The user's wallet address (0x-prefixed)
 * @returns Number of markets traded, or 0 if not found
 */
export async function fetchMarketsTraded(walletAddress: string): Promise<number> {
  if (!walletAddress) return 0;
  const user = normalizeWalletForDataApi(walletAddress);
  if (!/^0x[a-fA-F0-9]{40}$/.test(user)) return 0;
  try {
    const params = new URLSearchParams({ user });
    const res = await fetch(`${DATA_API_BASE}/traded?${params}`, { cache: "no-store" });
    if (!res.ok) return 0;
    const data = await res.json();
    if (data && data.traded !== undefined) return Number(data.traded) || 0;
    return 0;
  } catch (error) {
    console.error(`Error fetching markets traded for ${walletAddress}:`, error);
    return 0;
  }
}

export interface PnLDataPoint {
  timestamp: number;
  pnl: number;
  cumulativePnl: number;
}

/**
 * Fetches P&L history from closed positions (paginated, max 50 per page)
 * and builds an equity curve.
 */
export async function fetchPnLHistory(
  walletAddress: string,
  startTime?: number,
  endTime?: number
): Promise<PnLDataPoint[]> {
  if (!walletAddress) return [];
  const user = normalizeWalletForDataApi(walletAddress);
  if (!/^0x[a-fA-F0-9]{40}$/.test(user)) return [];

  try {
    // Data API GET /closed-positions: user required, limit max 50, sortBy=TIMESTAMP, sortDirection=ASC
    const allClosed: Array<{ timestamp: number; realizedPnl: number }> = [];
    const pageSize = 50;

    for (let offset = 0; offset <= 100000; offset += pageSize) {
      const params = new URLSearchParams({
        user,
        limit: String(pageSize),
        offset: String(offset),
        sortBy: "TIMESTAMP",
        sortDirection: "ASC",
      });
      const res = await fetch(`${DATA_API_BASE}/closed-positions?${params}`, { cache: "no-store" });
      if (!res.ok) break;
      const page = await res.json();
      if (!Array.isArray(page) || page.length === 0) break;
      for (const p of page) {
        // Doc: ClosedPosition.realizedPnl (number), ClosedPosition.timestamp (int64); normalize to seconds
        let ts = Number(p.timestamp) || 0;
        if (ts > 1e12) ts = Math.floor(ts / 1000);
        const realizedPnl = Number(p.realizedPnl) ?? 0;
        allClosed.push({ timestamp: ts, realizedPnl });
      }
      if (page.length < pageSize) break;
    }

    // Group by day (timestamp in seconds)
    const dailyPnl = new Map<number, number>();

    for (const pos of allClosed) {
      if (!pos.timestamp) continue;
      if (startTime && pos.timestamp < startTime) continue;
      if (endTime && pos.timestamp > endTime) continue;
      const dayKey = Math.floor(pos.timestamp / 86400) * 86400;
      dailyPnl.set(dayKey, (dailyPnl.get(dayKey) || 0) + pos.realizedPnl);
    }

    // Fetch current unrealized P&L
    let currentUnrealizedPnl = 0;
    const curParams = new URLSearchParams({ user, limit: "500" });
    const curRes = await fetch(`${DATA_API_BASE}/positions?${curParams}`, { cache: "no-store" });
    if (curRes.ok) {
      const curPositions = await curRes.json();
      if (Array.isArray(curPositions)) {
        for (const p of curPositions) {
          currentUnrealizedPnl += Number(p.cashPnl) || 0;
        }
      }
    }

    // Build cumulative curve
    const sortedDays = Array.from(dailyPnl.entries()).sort((a, b) => a[0] - b[0]);
    const dataPoints: PnLDataPoint[] = [];
    let cum = 0;

    for (const [ts, dayPnl] of sortedDays) {
      cum += dayPnl;
      dataPoints.push({ timestamp: ts, pnl: dayPnl, cumulativePnl: cum });
    }

    if (dataPoints.length > 0 && currentUnrealizedPnl !== 0) {
      dataPoints.push({
        timestamp: Math.floor(Date.now() / 1000),
        pnl: currentUnrealizedPnl,
        cumulativePnl: cum + currentUnrealizedPnl,
      });
    }

    return dataPoints;
  } catch (error) {
    console.error(`Error fetching P&L history for ${walletAddress}:`, error);
    return [];
  }
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

// --- Creator profile: public profile (Gamma), markets by creator, positions per market (Data API v1) ---

export interface PublicProfile {
  name: string | null;
  pseudonym: string | null;
  profileImage: string | null;
  xUsername: string | null;
  proxyWallet: string | null;
}

export async function fetchPublicProfile(wallet: string): Promise<PublicProfile | null> {
  if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) return null;
  try {
    const res = await fetch(`${GAMMA_API_BASE}/public-profile?address=${encodeURIComponent(wallet)}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      name: data.name ?? null,
      pseudonym: data.pseudonym ?? null,
      profileImage: data.profileImage ?? null,
      xUsername: data.xUsername ?? null,
      proxyWallet: data.proxyWallet ?? null,
    };
  } catch {
    return null;
  }
}

/** Market row for creator profile: event + market with event-level dates/status/tags. */
export interface CreatorMarketRow {
  id: string;
  conditionId: string;
  title: string;
  eventSlug: string | null;
  eventId: string;
  startDate: string | null;
  endDate: string | null;
  closed: boolean;
  volume: number;
  openInterest: number;
  tags: { id: string; label: string; slug: string }[];
  image: string | null;
}

function creatorIdMatches(creatorId: string, slug: string): boolean {
  try {
    const decoded = decodeURIComponent(slug);
    return (
      creatorId === slug ||
      creatorId === decoded ||
      creatorId === slug.replace(/^@/, "") ||
      decoded === creatorId
    );
  } catch {
    return creatorId === slug;
  }
}

/** Fetch markets created by a creator by paginating events and filtering by eventCreators. */
export async function fetchMarketsByCreatorId(
  creatorIdOrSlug: string,
  options?: { limit?: number; offset?: number }
): Promise<{ rows: CreatorMarketRow[]; hasMore: boolean; total: number }> {
  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;
  const decodedId = tryDecodeUriComponent(creatorIdOrSlug);
  const rows: CreatorMarketRow[] = [];
  const pageSize = 100;
  let currentOffset = 0;
  let seen = 0;
  let hasMoreEvents = true;

  while (hasMoreEvents && rows.length < limit) {
    const events = await fetchPolymarketEvents(pageSize, currentOffset, {
      order: "volume",
      ascending: false,
    });
    if (events.length === 0) break;
    hasMoreEvents = events.length === pageSize;
    currentOffset += pageSize;

    for (const event of events) {
      const eventCreators = event.eventCreators ?? [];
      const isCreator = eventCreators.some(
        (c) =>
          (c.id && (c.id === decodedId || c.id === creatorIdOrSlug || creatorIdMatches(c.id, creatorIdOrSlug))) ||
          (c.creatorHandle && (c.creatorHandle === decodedId || creatorIdMatches(c.creatorHandle, creatorIdOrSlug))) ||
          (c.creatorUrl && (c.creatorUrl === decodedId || creatorIdMatches(c.creatorUrl, creatorIdOrSlug)))
      );
      if (!isCreator) continue;

      const eventVolume = toNumber(event.volume ?? event.liquidity);
      const eventLiquidity = toNumber(event.liquidity ?? event.openInterest);
      const eventTags = event.tags ?? [];
      const eventImage = (event as { image?: string; icon?: string }).image ?? (event as { icon?: string }).icon ?? null;

      for (const market of event.markets ?? []) {
        if (seen < offset) {
          seen++;
          continue;
        }
        if (rows.length >= limit) break;
        const marketVolume =
          toNumber(market.volumeNum ?? (market as { volume24hr?: number }).volume24hr ?? market.volume24h) || eventVolume;
        const marketOi = toNumber(market.liquidityNum ?? market.liquidity) || eventLiquidity;
        rows.push({
          id: market.id,
          conditionId: market.conditionId ?? market.id,
          title: market.question || (event.title ?? ""),
          eventSlug: event.slug ?? null,
          eventId: event.id,
          startDate: event.startDate ?? null,
          endDate: event.endDate ?? null,
          closed: Boolean(event.closed),
          volume: marketVolume,
          openInterest: marketOi,
          tags: eventTags,
          image: eventImage,
        });
        seen++;
      }
      if (rows.length >= limit) break;
    }
  }

  return { rows, hasMore: hasMoreEvents || rows.length === limit, total: seen };
}

function tryDecodeUriComponent(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

/** Single position from Data API v1 market-positions (per market). */
export interface MarketPositionV1 {
  proxyWallet: string;
  name?: string;
  profileImage?: string;
  asset: string;
  conditionId: string;
  avgPrice: number;
  size: number;
  currPrice: number;
  currentValue: number;
  cashPnl: number;
  totalBought: number;
  realizedPnl: number;
  totalPnl: number;
  outcome: string;
  outcomeIndex?: number;
}

/**
 * User-scoped position from Data API GET /positions or /closed-positions.
 * Matches Position schema for open; closed positions include timestamp and closed: true.
 */
export interface UserPosition {
  title: string;
  outcome: string;
  size: number;
  avgPrice: number;
  initialValue: number;
  currentValue: number;
  cashPnl: number;
  realizedPnl: number;
  conditionId: string;
  asset: string;
  curPrice: number;
  totalBought: number;
  /** Present only for closed positions (from /closed-positions). int64 seconds. */
  timestamp?: number;
  /** True when from /closed-positions. */
  closed?: boolean;
}

/**
 * Fetch open positions for a user (Data API GET /positions).
 * Doc: user required, limit max 500, offset max 10000.
 */
export async function fetchUserOpenPositions(walletAddress: string): Promise<UserPosition[]> {
  if (!walletAddress) return [];
  const user = normalizeWalletForDataApi(walletAddress);
  if (!/^0x[a-fA-F0-9]{40}$/.test(user)) return [];
  const all: UserPosition[] = [];
  const limit = 500;
  let offset = 0;
  while (offset <= 10000) {
    const params = new URLSearchParams({
      user,
      limit: String(limit),
      offset: String(offset),
      sizeThreshold: "0",
    });
    const res = await fetch(`${DATA_API_BASE}/positions?${params}`, { cache: "no-store" });
    if (!res.ok) break;
    const page = await res.json();
    if (!Array.isArray(page) || page.length === 0) break;
    for (const p of page) {
      all.push({
        title: (p.title ?? p.marketTitle ?? "") as string,
        outcome: (p.outcome ?? "") as string,
        size: toNumber(p.size),
        avgPrice: toNumber(p.avgPrice),
        initialValue: toNumber(p.initialValue),
        currentValue: toNumber(p.currentValue),
        cashPnl: toNumber(p.cashPnl),
        realizedPnl: toNumber(p.realizedPnl),
        conditionId: p.conditionId ?? "",
        asset: p.asset ?? "",
        curPrice: toNumber(p.curPrice),
        totalBought: toNumber(p.totalBought),
        closed: false,
      });
    }
    if (page.length < limit) break;
    offset += limit;
  }
  return all;
}

/**
 * Fetch closed positions for a user (Data API GET /closed-positions).
 * Doc: user required, limit max 50, offset max 100000, sortBy TIMESTAMP, sortDirection DESC.
 */
export async function fetchUserClosedPositions(
  walletAddress: string,
  options?: { limit?: number; offset?: number }
): Promise<UserPosition[]> {
  if (!walletAddress) return [];
  const user = normalizeWalletForDataApi(walletAddress);
  if (!/^0x[a-fA-F0-9]{40}$/.test(user)) return [];
  const pageSize = Math.min(options?.limit ?? 50, 50);
  const offset = options?.offset ?? 0;
  const params = new URLSearchParams({
    user,
    limit: String(pageSize),
    offset: String(offset),
    sortBy: "TIMESTAMP",
    sortDirection: "DESC",
  });
  const res = await fetch(`${DATA_API_BASE}/closed-positions?${params}`, { cache: "no-store" });
  if (!res.ok) return [];
  const page = await res.json();
  if (!Array.isArray(page)) return [];
  return page.map((p: Record<string, unknown>) => ({
    title: (p.title as string) ?? (p.marketTitle as string) ?? "",
    outcome: (p.outcome as string) ?? "",
    size: toNumber(p.size ?? p.totalBought ?? 0),
    avgPrice: toNumber(p.avgPrice),
    initialValue: toNumber(p.totalBought),
    currentValue: 0,
    cashPnl: 0,
    realizedPnl: toNumber(p.realizedPnl),
    conditionId: (p.conditionId as string) ?? "",
    asset: (p.asset as string) ?? "",
    curPrice: toNumber(p.curPrice),
    totalBought: toNumber(p.totalBought),
    timestamp: typeof p.timestamp === "number" ? p.timestamp : Number(p.timestamp) || 0,
    closed: true,
  }));
}

/** Fetch positions for one market (Data API v1). */
export async function fetchMarketPositions(
  conditionId: string,
  options?: { limit?: number; offset?: number; sortBy?: string; sortDirection?: string }
): Promise<MarketPositionV1[]> {
  const params = new URLSearchParams({
    market: conditionId,
    status: "ALL",
    limit: String(options?.limit ?? 500),
    offset: String(options?.offset ?? 0),
    sortBy: options?.sortBy ?? "TOTAL_PNL",
    sortDirection: options?.sortDirection ?? "DESC",
  });
  const res = await fetch(`${DATA_API_BASE}/v1/market-positions?${params}`, {
    cache: "no-store",
  });
  if (!res.ok) return [];
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  const out: MarketPositionV1[] = [];
  for (const group of data) {
    const positions = Array.isArray(group.positions) ? group.positions : [];
    for (const p of positions) {
      out.push({
        proxyWallet: p.proxyWallet ?? "",
        name: p.name,
        profileImage: p.profileImage,
        asset: p.asset ?? "",
        conditionId: p.conditionId ?? conditionId,
        avgPrice: toNumber(p.avgPrice),
        size: toNumber(p.size),
        currPrice: toNumber(p.currPrice),
        currentValue: toNumber(p.currentValue),
        cashPnl: toNumber(p.cashPnl),
        totalBought: toNumber(p.totalBought),
        realizedPnl: toNumber(p.realizedPnl),
        totalPnl: toNumber(p.totalPnl),
        outcome: p.outcome ?? "",
        outcomeIndex: p.outcomeIndex,
      });
    }
  }
  return out;
}

const MAX_POSITIONS_AGGREGATE = 10_000;
const POSITIONS_PAGE_SIZE = 500;

/** Fetch top positions by absolute totalPnl across a creator's markets (up to 10k). */
export async function fetchCreatorMarketPositions(
  conditionIds: string[],
  options?: { sortBy?: "totalPnl" | "realizedPnl" | "cashPnl"; limit?: number }
): Promise<MarketPositionV1[]> {
  const limit = Math.min(options?.limit ?? MAX_POSITIONS_AGGREGATE, MAX_POSITIONS_AGGREGATE);
  const all: MarketPositionV1[] = [];
  for (const cid of conditionIds) {
    let offset = 0;
    while (offset < 10000) {
      const page = await fetchMarketPositions(cid, {
        limit: POSITIONS_PAGE_SIZE,
        offset,
        sortBy: "TOTAL_PNL",
        sortDirection: "DESC",
      });
      for (const p of page) {
        all.push(p);
      }
      if (page.length < POSITIONS_PAGE_SIZE) break;
      offset += POSITIONS_PAGE_SIZE;
    }
  }
  all.sort((a, b) => Math.abs(b.totalPnl) - Math.abs(a.totalPnl));
  return all.slice(0, limit);
}
