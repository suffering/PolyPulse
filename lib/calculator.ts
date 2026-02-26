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
 * Sharp book American odds to implied probability (no-vig), 0–1.
 * Positive odds: implied = 100 / (odds + 100)
 * Negative odds: implied = |odds| / (|odds| + 100)
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
 * +EV when sharp book implied probability is HIGHER than Polymarket's price:
 * Polymarket is offering better payout odds than the sharp book believes the true probability warrants.
 *
 * Formulas (consistent for every sport, league, category, timeframe):
 * - Sharp implied prob: negative American → |odds|/(|odds|+100); positive → 100/(odds+100).
 * - EV% = (sharpImpliedProb - polymarketProb) / polymarketProb (as decimal; ×100 for display).
 * - Polymarket payout on a win = (1/polymarketProb - 1) per dollar staked.
 * - Expected profit = (sharpImpliedProb × polymarketPayout × stake) - ((1 - sharpImpliedProb) × stake)
 *   = stake × (sharpImpliedProb / polymarketProb - 1).
 *
 * Polymarket price: decimal 0–1 (e.g. 0.33 for 33¢) or 0–100; both accepted.
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

  if (polymarketImpliedProb <= 0) {
    return {
      ev: 0,
      evPercentage: 0,
      potentialProfit: 0,
      expectedProfit: 0,
      bookImpliedProb,
    };
  }

  // EV% = (sharpImpliedProb - polymarketProb) / polymarketProb (×100 for percentage)
  let evPercentage = (bookImpliedProb - polymarketImpliedProb) / polymarketImpliedProb * 100;

  // Clamp to sensible display range (do not zero out negative EV)
  if (evPercentage > 500) evPercentage = 500;
  if (evPercentage < -100) evPercentage = -100;

  // Profit if win: $100 stake → (1/p - 1) per dollar → stake * (1/p - 1)
  const potentialProfit = getPolymarketProfitIfWin(stake, polymarketImpliedProb);

  // Expected profit = (sharpImpliedProb * polymarketPayout * stake) - ((1 - sharpImpliedProb) * stake)
  // = stake * (sharpImpliedProb / polymarketImpliedProb - 1)
  const expectedProfit = stake * (bookImpliedProb / polymarketImpliedProb - 1);
  const ev = expectedProfit;

  return {
    ev,
    evPercentage,
    potentialProfit,
    expectedProfit,
    bookImpliedProb,
  };
}
