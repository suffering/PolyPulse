/**
 * EV Calculator for Polymarket vs Sportsbook odds
 *
 * FORMULA:
 * EV = (Win Probability × Profit if Won) - (Loss Probability × Stake)
 * EV% = (EV / Stake) × 100
 *
 * Where:
 * - Win Probability = 1 / decimalOdds (true probability from sportsbook)
 * - Profit if Won = Polymarket payout minus stake
 * - Loss Probability = 1 - Win Probability
 */

export type EVQuality = "excellent" | "good" | "marginal";

export function getEVQuality(evPercent: number): EVQuality {
  if (evPercent >= 5) return "excellent";
  if (evPercent >= 2) return "good";
  return "marginal";
}

/**
 * Convert American odds to decimal
 * +5000 → (5000/100) + 1 = 51.00
 * -200 → (100/200) + 1 = 1.50
 */
export function americanToDecimal(americanOdds: number): number {
  if (americanOdds > 0) {
    return americanOdds / 100 + 1;
  }
  return 100 / Math.abs(americanOdds) + 1;
}

/**
 * Step 2: Get true probability from sportsbook decimal odds
 * 51.00 decimal → 1/51 = 0.0196 = 1.96%
 */
export function getTrueProbability(decimalOdds: number): number {
  return 1 / decimalOdds;
}

/**
 * Step 3: Calculate Polymarket payout if outcome wins
 * polymarketPriceCents: price in cents (0-100), e.g. 1.3 = 1.3¢
 * Each share pays $1 if outcome hits
 */
export function getPolymarketPayout(
  stake: number,
  polymarketPriceCents: number // in cents, e.g. 1.3 = 1.3¢
): number {
  if (polymarketPriceCents <= 0) return 0;
  const priceInDollars = polymarketPriceCents / 100; // 1.3¢ → 0.013
  const shares = stake / priceInDollars;
  return shares * 1.0; // $1 per share when correct
}

/**
 * Step 4: Calculate full EV
 * EV = (Win Probability × Profit if Won) - (Loss Probability × Stake)
 */
export function calculateEV(
  stake: number,
  polymarketPriceCents: number, // in cents (1.3 = 1.3¢)
  sportsbookAmericanOdds: number
): {
  ev: number;
  evPercentage: number;
  potentialProfit: number;
  expectedProfit: number;
} {
  const decimalOdds = americanToDecimal(sportsbookAmericanOdds);
  const winProbability = getTrueProbability(decimalOdds);
  const lossProbability = 1 - winProbability;

  const payout = getPolymarketPayout(stake, polymarketPriceCents);
  const profitIfWon = payout - stake;

  const ev = winProbability * profitIfWon - lossProbability * stake;
  const evPercentage = stake > 0 ? (ev / stake) * 100 : 0;

  return {
    ev,
    evPercentage,
    potentialProfit: profitIfWon,
    expectedProfit: ev,
  };
}
