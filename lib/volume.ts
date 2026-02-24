import { fetchPolymarketMarkets } from "./polymarket";
import { fetchKalshiTrades } from "./kalshi";

export interface PeriodVolumeStats {
  day: number;
  month: number;
  allTime: number;
  lastUpdated: string;
  /** Optional: last 24h volume from Gamma API (Polymarket only) */
  volume24h?: number;
}

export interface ExchangeVolumeData {
  polymarket: PeriodVolumeStats;
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

// In-memory cache with 5-minute TTL
let cachedVolumeData: ExchangeVolumeData | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function getPolymarketPeriodVolumeStats(): Promise<PeriodVolumeStats> {
  let day = 0;
  let month = 0;
  let allTime = 0;
  let volume24h = 0;

  try {
    // Fetch ALL active markets: paginate until we have everything (Gamma API volume24hr, volume1wk, volume1mo, volumeNum)
    const limit = 1000;
    const maxPages = 500; // safety cap (~500k markets); we break when a page returns < limit

    let offset = 0;
    for (let page = 0; page < maxPages; page += 1) {
      const markets = await fetchPolymarketMarkets(limit, offset, {
        active: true,
        order: "volume24hr",
        ascending: false,
      });
      if (!markets || markets.length === 0) break;

      for (const market of markets) {
        const day24hr = toNumber(market.volume24hr ?? market.volume24h);
        const weekVol = toNumber(market.volume1wk ?? market.volume24hr ?? market.volume24h);
        const month1mo = toNumber(market.volume1mo);
        const marketAllTime = toNumber(market.volumeNum ?? market.volume);

        volume24h += day24hr;
        day += weekVol;
        month += month1mo;
        allTime += marketAllTime;
      }

      if (markets.length < limit) break;
      offset += limit;
    }

    // Fetch ALL closed markets for all-time: paginate until we have everything
    offset = 0;
    for (let page = 0; page < maxPages; page += 1) {
      const markets = await fetchPolymarketMarkets(limit, offset, {
        active: false,
        order: "volumeNum",
        ascending: false,
      });
      if (!markets || markets.length === 0) break;

      for (const market of markets) {
        const marketAllTime = toNumber(market.volumeNum ?? market.volume);
        allTime += marketAllTime;
      }

      if (markets.length < limit) break;
      offset += limit;
    }
  } catch (error) {
    console.error("Polymarket period volume error:", error);
  }

  return {
    day,
    month,
    allTime,
    volume24h,
    lastUpdated: new Date().toISOString(),
  };
}

async function sumKalshiTradesDollarVolume(minTs: number, maxTs: number, maxPages: number): Promise<number> {
  let total = 0;
  let cursor: string | undefined;
  let pages = 0;

  do {
    const result = await fetchKalshiTrades({
      limit: 1000,
      cursor,
      min_ts: minTs,
      max_ts: maxTs,
    });

    for (const trade of result.trades || []) {
      const contracts =
        typeof trade.count_fp === "string"
          ? parseFloat(trade.count_fp)
          : typeof trade.count === "number"
            ? trade.count
            : 0;
      const priceDollars =
        typeof trade.price === "number"
          ? trade.price
          : typeof trade.yes_price_dollars === "string"
            ? parseFloat(trade.yes_price_dollars)
            : typeof trade.yes_price === "number"
              ? trade.yes_price / 100
              : 0;
      total += contracts * priceDollars;
    }

    cursor = result.cursor ?? undefined;
    pages += 1;
    if (pages >= maxPages || !cursor) break;
  } while (true);

  return total;
}

export async function getKalshiPeriodVolumeStats(): Promise<PeriodVolumeStats> {
  const nowTs = Math.floor(Date.now() / 1000);
  const startOfDayTs = nowTs - 24 * 60 * 60;
  const startOfMonthTs = nowTs - 30 * 24 * 60 * 60;
  // Kalshi launched in late 2021, use a timestamp from then for all-time
  const kalshiLaunchTs = 1630000000; // ~Aug 2021

  let day = 0;
  let month = 0;
  let allTime = 0;

  try {
    const [dayResult, monthResult, allTimeResult] = await Promise.allSettled([
      sumKalshiTradesDollarVolume(startOfDayTs, nowTs, 25),
      sumKalshiTradesDollarVolume(startOfMonthTs, nowTs, 75),
      sumKalshiTradesDollarVolume(kalshiLaunchTs, nowTs, 250),
    ]);

    day = dayResult.status === "fulfilled" ? dayResult.value : 0;
    month = monthResult.status === "fulfilled" ? monthResult.value : 0;
    
    if (allTimeResult.status === "fulfilled") {
      allTime = allTimeResult.value;
    } else {
      console.error("Kalshi all-time fetch failed:", allTimeResult.reason);
      allTime = month; // Fallback to month if all-time fails
    }
    
    // Ensure monotonic (all-time >= month >= day)
    if (allTime < month) allTime = month;
    if (month < day) month = day;
  } catch (error) {
    console.error("Kalshi period volume error:", error);
  }

  return {
    day,
    month,
    allTime,
    lastUpdated: new Date().toISOString(),
  };
}

export async function getExchangeVolumeData(): Promise<ExchangeVolumeData> {
  const now = Date.now();
  
  // Return cached data if still valid
  if (cachedVolumeData && (now - cacheTimestamp) < CACHE_TTL_MS) {
    return cachedVolumeData;
  }

  // Fetch fresh data (Polymarket only)
  const polymarket = await getPolymarketPeriodVolumeStats().catch(() => ({
    day: 0,
    month: 0,
    allTime: 0,
    volume24h: 0,
    lastUpdated: new Date().toISOString(),
  }));

  const data = { polymarket };
  
  // Update cache
  cachedVolumeData = data;
  cacheTimestamp = now;

  return data;
}

export function formatVolume(volume: number): string {
  if (volume >= 1_000_000_000) return `$${(volume / 1_000_000_000).toFixed(2)}B`;
  if (volume >= 1_000_000) return `$${(volume / 1_000_000).toFixed(2)}M`;
  if (volume >= 1_000) return `$${(volume / 1_000).toFixed(2)}K`;
  return `$${volume.toFixed(2)}`;
}
