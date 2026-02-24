import type { ClosedPosition, OpenPosition, PnLDataPoint } from "./leaderboard";

export type MonthlyPnL = Record<string, number>;

export type TimeRange = "1D" | "1W" | "1M" | "YTD" | "1Y" | "MAX";

export interface PerformanceMetrics {
  "1D": { pnl: number };
  "1W": { pnl: number };
  "1M": { pnl: number };
  "YTD": { pnl: number };
  "1Y": { pnl: number };
  "MAX": { pnl: number };
}

export function aggregateMonthlyPnL(
  positions: ClosedPosition[],
  year: number
): MonthlyPnL {
  const monthly: MonthlyPnL = {};

  for (const pos of positions) {
    const date = new Date(pos.timestamp * 1000);
    if (date.getFullYear() !== year) continue;

    const monthKey = `${year}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    monthly[monthKey] = (monthly[monthKey] || 0) + pos.realizedPnl;
  }

  return monthly;
}

/**
 * Build all-time cumulative PnL from closed positions, ending with live total
 * (realized + open positions' current PnL) so the chart shows trader's live PnL.
 */
export function buildPnLHistory(
  closedPositions: ClosedPosition[],
  openPositions: OpenPosition[]
): PnLDataPoint[] {
  const dailyPnl = new Map<number, number>();
  let totalRealized = 0;

  for (const pos of closedPositions) {
    totalRealized += pos.realizedPnl;
    if (!pos.timestamp) continue;
    const dayKey = Math.floor(pos.timestamp / 86400) * 86400;
    dailyPnl.set(dayKey, (dailyPnl.get(dayKey) || 0) + pos.realizedPnl);
  }

  const unrealized = openPositions.reduce((sum, p) => sum + p.cashPnl, 0);
  const livePnl = totalRealized + unrealized;

  const sortedDays = Array.from(dailyPnl.entries()).sort((a, b) => a[0] - b[0]);
  const dataPoints: PnLDataPoint[] = [];
  let cumulative = 0;

  for (const [ts, dayPnl] of sortedDays) {
    cumulative += dayPnl;
    dataPoints.push({
      date: new Date(ts * 1000).toLocaleDateString(),
      timestamp: ts,
      pnl: cumulative,
    });
  }

  const nowSec = Math.floor(Date.now() / 1000);
  if (dataPoints.length === 0 || dataPoints[dataPoints.length - 1]?.pnl !== livePnl) {
    dataPoints.push({
      date: new Date(nowSec * 1000).toLocaleDateString(),
      timestamp: nowSec,
      pnl: livePnl,
    });
  }

  return dataPoints;
}

export function calculatePerformance(
  closedPositions: ClosedPosition[],
  openPositions: OpenPosition[]
): PerformanceMetrics {
  const now = Math.floor(Date.now() / 1000);
  const periods = {
    "1D": now - 86400,
    "1W": now - 7 * 86400,
    "1M": now - 30 * 86400,
    "YTD": Math.floor(new Date(new Date().getFullYear(), 0, 1).getTime() / 1000),
    "1Y": now - 365 * 86400,
    "MAX": 0,
  };

  const performance: Partial<PerformanceMetrics> = {};

  for (const [label, startTime] of Object.entries(periods)) {
    const realizedPnl = closedPositions
      .filter((p) => p.timestamp >= startTime)
      .reduce((sum, p) => sum + p.realizedPnl, 0);

    const unrealizedPnl = openPositions.reduce((sum, p) => sum + p.cashPnl, 0);

    performance[label as TimeRange] = {
      pnl: realizedPnl + unrealizedPnl,
    };
  }

  return performance as PerformanceMetrics;
}

export interface WinRateResult {
  wins: number;
  total: number;
  percent: number | null;
}

export function computeWinRate(closedPositions: ClosedPosition[]): WinRateResult {
  const total = closedPositions.length;
  if (total === 0) return { wins: 0, total: 0, percent: null };
  const wins = closedPositions.filter((p) => p.realizedPnl > 0).length;
  return {
    wins,
    total,
    percent: Math.round((wins / total) * 100),
  };
}

export function getTimeRangeStartTime(range: TimeRange): number | undefined {
  const now = Math.floor(Date.now() / 1000);

  switch (range) {
    case "1D":
      return now - 24 * 60 * 60;
    case "1W":
      return now - 7 * 24 * 60 * 60;
    case "1M":
      return now - 30 * 24 * 60 * 60;
    case "1Y":
      return now - 365 * 24 * 60 * 60;
    case "YTD": {
      const yearStart = new Date(new Date().getFullYear(), 0, 1);
      return Math.floor(yearStart.getTime() / 1000);
    }
    case "MAX":
      return undefined;
    default:
      return undefined;
  }
}

/**
 * Filter an all-time cumulative PnL series to a time range for display.
 * Used when building full history then slicing for chart zoom.
 */
export function filterPnLHistoryByRange(
  data: PnLDataPoint[],
  range: TimeRange
): PnLDataPoint[] {
  const startTime = getTimeRangeStartTime(range);
  if (startTime === undefined) return data;

  const inRange = data.filter((p) => p.timestamp >= startTime);
  if (inRange.length === 0) return data;

  const lastBeforeRange = data
    .filter((p) => p.timestamp < startTime)
    .sort((a, b) => b.timestamp - a.timestamp)[0];
  const cumulativeAtStart = lastBeforeRange?.pnl ?? 0;

  const startPoint: PnLDataPoint = {
    date: new Date(startTime * 1000).toLocaleDateString(),
    timestamp: startTime,
    pnl: cumulativeAtStart,
  };

  return [startPoint, ...inRange];
}

/**
 * Compute the PnL summary for a time range.
 * - For MAX (All-Time): live PnL = sum(closed realizedPnl) + sum(open cashPnl).
 * - For 1D/1W/1M: period PnL = sum(realizedPnl for positions closed within the range only).
 */
export function getPeriodPnl(
  closedPositions: ClosedPosition[],
  openPositions: OpenPosition[],
  range: TimeRange
): number {
  const unrealized = openPositions.reduce((sum, p) => sum + p.cashPnl, 0);
  if (range === "MAX") {
    const realized = closedPositions.reduce((sum, p) => sum + p.realizedPnl, 0);
    return realized + unrealized;
  }
  const startTime = getTimeRangeStartTime(range);
  if (startTime === undefined) return 0;
  return closedPositions
    .filter((p) => p.timestamp >= startTime)
    .reduce((sum, p) => sum + p.realizedPnl, 0);
}

/**
 * Build full all-time realized cumulative series (no open positions, no "now" point).
 * Used to slice and rebase for period charts so shape matches Polymarket.
 */
function buildRealizedCumulativeSeries(closedPositions: ClosedPosition[]): PnLDataPoint[] {
  const dailyPnl = new Map<number, number>();
  for (const pos of closedPositions) {
    if (!pos.timestamp) continue;
    const dayKey = Math.floor(pos.timestamp / 86400) * 86400;
    dailyPnl.set(dayKey, (dailyPnl.get(dayKey) || 0) + pos.realizedPnl);
  }
  const sortedDays = Array.from(dailyPnl.entries()).sort((a, b) => a[0] - b[0]);
  const dataPoints: PnLDataPoint[] = [];
  let cumulative = 0;
  for (const [ts, dayPnl] of sortedDays) {
    cumulative += dayPnl;
    dataPoints.push({
      date: new Date(ts * 1000).toLocaleDateString(),
      timestamp: ts,
      pnl: cumulative,
    });
  }
  return dataPoints;
}

/**
 * Build chart data for a specific time range.
 * - MAX: full all-time cumulative (buildPnLHistory), last point aligned to summaryPnlOverride when provided.
 * - 1D/1W/1M: full realized series sliced to range, rebased to 0, last point = summaryPnlOverride (leaderboard) so chart shape and number match Polymarket.
 */
export function buildChartDataForRange(
  closedPositions: ClosedPosition[],
  openPositions: OpenPosition[],
  range: TimeRange,
  summaryPnlOverride?: number
): PnLDataPoint[] {
  if (range === "MAX") {
    const data = buildPnLHistory(closedPositions, openPositions);
    if (data.length > 0 && summaryPnlOverride !== undefined) {
      data[data.length - 1] = { ...data[data.length - 1], pnl: summaryPnlOverride };
    }
    return data;
  }
  const startTime = getTimeRangeStartTime(range);
  if (startTime === undefined) return buildPnLHistory(closedPositions, openPositions);

  const fullSeries = buildRealizedCumulativeSeries(closedPositions);
  const lastBefore = fullSeries.filter((p) => p.timestamp < startTime).sort((a, b) => b.timestamp - a.timestamp)[0];
  const cumulativeAtStart = lastBefore?.pnl ?? 0;

  const inRange = fullSeries.filter((p) => p.timestamp >= startTime);
  const rebased: PnLDataPoint[] = [
    { date: new Date(startTime * 1000).toLocaleDateString(), timestamp: startTime, pnl: 0 },
    ...inRange.map((p) => ({
      date: p.date,
      timestamp: p.timestamp,
      pnl: p.pnl - cumulativeAtStart,
    })),
  ];

  const nowSec = Math.floor(Date.now() / 1000);
  const periodPnl = summaryPnlOverride !== undefined ? summaryPnlOverride : getPeriodPnl(closedPositions, openPositions, range);
  if (rebased.length === 0 || rebased[rebased.length - 1]?.timestamp !== nowSec) {
    rebased.push({ date: new Date(nowSec * 1000).toLocaleDateString(), timestamp: nowSec, pnl: periodPnl });
  } else {
    rebased[rebased.length - 1] = { ...rebased[rebased.length - 1], pnl: periodPnl };
  }
  return rebased;
}

export function getMinYear(positions: ClosedPosition[]): number {
  if (positions.length === 0) return new Date().getFullYear();

  const minTimestamp = Math.min(...positions.map((p) => p.timestamp));
  return new Date(minTimestamp * 1000).getFullYear();
}

export function getMaxYear(): number {
  return new Date().getFullYear();
}
