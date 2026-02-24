const KALSHI_API_BASE = "https://api.elections.kalshi.com/trade-api/v2";

export interface KalshiMarket {
  ticker: string;
  title: string;
  subtitle: string | null;
  event_ticker: string;
  series_ticker: string;
  yes_price: number;
  no_price: number;
  volume?: number;
  volume_fp?: number; // Fixed-point volume
  volume_24h?: number;
  volume_24h_fp?: string;
  open_time: string;
  close_time: string;
  created_time?: string;
  updated_time?: string;
  status: string;
  category: string;
  subcategory: string | null;
}

export interface KalshiMarketsResponse {
  markets: KalshiMarket[];
  cursor: string | null;
}

export interface KalshiHistoricalMarket {
  ticker: string;
  title: string;
  event_ticker: string;
  series_ticker: string;
  volume?: number;
  volume_fp?: number; // Fixed-point volume
  close_time: string;
  status: string;
}

export interface KalshiHistoricalMarketsResponse {
  markets: KalshiHistoricalMarket[];
  cursor: string | null;
}

export interface KalshiVolumeStats {
  daily: number;
  monthly: number;
  yearly: number;
  lastUpdated: string;
}

async function getResponseErrorBody(res: Response): Promise<string> {
  try {
    const body = await res.text();
    return body ? ` ${body}` : "";
  } catch {
    return "";
  }
}

export async function fetchKalshiMarkets(
  params?: {
    status?: "open" | "closed" | "all";
    limit?: number;
    cursor?: string;
    start_ts?: number;
    end_ts?: number;
  }
): Promise<KalshiMarketsResponse> {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.set("status", params.status);
  if (params?.limit) queryParams.set("limit", String(params.limit));
  if (params?.cursor) queryParams.set("cursor", params.cursor);
  if (params?.start_ts) queryParams.set("start_ts", String(params.start_ts));
  if (params?.end_ts) queryParams.set("end_ts", String(params.end_ts));

  const url = `${KALSHI_API_BASE}/markets${queryParams.toString() ? `?${queryParams}` : ""}`;
  
  const retryDelaysMs = [300, 900];
  let lastStatus = 0;
  let lastBody = "";
  for (let attempt = 0; attempt <= retryDelaysMs.length; attempt += 1) {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (res.ok) {
      return res.json();
    }

    lastStatus = res.status;
    lastBody = await getResponseErrorBody(res);
    const shouldRetry = (res.status === 429 || res.status >= 500) && attempt < retryDelaysMs.length;
    if (!shouldRetry) break;
    await new Promise((resolve) => setTimeout(resolve, retryDelaysMs[attempt]));
  }

  throw new Error(`Kalshi markets error: ${lastStatus}.${lastBody}`);
}

export async function fetchKalshiHistoricalMarkets(
  params?: {
    limit?: number;
    cursor?: string;
    start_ts?: number;
    end_ts?: number;
  }
): Promise<KalshiHistoricalMarketsResponse> {
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.set("limit", String(params.limit));
  if (params?.cursor) queryParams.set("cursor", params.cursor);
  if (params?.start_ts) queryParams.set("start_ts", String(params.start_ts));
  if (params?.end_ts) queryParams.set("end_ts", String(params.end_ts));

  const url = `${KALSHI_API_BASE}/historical/markets${queryParams.toString() ? `?${queryParams}` : ""}`;
  
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const body = await getResponseErrorBody(res);
      const errorMsg = `Kalshi historical markets error: ${res.status}.${body}`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    const data = await res.json();
    
    // Log response structure for debugging
    if (data.markets && data.markets.length > 0) {
      console.log(`Kalshi Historical API returned ${data.markets.length} markets. Sample:`, {
        ticker: data.markets[0].ticker,
        volume: data.markets[0].volume,
        volume_fp: data.markets[0].volume_fp,
        close_time: data.markets[0].close_time,
      });
    }
    
    return data;
  } catch (error) {
    console.error("Kalshi historical fetch error:", error);
    throw error;
  }
}

export interface KalshiTrade {
  trade_id: string;
  ticker: string;
  created_time: string;
  count?: number;
  count_fp?: string;
  price?: number;
  yes_price?: number;
  yes_price_dollars?: string;
}

export interface KalshiTradesResponse {
  trades: KalshiTrade[];
  cursor: string | null;
}

export async function fetchKalshiTrades(
  params?: {
    limit?: number;
    cursor?: string;
    min_ts?: number;
    max_ts?: number;
    ticker?: string;
  }
): Promise<KalshiTradesResponse> {
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.set("limit", String(params.limit));
  if (params?.cursor) queryParams.set("cursor", params.cursor);
  if (params?.min_ts) queryParams.set("min_ts", String(params.min_ts));
  if (params?.max_ts) queryParams.set("max_ts", String(params.max_ts));
  if (params?.ticker) queryParams.set("ticker", params.ticker);

  const url = `${KALSHI_API_BASE}/markets/trades${queryParams.toString() ? `?${queryParams}` : ""}`;
  const retryDelaysMs = [250, 750];
  let lastStatus = 0;
  let lastBody = "";

  for (let attempt = 0; attempt <= retryDelaysMs.length; attempt += 1) {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (res.ok) {
      return res.json();
    }

    lastStatus = res.status;
    lastBody = await getResponseErrorBody(res);
    const shouldRetry = (res.status === 429 || res.status >= 500) && attempt < retryDelaysMs.length;
    if (!shouldRetry) {
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, retryDelaysMs[attempt]));
  }

  throw new Error(`Kalshi trades error: ${lastStatus}.${lastBody}`);
}

export async function getKalshiVolumeStats(): Promise<KalshiVolumeStats> {
  const now = Date.now();
  const DAY_MS = 24 * 60 * 60 * 1000;
  const startOfDayTs = Math.floor((now - DAY_MS) / 1000);
  const startOfMonthTs = Math.floor((now - 30 * DAY_MS) / 1000);
  const startOfYearTs = Math.floor((now - 365 * DAY_MS) / 1000);
  const nowTs = Math.floor(now / 1000);
  const getVolumeFromTrades = async (minTs: number, maxTs: number, maxPages: number): Promise<number> => {
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

      const trades = result.trades || [];
      if (!trades.length) break;

      for (const trade of trades) {
        const tradeTs = Math.floor(new Date(trade.created_time).getTime() / 1000);
        if (!Number.isFinite(tradeTs) || tradeTs < minTs || tradeTs > maxTs) continue;

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
      if (pages >= maxPages) break;
      if (!cursor) break;
    } while (true);

    return total;
  };

  try {
    const [dailyResult, monthlyResult, yearlyResult] = await Promise.allSettled([
      getVolumeFromTrades(startOfDayTs, nowTs, 10),
      getVolumeFromTrades(startOfMonthTs, nowTs, 20),
      getVolumeFromTrades(startOfYearTs, nowTs, 30),
    ]);

    const daily = dailyResult.status === "fulfilled" ? dailyResult.value : 0;
    const monthlyRaw = monthlyResult.status === "fulfilled" ? monthlyResult.value : 0;
    const yearlyRaw = yearlyResult.status === "fulfilled" ? yearlyResult.value : 0;
    const monthly = Math.max(monthlyRaw, daily);
    const yearly = Math.max(yearlyRaw, monthly);

    return {
      daily,
      monthly,
      yearly,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Kalshi volume aggregation error:", error);
    return {
      daily: 0,
      monthly: 0,
      yearly: 0,
      lastUpdated: new Date().toISOString(),
    };
  }
}
