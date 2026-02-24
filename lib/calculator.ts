export type EVQuality = "excellent" | "good" | "marginal";

export function getEVQuality(evPercent: number): EVQuality {
  if (evPercent >= 5) return "excellent";
  if (evPercent >= 2) return "good";
  return "marginal";
}

export function americanToDecimal(americanOdds: number): number {
  if (americanOdds > 0) {
    return americanOdds / 100 + 1;
  }
  return 100 / Math.abs(americanOdds) + 1;
}

export function getTrueProbability(decimalOdds: number): number {
  return 1 / decimalOdds;
}

export function getPolymarketPayout(
  stake: number,
  polymarketPriceCents: number
): number {
  if (polymarketPriceCents <= 0) return 0;
  const priceInDollars = polymarketPriceCents / 100;
  const shares = stake / priceInDollars;
  return shares * 1.0;
}

export function calculateEV(
  stake: number,
  polymarketPriceCents: number,
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
