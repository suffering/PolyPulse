/**
 * Event matching between Polymarket and The Odds API
 * Handles team name variations for robust matching
 */

import type { OddsApiEvent, OddsApiBookmaker } from "./odds-api";
import type { PolymarketEvent, PolymarketMarket } from "./polymarket";
import { calculateEV } from "./calculator";
import { getMarketType, getTimeframe, getMarketCategory } from "./types";
import type { MarketCategory } from "./types";

// Team name aliases for matching (Polymarket vs Odds API)
// Canonical name -> aliases (Odds API uses full names, Polymarket may use short)
const TEAM_ALIASES: Record<string, string[]> = {
  "oklahoma city thunder": ["oklahoma city", "thunder", "okc"],
  "cleveland cavaliers": ["cleveland", "cavaliers", "cavs"],
  "new york knicks": ["new york", "knicks"],
  "minnesota timberwolves": ["minnesota", "timberwolves", "wolves"],
  "houston rockets": ["houston", "rockets"],
  "indiana pacers": ["indiana", "pacers"],
  "boston celtics": ["boston", "celtics"],
  "philadelphia 76ers": ["philadelphia", "76ers", "sixers"],
  "milwaukee bucks": ["milwaukee", "bucks"],
  "denver nuggets": ["denver", "nuggets"],
  "phoenix suns": ["phoenix", "suns"],
  "dallas mavericks": ["dallas", "mavericks", "mavs"],
  "los angeles lakers": ["la lakers", "lakers"],
  "los angeles clippers": ["la clippers", "clippers"],
  "golden state warriors": ["golden state", "warriors", "gs warriors", "gsw"],
  "memphis grizzlies": ["memphis", "grizzlies"],
  "new orleans pelicans": ["new orleans", "pelicans"],
  "sacramento kings": ["sacramento", "kings"],
  "san antonio spurs": ["san antonio", "spurs"],
  "portland trail blazers": ["portland", "trail blazers", "blazers"],
  "utah jazz": ["utah", "jazz"],
  "washington wizards": ["washington", "wizards"],
  "charlotte hornets": ["charlotte", "hornets"],
  "atlanta hawks": ["atlanta", "hawks"],
  "orlando magic": ["orlando", "magic"],
  "miami heat": ["miami", "heat"],
  "brooklyn nets": ["brooklyn", "nets"],
  "chicago bulls": ["chicago", "bulls"],
  "detroit pistons": ["detroit", "pistons"],
  "toronto raptors": ["toronto", "raptors"],
};

// Soccer team aliases (EPL, La Liga, etc.) - Polymarket uses "X FC", Odds API may use short names
const SOCCER_TEAM_ALIASES: Record<string, string[]> = {
  "manchester united": ["man united", "man utd", "manchester utd", "man u", "united"],
  "manchester city": ["man city", "manchester city fc", "city"],
  "liverpool": ["liverpool fc", "lfc"],
  "chelsea": ["chelsea fc"],
  "arsenal": ["arsenal fc"],
  "tottenham hotspur": ["tottenham", "spurs", "tottenham hotspur fc"],
  "newcastle united": ["newcastle", "newcastle united fc", "newcastle utd"],
  "brighton and hove albion": ["brighton", "brighton & hove albion", "brighton and hove albion fc"],
  "west ham united": ["west ham", "west ham united fc", "west ham utd"],
  "wolverhampton wanderers": ["wolves", "wolverhampton wanderers fc", "wolverhampton"],
  "aston villa": ["aston villa fc", "villa"],
  "brentford": ["brentford fc"],
  "fulham": ["fulham fc"],
  "crystal palace": ["crystal palace fc", "palace"],
  "everton": ["everton fc"],
  "bournemouth": ["afc bournemouth", "bournemouth fc", "cherries"],
  "nottingham forest": ["nottingham forest fc", "forest"],
  "leicester city": ["leicester", "leicester city fc"],
  "leeds united": ["leeds", "leeds united fc", "leeds utd"],
  "burnley": ["burnley fc"],
  "ipswich town": ["ipswich", "ipswich town fc"],
  "southampton": ["southampton fc"],
  "real madrid": ["real", "real madrid cf", "madrid"],
  "barcelona": ["barcelona fc", "barca"],
  "atletico madrid": ["atletico", "atletico madrid", "atleti"],
  "bayern munich": ["bayern", "bayern munich", "fc bayern"],
  "borussia dortmund": ["dortmund", "bvb"],
  "inter milan": ["inter", "inter milano", "fc internazionale"],
  "ac milan": ["milan", "ac milan", "acm"],
  "juventus": ["juventus fc", "juve"],
  "paris saint germain": ["psg", "paris sg", "paris saint-germain"],
};

export function normalizeTeamName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s&]/g, "")
    .trim();
}

/** Normalize soccer team names: strip FC, CF, handle "&" vs "and" */
function normalizeSoccerTeamName(name: string): string {
  return normalizeTeamName(name)
    .replace(/\bfc\b/g, "")
    .replace(/\bcf\b/g, "")
    .replace(/&/g, " and ")
    .replace(/\s+/g, " ")
    .trim();
}

function teamNamesMatch(a: string, b: string): boolean {
  const na = normalizeTeamName(a);
  const nb = normalizeTeamName(b);
  if (na === nb) return true;
  if (na.includes(nb) || nb.includes(na)) return true;

  const aliasesA = TEAM_ALIASES[na];
  if (aliasesA) {
    for (const alias of aliasesA) {
      if (nb.includes(alias) || alias.includes(nb)) return true;
    }
  }
  const aliasesB = TEAM_ALIASES[nb];
  if (aliasesB) {
    for (const alias of aliasesB) {
      if (na.includes(alias) || alias.includes(na)) return true;
    }
  }
  return false;
}

function soccerTeamNamesMatch(a: string, b: string): boolean {
  const na = normalizeSoccerTeamName(a);
  const nb = normalizeSoccerTeamName(b);
  if (na === nb) return true;
  if (na.includes(nb) || nb.includes(na)) return true;

  const aliasesA = SOCCER_TEAM_ALIASES[na];
  if (aliasesA) {
    for (const alias of aliasesA) {
      const normAlias = normalizeSoccerTeamName(alias);
      if (nb.includes(normAlias) || normAlias.includes(nb)) return true;
    }
  }
  const aliasesB = SOCCER_TEAM_ALIASES[nb];
  if (aliasesB) {
    for (const alias of aliasesB) {
      const normAlias = normalizeSoccerTeamName(alias);
      if (na.includes(normAlias) || normAlias.includes(na)) return true;
    }
  }
  // Check reverse: na might be an alias of canonical nb
  for (const [canonical, aliases] of Object.entries(SOCCER_TEAM_ALIASES)) {
    const normCanonical = normalizeSoccerTeamName(canonical);
    const allNames = [normCanonical, ...aliases.map(normalizeSoccerTeamName)];
    const aMatches = allNames.some((n) => na === n || na.includes(n) || n.includes(na));
    const bMatches = allNames.some((n) => nb === n || nb.includes(n) || n.includes(nb));
    if (aMatches && bMatches) return true;
  }
  return false;
}

export interface MatchedOpportunity {
  id: string;
  sport: string;
  league?: string; // e.g. "EPL", "Champions League"
  matchup: string;
  outcome: string;
  eventTime: string;
  polymarketPrice: number;
  polymarketImpliedProb: number;
  polymarketUrl: string;
  polymarketEventId: string;
  polymarketMarketId: string;
  polymarketQuestion: string;
  /** Optional for Polymarket-only markets (no sportsbook odds) */
  sportsbookName?: string;
  sportsbookOdds?: number;
  sportsbookImpliedProb?: number;
  trueProbability?: number;
  ev?: number;
  evPercent?: number;
  profitIfWin100?: number;
  expectedProfit100?: number;
  quality?: "excellent" | "good" | "marginal";
  marketType: "game" | "player_prop" | "futures" | "total" | "other";
  timeframe: "today" | "week" | "month" | "futures" | "all";
  category: MarketCategory;
}

/** Outright-style events that have Odds API match (NBA Champion only) */
function hasOddsApiMatch(title: string): boolean {
  const t = title.toLowerCase();
  return (
    (t.includes("champion") && !t.includes("conference")) ||
    t.includes("finals") ||
    t.includes("world series") ||
    t.includes("stanley cup")
  );
}

/**
 * Match Polymarket outright markets with Odds API where available.
 * Championship: matched to Odds API for EV.
 */
export function matchOutrights(
  polymarketEvents: PolymarketEvent[],
  oddsEvents: OddsApiEvent[],
  sport: string
): MatchedOpportunity[] {
  const opportunities: MatchedOpportunity[] = [];

  for (const pmEvent of polymarketEvents) {
    const title = pmEvent.title || "";
    const category = getMarketCategory(title);

    // Skip non-outright event types (games, win totals handled elsewhere)
    if (category === "games" || category === "win_totals") continue;

    for (const market of pmEvent.markets || []) {
      const outcomeName =
        market.groupItemTitle || extractTeamOrPlayerFromQuestion(market.question);
      if (!outcomeName) continue;

      const outcomes = parseMarketOutcomes(market);
      const yesOutcome = outcomes.find((o) => o.name.toLowerCase() === "yes");
      if (!yesOutcome || yesOutcome.price <= 0) continue;

      const polymarketPrice = yesOutcome.price;
      const polymarketPriceCents = polymarketPrice * 100;
      const polymarketImpliedProb = polymarketPriceCents;

      if (polymarketPriceCents < 1) continue;

      let matched = false;

      // Championship: try to match with Odds API (team-based outrights)
      if (hasOddsApiMatch(title) && category === "championship") {
        for (const oddsEvent of oddsEvents) {
          const bestBook =
            getBestBookmakerForTeam(oddsEvent, outcomeName, "outrights") ||
            getBestBookmakerForTeam(oddsEvent, outcomeName, "h2h");
          if (!bestBook) continue;

          matched = true;
          const stake = 100;
          const { ev, evPercentage, potentialProfit, expectedProfit } = calculateEV(
            stake,
            polymarketPriceCents,
            bestBook.outcome.price
          );

          const quality: MatchedOpportunity["quality"] =
            evPercentage >= 5 ? "excellent" : evPercentage >= 2 ? "good" : "marginal";
          const decimalOdds = bestBook.decimalOdds;

          opportunities.push({
            id: `${pmEvent.id}-${market.id}-${outcomeName}`,
            sport,
            matchup: title || "Championship",
            outcome: outcomeName,
            eventTime: pmEvent.endDate || pmEvent.startDate || "",
            polymarketPrice,
            polymarketImpliedProb,
            polymarketUrl: getPolymarketUrl(pmEvent),
            polymarketEventId: pmEvent.id,
            polymarketMarketId: market.id,
            polymarketQuestion: market.question || "",
            sportsbookName: bestBook.bookmaker.title,
            sportsbookOdds: bestBook.outcome.price,
            sportsbookImpliedProb: (1 / decimalOdds) * 100,
            trueProbability: 1 / decimalOdds,
            ev,
            evPercent: evPercentage,
            profitIfWin100: potentialProfit,
            expectedProfit100: expectedProfit,
            quality,
            marketType: getMarketType(market.question || title),
            timeframe: getTimeframe(pmEvent.endDate),
            category,
          });
        }
      }
    }
  }

  return opportunities.sort((a, b) => (b.evPercent ?? -999) - (a.evPercent ?? -999));
}

function parseMarketOutcomes(market: PolymarketMarket): { name: string; price: number }[] {
  const outcomesStr = market.outcomes || "[]";
  const pricesStr = market.outcomePrices || "[]";
  let outcomes: string[] = [];
  let prices: number[] = [];

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

  return outcomes.map((name, i) => ({ name, price: prices[i] ?? 0 }));
}

function extractTeamFromQuestion(question: string): string | null {
  // "Will the Oklahoma City Thunder win the 2026 NBA Finals?"
  const match = question.match(/Will (?:the )?([^?]+) win/);
  return match ? match[1].trim() : null;
}

/** Extract team or player from "Will X win/lead/record..." questions */
function extractTeamOrPlayerFromQuestion(question: string): string | null {
  // "Will the Oklahoma City Thunder win the 2026 NBA Finals?"
  // "Will Trae Young win the 2025–2026 NBA MVP?"
  // "Will Victor Wembanyama win the 2025–2026 NBA Defensive Player of the Year?"
  // "Will the Atlanta Hawks make the NBA Playoffs?"
  const winMatch = question.match(/Will (?:the )?([^?]+?) (?:win|make|lead|record|finish|have)/);
  return winMatch ? winMatch[1].trim() : extractTeamFromQuestion(question);
}

function getBestBookmakerForTeam(
  event: OddsApiEvent,
  teamName: string,
  marketKey: "h2h" | "outrights" = "outrights"
): { bookmaker: OddsApiBookmaker; outcome: { price: number }; decimalOdds: number } | null {
  let best: { bookmaker: OddsApiBookmaker; outcome: { price: number }; decimalOdds: number } | null =
    null;

  for (const bookmaker of event.bookmakers) {
    const market = bookmaker.markets.find((m) => m.key === marketKey);
    if (!market) continue;

    const outcome = market.outcomes.find((o) => teamNamesMatch(o.name, teamName));
    if (!outcome) continue;

    const decimalOdds = outcome.price > 0 ? 1 + outcome.price / 100 : 1 + 100 / Math.abs(outcome.price);
    if (!best || decimalOdds > best.decimalOdds) {
      best = { bookmaker, outcome, decimalOdds };
    }
  }
  return best;
}

function getPolymarketUrl(event: PolymarketEvent): string {
  const slug = event.slug || event.id;
  return `https://polymarket.com/event/${slug}`;
}

/**
 * Extract team names from game-level question text.
 * Handles: "Will the Lakers beat the Celtics?", "Will Lakers defeat Celtics?"
 */
function extractTeamsFromGameQuestion(question: string): { team1: string; team2: string } | null {
  const q = question.toLowerCase();
  const beatMatch = q.match(/will\s+(?:the\s+)?([^?]+?)\s+(?:beat|defeat)\s+(?:the\s+)?([^?]+?)\s*\??/);
  if (beatMatch) return { team1: beatMatch[1].trim(), team2: beatMatch[2].trim() };
  const winAgainstMatch = q.match(/will\s+(?:the\s+)?([^?]+?)\s+win\s+against\s+(?:the\s+)?([^?]+?)\s*\??/);
  if (winAgainstMatch) return { team1: winAgainstMatch[1].trim(), team2: winAgainstMatch[2].trim() };
  return null;
}

/**
 * Match Polymarket game-level markets with Odds API h2h markets
 * For daily NBA games like "Will Lakers beat Celtics?"
 */
export function matchH2HGames(
  polymarketEvents: PolymarketEvent[],
  oddsEvents: OddsApiEvent[],
  sport: string
): MatchedOpportunity[] {
  const opportunities: MatchedOpportunity[] = [];

  for (const pmEvent of polymarketEvents) {
    const title = (pmEvent.title || "").toLowerCase();
    const isGameLevel =
      title.includes("beat") || title.includes("defeat") || title.includes("win against");

    for (const market of pmEvent.markets || []) {
      const question = market.question || "";
      const isGameQuestion =
        question.toLowerCase().includes("beat") ||
        question.toLowerCase().includes("defeat") ||
        question.toLowerCase().includes("win against");
      if (!isGameLevel && !isGameQuestion) continue;

      const teams = extractTeamsFromGameQuestion(question);
      if (!teams) continue;

      const { team1, team2 } = teams;

      const outcomes = parseMarketOutcomes(market);
      const yesOutcome = outcomes.find((o) => o.name.toLowerCase() === "yes");
      if (!yesOutcome || yesOutcome.price <= 0) continue;

      const polymarketPrice = yesOutcome.price;
      const polymarketPriceCents = polymarketPrice * 100;
      const polymarketImpliedProb = polymarketPriceCents;

      if (polymarketPriceCents < 1) continue;

      // Find matching h2h event in Odds API
      for (const oddsEvent of oddsEvents) {
        // Match by team names
        const matchesTeams =
          (teamNamesMatch(oddsEvent.home_team, team1) && teamNamesMatch(oddsEvent.away_team, team2)) ||
          (teamNamesMatch(oddsEvent.home_team, team2) && teamNamesMatch(oddsEvent.away_team, team1));

        if (!matchesTeams) continue;

        const bestBook = getBestBookmakerForTeam(oddsEvent, team1, "h2h");
        if (!bestBook) continue;

        const stake = 100;
        const { ev, evPercentage, potentialProfit, expectedProfit } = calculateEV(
          stake,
          polymarketPriceCents,
          bestBook.outcome.price
        );

        // Show all opportunities for debugging (including negative/breakeven EV)
        const quality: MatchedOpportunity["quality"] =
          evPercentage >= 5 ? "excellent" : evPercentage >= 2 ? "good" : "marginal";

        const decimalOdds = bestBook.decimalOdds;

        opportunities.push({
          id: `${pmEvent.id}-${market.id}-h2h`,
          sport,
          matchup: `${team1} vs ${team2}`,
          outcome: team1,
          eventTime: pmEvent.startDate || pmEvent.endDate || "",
          polymarketPrice,
          polymarketImpliedProb,
          polymarketUrl: getPolymarketUrl(pmEvent),
          polymarketEventId: pmEvent.id,
          polymarketMarketId: market.id,
          polymarketQuestion: market.question || "",
          sportsbookName: bestBook.bookmaker.title,
          sportsbookOdds: bestBook.outcome.price,
          sportsbookImpliedProb: (1 / decimalOdds) * 100,
          trueProbability: 1 / decimalOdds,
          ev,
          evPercent: evPercentage,
          profitIfWin100: potentialProfit,
          expectedProfit100: expectedProfit,
          quality,
          marketType: "game",
          timeframe: getTimeframe(pmEvent.endDate || pmEvent.startDate),
          category: "games",
        });
      }
    }
  }

  return opportunities;
}

/**
 * Match Polymarket totals markets with Odds API totals markets
 * For markets like "Will Lakers score over 110 points?"
 */
export function matchTotals(
  polymarketEvents: PolymarketEvent[],
  oddsEvents: OddsApiEvent[],
  sport: string
): MatchedOpportunity[] {
  const opportunities: MatchedOpportunity[] = [];

  for (const pmEvent of polymarketEvents) {
    for (const market of pmEvent.markets || []) {
      const question = market.question.toLowerCase();
      const isTotals =
        question.includes("total") || question.includes("over") || question.includes("under");
      if (!isTotals) continue;

      // Extract team and total line
      const teamMatch = question.match(/(?:the\s+)?([^?]+?)\s+(?:score|total)/);
      if (!teamMatch) continue;

      const teamName = teamMatch[1].trim();

      const outcomes = parseMarketOutcomes(market);
      const yesOutcome = outcomes.find((o) => o.name.toLowerCase() === "yes");
      if (!yesOutcome || yesOutcome.price <= 0) continue;

      const polymarketPrice = yesOutcome.price;
      const polymarketPriceCents = polymarketPrice * 100;
      const polymarketImpliedProb = polymarketPriceCents;

      if (polymarketPriceCents < 1) continue;

      // Find matching totals event in Odds API
      for (const oddsEvent of oddsEvents) {
        const matchesTeam =
          teamNamesMatch(oddsEvent.home_team, teamName) ||
          teamNamesMatch(oddsEvent.away_team, teamName);

        if (!matchesTeam) continue;

        // Find best totals market from bookmakers
        let bestBook: { bookmaker: OddsApiBookmaker; outcome: { price: number }; decimalOdds: number } | null = null;

        for (const bookmaker of oddsEvent.bookmakers) {
          const totalsMarket = bookmaker.markets.find((m) => m.key === "totals");
          if (!totalsMarket) continue;

          // Get over/under outcomes (The Odds API has "Over" and "Under" outcomes)
          const overOutcome = totalsMarket.outcomes.find((o) => o.name === "Over");
          if (!overOutcome) continue;

          const decimalOdds = overOutcome.price > 0 ? 1 + overOutcome.price / 100 : 1 + 100 / Math.abs(overOutcome.price);
          if (!bestBook || decimalOdds > bestBook.decimalOdds) {
            bestBook = { bookmaker, outcome: overOutcome, decimalOdds };
          }
        }

        if (!bestBook) continue;

        const stake = 100;
        const { ev, evPercentage, potentialProfit, expectedProfit } = calculateEV(
          stake,
          polymarketPriceCents,
          bestBook.outcome.price
        );

        // Show all opportunities for debugging (including negative/breakeven EV)
        const quality: MatchedOpportunity["quality"] =
          evPercentage >= 5 ? "excellent" : evPercentage >= 2 ? "good" : "marginal";

        const decimalOdds = bestBook.decimalOdds;

        opportunities.push({
          id: `${pmEvent.id}-${market.id}-totals`,
          sport,
          matchup: `${oddsEvent.home_team} vs ${oddsEvent.away_team}`,
          outcome: teamName,
          eventTime: oddsEvent.commence_time,
          polymarketPrice,
          polymarketImpliedProb,
          polymarketUrl: getPolymarketUrl(pmEvent),
          polymarketEventId: pmEvent.id,
          polymarketMarketId: market.id,
          polymarketQuestion: market.question || "",
          sportsbookName: bestBook.bookmaker.title,
          sportsbookOdds: bestBook.outcome.price,
          sportsbookImpliedProb: (1 / decimalOdds) * 100,
          trueProbability: 1 / decimalOdds,
          category: "other",
          ev,
          evPercent: evPercentage,
          profitIfWin100: potentialProfit,
          expectedProfit100: expectedProfit,
          quality,
          marketType: "total",
          timeframe: getTimeframe(pmEvent.endDate || pmEvent.startDate),
        });
      }
    }
  }

  return opportunities;
}

/**
 * Get best bookmaker for a soccer outcome (team win or Draw)
 * Soccer h2h has 3 outcomes: Home, Away, Draw
 */
function getBestBookmakerForSoccerOutcome(
  event: OddsApiEvent,
  outcomeName: string, // Team name or "Draw"
  marketKey: "h2h" = "h2h"
): { bookmaker: OddsApiBookmaker; outcome: { price: number }; decimalOdds: number } | null {
  let best: { bookmaker: OddsApiBookmaker; outcome: { price: number }; decimalOdds: number } | null =
    null;

  for (const bookmaker of event.bookmakers) {
    const market = bookmaker.markets.find((m) => m.key === marketKey);
    if (!market) continue;

    const isDraw = outcomeName.toLowerCase() === "draw";
    const outcome = isDraw
      ? market.outcomes.find((o) => o.name === "Draw")
      : market.outcomes.find((o) => o.name !== "Draw" && soccerTeamNamesMatch(o.name, outcomeName));

    if (!outcome) continue;

    const decimalOdds =
      outcome.price > 0 ? 1 + outcome.price / 100 : 1 + 100 / Math.abs(outcome.price);
    if (!best || decimalOdds > best.decimalOdds) {
      best = { bookmaker, outcome, decimalOdds };
    }
  }
  return best;
}

/**
 * Extract teams from Polymarket soccer event title: "Chelsea FC vs. Burnley FC"
 * Handles "Team A vs. Team B - More Markets" by stripping suffix
 */
function extractTeamsFromSoccerTitle(title: string): { team1: string; team2: string } | null {
  const clean = title.replace(/\s*-\s*More Markets\s*$/i, "").trim();
  const match = clean.match(/^(.+?)\s+vs\.?\s+(.+)$/i);
  return match ? { team1: match[1].trim(), team2: match[2].trim() } : null;
}

/**
 * Extract team from Polymarket soccer question: "Will Chelsea FC win on 2026-02-21?"
 */
function extractTeamFromSoccerWinQuestion(question: string): string | null {
  const match = question.match(/Will\s+(.+?)\s+win\s+on/i);
  return match ? match[1].trim() : null;
}

/**
 * Match Polymarket soccer game markets with Odds API h2h
 * Handles: "Will X win on date?" and "Will X vs Y end in a draw?"
 */
export function matchSoccerH2H(
  polymarketEvents: PolymarketEvent[],
  oddsEvents: OddsApiEvent[],
  sport: string,
  league: string
): MatchedOpportunity[] {
  const opportunities: MatchedOpportunity[] = [];

  for (const pmEvent of polymarketEvents) {
    const title = pmEvent.title || "";
    const teams = extractTeamsFromSoccerTitle(title);
    if (!teams) continue;

    const { team1, team2 } = teams;

    for (const market of pmEvent.markets || []) {
      const question = market.question || "";
      const qLower = question.toLowerCase();

      // Team win: "Will Chelsea FC win on 2026-02-21?"
      const teamWinMatch = qLower.match(/will\s+.+?\s+win\s+on/);
      // Draw: "Will Chelsea FC vs. Burnley FC end in a draw?"
      const drawMatch = qLower.includes("end in a draw") || qLower.includes("end in draw");

      let outcomeName: string;
      if (teamWinMatch) {
        const team = extractTeamFromSoccerWinQuestion(question);
        if (!team) continue;
        outcomeName = team;
      } else if (drawMatch) {
        outcomeName = "Draw";
      } else {
        continue;
      }

      const outcomes = parseMarketOutcomes(market);
      const yesOutcome = outcomes.find((o) => o.name.toLowerCase() === "yes");
      if (!yesOutcome || yesOutcome.price <= 0) continue;

      const polymarketPrice = yesOutcome.price;
      const polymarketPriceCents = polymarketPrice * 100;
      const polymarketImpliedProb = polymarketPriceCents;

      if (polymarketPriceCents < 1) continue;

      for (const oddsEvent of oddsEvents) {
        const matchesTeams =
          (soccerTeamNamesMatch(oddsEvent.home_team, team1) &&
            soccerTeamNamesMatch(oddsEvent.away_team, team2)) ||
          (soccerTeamNamesMatch(oddsEvent.home_team, team2) &&
            soccerTeamNamesMatch(oddsEvent.away_team, team1));

        if (!matchesTeams) continue;

        const bestBook = getBestBookmakerForSoccerOutcome(oddsEvent, outcomeName, "h2h");
        if (!bestBook) continue;

        const stake = 100;
        const { ev, evPercentage, potentialProfit, expectedProfit } = calculateEV(
          stake,
          polymarketPriceCents,
          bestBook.outcome.price
        );

        const quality: MatchedOpportunity["quality"] =
          evPercentage >= 5 ? "excellent" : evPercentage >= 2 ? "good" : "marginal";

        const decimalOdds = bestBook.decimalOdds;

        opportunities.push({
          id: `${pmEvent.id}-${market.id}-soccer-${outcomeName}`,
          sport,
          league,
          matchup: `${oddsEvent.home_team} vs ${oddsEvent.away_team}`,
          outcome: outcomeName === "Draw" ? "Draw" : outcomeName,
          eventTime: pmEvent.startDate || pmEvent.endDate || oddsEvent.commence_time || "",
          polymarketPrice,
          polymarketImpliedProb,
          polymarketUrl: getPolymarketUrl(pmEvent),
          polymarketEventId: pmEvent.id,
          polymarketMarketId: market.id,
          polymarketQuestion: market.question || "",
          sportsbookName: bestBook.bookmaker.title,
          sportsbookOdds: bestBook.outcome.price,
          sportsbookImpliedProb: (1 / decimalOdds) * 100,
          trueProbability: 1 / decimalOdds,
          ev,
          evPercent: evPercentage,
          profitIfWin100: potentialProfit,
          expectedProfit100: expectedProfit,
          quality,
          marketType: "game",
          timeframe: getTimeframe(pmEvent.endDate || pmEvent.startDate),
          category: "games",
        });
      }
    }
  }

  return opportunities.sort((a, b) => (b.evPercent ?? -999) - (a.evPercent ?? -999));
}
