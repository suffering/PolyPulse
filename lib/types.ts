/**
 * Shared types for NBA market filtering and categorization
 */

export type MarketType = "game" | "player_prop" | "futures" | "total" | "other";
export type Timeframe = "today" | "week" | "month" | "futures" | "all";

/** NBA market category for filtering - derived from Polymarket event title */
export type MarketCategory =
  | "championship"
  | "conference"
  | "division"
  | "mvp"
  | "awards"
  | "playoffs"
  | "games"
  | "win_totals"
  | "stat_leaders"
  | "other";

export function getMarketCategory(eventTitle: string): MarketCategory {
  const t = (eventTitle || "").toLowerCase();

  if (t.includes("champion") && !t.includes("conference")) return "championship";
  if (t.includes("conference") && (t.includes("champion") || t.includes("finals")))
    return "conference";
  if (t.includes("#1 seed") || t.includes("1 seed")) return "conference";
  if (t.includes("division winner")) return "division";
  if (t.includes("mvp")) return "mvp";
  if (
    t.includes("rookie of the year") ||
    t.includes("defensive player") ||
    t.includes("sixth man") ||
    t.includes("most improved") ||
    t.includes("clutch player") ||
    t.includes("coach of the year")
  )
    return "awards";
  if (t.includes("playoff") || t.includes("make the")) return "playoffs";
  if (t.includes("best record") || t.includes("worst record")) return "other";
  if (
    t.includes("points per game") ||
    t.includes("rebounds per game") ||
    t.includes("assists per game") ||
    t.includes("three pointer") ||
    t.includes("blocks per game") ||
    t.includes("steals per game") ||
    t.includes("lead the nba")
  )
    return "stat_leaders";
  if (t.includes("win total") || t.includes("over or under")) return "win_totals";
  if (t.includes("beat") || t.includes("defeat") || t.includes("win against"))
    return "games";

  return "other";
}

export function getMarketCategoryLabel(cat: MarketCategory): string {
  const labels: Record<MarketCategory, string> = {
    championship: "Championship",
    conference: "Conference",
    division: "Division",
    mvp: "MVP",
    awards: "Awards",
    playoffs: "Playoffs",
    games: "Games",
    win_totals: "Win Totals",
    stat_leaders: "Stat Leaders",
    other: "Other",
  };
  return labels[cat];
}

export function getMarketType(question: string): MarketType {
  const q = question.toLowerCase();
  if (q.includes("beat") || q.includes("defeat") || q.includes("win against")) {
    return "game";
  }
  if (
    q.includes("score") ||
    q.includes("points") ||
    q.includes("assists") ||
    q.includes("rebounds") ||
    q.includes("steals") ||
    q.includes("blocks")
  ) {
    return "player_prop";
  }
  if (q.includes("champion") || q.includes("finals") || q.includes("mvp")) {
    return "futures";
  }
  if (q.includes("total") || q.includes("over") || q.includes("under")) {
    return "total";
  }
  return "other";
}

export function getTimeframe(endDate: string | null): Timeframe {
  if (!endDate) return "all";
  try {
    const now = new Date();
    const end = new Date(endDate);
    const hoursUntil = (end.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntil < 0) return "all"; // Past
    if (hoursUntil < 24) return "today";
    if (hoursUntil < 24 * 7) return "week";
    if (hoursUntil < 24 * 30) return "month";
    return "futures";
  } catch {
    return "all";
  }
}

export function getTimeframeLabel(timeframe: Timeframe): string {
  const labels: Record<Timeframe, string> = {
    today: "Today",
    week: "This Week",
    month: "This Month",
    futures: "Futures",
    all: "All",
  };
  return labels[timeframe];
}
