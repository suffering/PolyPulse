export type EVQuality = "excellent" | "good" | "marginal";

export function getEVQuality(evPercent: number): EVQuality {
  if (evPercent >= 5) return "excellent";
  if (evPercent >= 2) return "good";
  return "marginal";
}

/** American odds to decimal (for payout math). */
export function americanToDecimal(americanOdds: number): number {
  if (americanOdds > 0) {
    return americanOdds / 100 + 1;
  }
  return 100 / Math.abs(americanOdds) + 1;
}

/**
 * American odds to implied probability (0–1).
 * Positive: 100 / (odds + 100)
 * Negative: |odds| / (|odds| + 100)
 */
export function americanToImpliedProbability(americanOdds: number): number {
  if (americanOdds > 0) {
    return 100 / (americanOdds + 100);
  }
  const abs = Math.abs(americanOdds);
  return abs / (abs + 100);
}

export function getTrueProbability(decimalOdds: number): number {
  return 1 / decimalOdds;
}

/** Payout on Polymarket for stake at price (0–1): shares = stake/price, payout = shares * 1. */
export function getPolymarketPayout(
  stake: number,
  polymarketPriceDecimal: number
): number {
  if (polymarketPriceDecimal <= 0) return 0;
  const shares = stake / polymarketPriceDecimal;
  return shares * 1;
}

/** Profit if win: stake at Polymarket price, payout $1 per share. */
export function getPolymarketProfitIfWin(
  stake: number,
  polymarketPriceDecimal: number
): number {
  const payout = getPolymarketPayout(stake, polymarketPriceDecimal);
  return payout - stake;
}

/**
 * Positive EV when Polymarket odds are better than the sportsbook (Polymarket edge).
 *
 * Better odds = lower price for the same $1 payout = lower implied probability.
 * - Polymarket implied prob = polymarket price (0–1). On Polymarket, price = probability.
 * - Sportsbook implied prob = from American odds (The Odds API).
 *
 * EV% = (Sportsbook implied prob) − (Polymarket implied prob), in percentage points.
 * - When EV% > 0: Polymarket is cheaper than the book → +EV on Polymarket (show this).
 * - When EV% < 0: Sportsbook is cheaper than Polymarket → no Polymarket edge (do not show as +EV).
 *
 * Polymarket price: pass as decimal 0–1 (e.g. 0.135 for 13.5¢) or 0–100; both accepted.
 */
export function calculateEV(
  stake: number,
  polymarketPriceDecimal: number,
  sportsbookAmericanOdds: number
): {
  ev: number;
  evPercentage: number;
  potentialProfit: number;
  expectedProfit: number;
  bookImpliedProb: number;
} {
  const bookImpliedProb = americanToImpliedProbability(sportsbookAmericanOdds);
  const raw = polymarketPriceDecimal;
  const polymarketImpliedProb = Math.max(
    0,
    Math.min(1, raw > 1 ? raw / 100 : raw)
  );

  // Polymarket edge: positive when Polymarket price is lower than book (PM implied prob < book)
  let evPercentage = (bookImpliedProb - polymarketImpliedProb) * 100;

  // Clamp to sensible range for display (do not zero out negative EV)
  if (evPercentage > 100) evPercentage = 100;
  if (evPercentage < -100) evPercentage = -100;

  const potentialProfit = getPolymarketProfitIfWin(stake, polymarketImpliedProb);
  const expectedProfit = stake * (evPercentage / 100);
  const ev = expectedProfit;

  return {
    ev,
    evPercentage,
    potentialProfit,
    expectedProfit,
    bookImpliedProb,
  };
}
