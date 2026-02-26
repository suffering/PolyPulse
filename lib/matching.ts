import type { OddsApiEvent, OddsApiBookmaker } from "./odds-api";
import type { PolymarketEvent, PolymarketMarket } from "./polymarket";
import { parseMarketOutcomes } from "./polymarket";
import { calculateEV } from "./calculator";
import { getMarketType, getTimeframe, getMarketCategory } from "./types";
import type { MarketCategory } from "./types";

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
  "new jersey devils": ["new jersey", "devils", "nj devils"],
  "buffalo sabres": ["buffalo", "sabres"],
  "washington capitals": ["washington", "capitals", "caps"],
  "philadelphia flyers": ["philadelphia", "flyers"],
  "los angeles kings": ["la kings", "kings"],
  "columbus blue jackets": ["columbus", "blue jackets", "jackets"],
  "toronto maple leafs": ["toronto", "maple leafs", "leafs"],
  "montreal canadiens": ["montreal", "canadiens", "habs"],
  "ottawa senators": ["ottawa", "senators", "sens"],
  "boston bruins": ["boston", "bruins"],
  "detroit red wings": ["detroit", "red wings", "wings"],
  "florida panthers": ["florida", "panthers"],
  "tampa bay lightning": ["tampa bay", "lightning", "bolts"],
  "carolina hurricanes": ["carolina", "hurricanes", "canes"],
  "new york rangers": ["ny rangers", "rangers"],
  "new york islanders": ["ny islanders", "islanders", "isles"],
  "pittsburgh penguins": ["pittsburgh", "penguins", "pens"],
  "nashville predators": ["nashville", "predators", "preds"],
  "st louis blues": ["st louis", "st. louis", "blues"],
  "chicago blackhawks": ["chicago", "blackhawks", "hawks"],
  "minnesota wild": ["minnesota", "wild"],
  "dallas stars": ["dallas", "stars"],
  "colorado avalanche": ["colorado", "avalanche", "avs"],
  "winnipeg jets": ["winnipeg", "jets"],
  "arizona coyotes": ["arizona", "coyotes", "yotes"],
  "vegas golden knights": ["vegas", "golden knights", "vgk"],
  "seattle kraken": ["seattle", "kraken"],
  "calgary flames": ["calgary", "flames"],
  "edmonton oilers": ["edmonton", "oilers"],
  "vancouver canucks": ["vancouver", "canucks", "nucks"],
  "anaheim ducks": ["anaheim", "ducks"],
  "san jose sharks": ["san jose", "sharks"],
  // MLB
  "new york yankees": ["ny yankees", "yankees", "nyy"],
  "boston red sox": ["boston", "red sox", "sox"],
  "tampa bay rays": ["tampa bay", "rays"],
  "toronto blue jays": ["toronto", "blue jays", "jays"],
  "baltimore orioles": ["baltimore", "orioles", "os"],
  "cleveland guardians": ["cleveland", "guardians"],
  "detroit tigers": ["detroit", "tigers"],
  "chicago white sox": ["chicago", "white sox", "pale hose"],
  "kansas city royals": ["kansas city", "royals", "kc"],
  "minnesota twins": ["minnesota", "twins"],
  "houston astros": ["houston", "astros", "stros"],
  "seattle mariners": ["seattle", "mariners", "ms"],
  "los angeles angels": ["la angels", "angels", "halos"],
  "oakland athletics": ["oakland", "athletics", "as", "oakland a"],
  "texas rangers": ["texas", "rangers"],
  "atlanta braves": ["atlanta", "braves"],
  "philadelphia phillies": ["philadelphia", "phillies", "phils"],
  "new york mets": ["ny mets", "mets"],
  "washington nationals": ["washington", "nationals", "nats"],
  "miami marlins": ["miami", "marlins"],
  "milwaukee brewers": ["milwaukee", "brewers", "brew crew"],
  "chicago cubs": ["chicago", "cubs"],
  "st louis cardinals": ["st louis", "st. louis", "cardinals", "cards"],
  "pittsburgh pirates": ["pittsburgh", "pirates", "bucs"],
  "cincinnati reds": ["cincinnati", "reds"],
  "arizona diamondbacks": ["arizona", "diamondbacks", "dbacks"],
  "los angeles dodgers": ["la dodgers", "dodgers"],
  "san diego padres": ["san diego", "padres"],
  "san francisco giants": ["san francisco", "giants", "sf giants"],
  "colorado rockies": ["colorado", "rockies"],
};

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
  "lille": ["lille osc", "losc lille"],
  "monaco": ["as monaco", "monaco fc"],
  "marseille": ["olympique marseille", "om", "olympique de marseille"],
  "lyon": ["olympique lyon", "olympique lyonnais", "ol"],
  "lens": ["rc lens", "lens"],
  "rennes": ["stade rennais", "stade rennais fc"],
  "napoli": ["ssc napoli", "napoli fc"],
  "roma": ["as roma", "roma fc"],
  "lazio": ["ss lazio", "lazio roma"],
  "inter": ["inter milan", "fc internazionale", "inter milano"],
  "fiorentina": ["acf fiorentina", "fiorentina"],
  "atalanta": ["atalanta bc", "atalanta bergamasca"],
  "bologna": ["bologna fc", "bologna"],
  "torino": ["torino fc", "torino"],
  "leverkusen": ["bayer leverkusen", "bayer 04 leverkusen"],
  "rb leipzig": ["rasenballsport leipzig", "leipzig", "rbl"],
  "eintracht frankfurt": ["eintracht", "frankfurt", "sg eintracht"],
  "borussia monchengladbach": ["monchengladbach", "gladbach", "borussia mg"],
  "freiburg": ["sc freiburg", "sport-club freiburg"],
  "hoffenheim": ["tsg hoffenheim", "1899 hoffenheim", "tsg"],
  "wolfsburg": ["vfl wolfsburg", "vfl wolfsburg"],
  "union berlin": ["1. fc union berlin", "union berlin", "fc union berlin"],
  "sevilla": ["sevilla fc", "sevilla"],
  "real sociedad": ["real sociedad de futbol", "real sociedad", "la real"],
  "real betis": ["real betis balompie", "betis", "real betis"],
  "villarreal": ["villarreal cf", "villarreal", "yellow submarine"],
  "athletic bilbao": ["athletic club", "athletic bilbao", "bilbao", "atletic club bilbao"],
  "valencia": ["valencia cf", "valencia"],
  "getafe": ["getafe cf", "getafe"],
  "girona": ["girona fc", "girona"],
  // MLS
  "inter miami cf": ["inter miami", "miami", "inter miami cf"],
  "la galaxy": ["los angeles galaxy", "galaxy", "la galaxy"],
  "seattle sounders fc": ["seattle sounders", "sounders", "seattle"],
  "atlanta united fc": ["atlanta united", "atlanta", "atl utd"],
  "new york city fc": ["nycfc", "new york city", "nyc"],
  "new york red bulls": ["ny red bulls", "red bulls", "new york rb"],
  "los angeles fc": ["lafc", "la fc", "los angeles fc"],
  "portland timbers": ["portland", "timbers"],
  "real salt lake": ["salt lake", "rsl"],
  "fc dallas": ["dallas", "fcd"],
  "houston dynamo fc": ["houston dynamo", "dynamo", "houston"],
  "sporting kansas city": ["sporting kc", "kansas city", "skc", "sporting kansas city"],
  "minnesota united fc": ["minnesota united", "minnesota", "min utd"],
  "colorado rapids": ["rapids", "colorado"],
  "austin fc": ["austin"],
  "nashville sc": ["nashville", "nashville sc"],
  "orlando city sc": ["orlando city", "orlando"],
  "cf montreal": ["montreal", "cf montreal", "impact"],
  "toronto fc": ["toronto", "tfc"],
  "chicago fire fc": ["chicago fire", "chicago", "fire"],
  "columbus crew": ["columbus crew sc", "columbus", "crew"],
  "dc united": ["washington dc", "dc united", "dc"],
  "philadelphia union": ["philadelphia", "union", "philly"],
  "new england revolution": ["new england", "revolution", "revs"],
  "charlotte fc": ["charlotte"],
  "san jose earthquakes": ["san jose", "earthquakes", "quakes"],
  "vancouver whitecaps fc": ["vancouver whitecaps", "vancouver", "whitecaps"],
  "st louis city sc": ["st louis", "st. louis", "st louis city"],
};

export function normalizeTeamName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s&]/g, "")
    .trim();
}

function normalizeSoccerTeamName(name: string): string {
  const accentFolded = name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
  return normalizeTeamName(accentFolded)
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
  league?: string;
  matchup: string;
  outcome: string;
  eventTime: string;
  polymarketPrice: number;
  polymarketImpliedProb: number;
  polymarketUrl: string;
  polymarketEventId: string;
  polymarketMarketId: string;
  polymarketQuestion: string;
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

function hasOddsApiMatch(title: string): boolean {
  const t = title.toLowerCase();
  return (
    (t.includes("champion") && !t.includes("conference")) ||
    t.includes("finals") ||
    t.includes("world series") ||
    t.includes("stanley cup") ||
    t.includes("mls cup") ||
    (t.includes("cup") && t.includes("winner"))
  );
}

export function matchOutrights(
  polymarketEvents: PolymarketEvent[],
  oddsEvents: OddsApiEvent[],
  sport: string
): MatchedOpportunity[] {
  const opportunities: MatchedOpportunity[] = [];

  for (const pmEvent of polymarketEvents) {
    const title = pmEvent.title || "";
    const category = getMarketCategory(title);

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

      if (hasOddsApiMatch(title) && category === "championship") {
        for (const oddsEvent of oddsEvents) {
          const bestBook =
            getBestBookmakerForTeam(oddsEvent, outcomeName, "outrights") ||
            getBestBookmakerForTeam(oddsEvent, outcomeName, "h2h");
          if (!bestBook) continue;

          const stake = 100;
          const { ev, evPercentage, potentialProfit, expectedProfit } = calculateEV(
            stake,
            polymarketPrice,
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

function getBestBookmakerForSoccerOutrights(
  event: OddsApiEvent,
  teamName: string
): { bookmaker: OddsApiBookmaker; outcome: { price: number }; decimalOdds: number } | null {
  let best: { bookmaker: OddsApiBookmaker; outcome: { price: number }; decimalOdds: number } | null =
    null;
  for (const bookmaker of event.bookmakers) {
    const market = bookmaker.markets.find((m) => m.key === "outrights");
    if (!market) continue;
    const outcome = market.outcomes.find((o) => soccerTeamNamesMatch(o.name, teamName));
    if (!outcome) continue;
    const decimalOdds =
      outcome.price > 0 ? 1 + outcome.price / 100 : 1 + 100 / Math.abs(outcome.price);
    if (!best || decimalOdds > best.decimalOdds) {
      best = { bookmaker, outcome, decimalOdds };
    }
  }
  return best;
}

export function matchSoccerOutrights(
  polymarketEvents: PolymarketEvent[],
  oddsEvents: OddsApiEvent[],
  sport: string,
  league: string
): MatchedOpportunity[] {
  const opportunities: MatchedOpportunity[] = [];

  for (const pmEvent of polymarketEvents) {
    const title = pmEvent.title || "";
    const category = getMarketCategory(title);
    const timeframe = getTimeframe(pmEvent.endDate || pmEvent.startDate);

    if (category === "games" || category === "win_totals") continue;
    if (timeframe !== "futures") continue;
    if (!hasOddsApiMatch(title)) continue;

    for (const market of pmEvent.markets || []) {
      const outcomeName =
        market.groupItemTitle || extractTeamOrPlayerFromQuestion(market.question);
      if (!outcomeName) continue;

      const outcomes = parseMarketOutcomes(market);
      const yesOutcome = outcomes.find((o) => o.name.toLowerCase() === "yes");
      if (!yesOutcome || yesOutcome.price <= 0) continue;

      const polymarketPrice = yesOutcome.price;
      const polymarketPriceCents = polymarketPrice * 100;
      if (polymarketPriceCents < 1) continue;

      let bestBook: { bookmaker: OddsApiBookmaker; outcome: { price: number }; decimalOdds: number } | null = null;
      for (const oddsEvent of oddsEvents) {
        const book = getBestBookmakerForSoccerOutrights(oddsEvent, outcomeName);
        if (book && (!bestBook || book.decimalOdds > bestBook.decimalOdds)) bestBook = book;
      }

      if (bestBook) {
        const stake = 100;
        const { ev, evPercentage, potentialProfit, expectedProfit } = calculateEV(
          stake,
          polymarketPrice,
          bestBook.outcome.price
        );
        const quality: MatchedOpportunity["quality"] =
          evPercentage >= 5 ? "excellent" : evPercentage >= 2 ? "good" : "marginal";
        opportunities.push({
          id: `${pmEvent.id}-${market.id}-${outcomeName}`,
          sport,
          league,
          matchup: title || "Outright",
          outcome: outcomeName,
          eventTime: pmEvent.endDate || pmEvent.startDate || "",
          polymarketPrice,
          polymarketImpliedProb: polymarketPriceCents,
          polymarketUrl: getPolymarketUrl(pmEvent),
          polymarketEventId: pmEvent.id,
          polymarketMarketId: market.id,
          polymarketQuestion: market.question || "",
          sportsbookName: bestBook.bookmaker.title,
          sportsbookOdds: bestBook.outcome.price,
          sportsbookImpliedProb: (1 / bestBook.decimalOdds) * 100,
          trueProbability: 1 / bestBook.decimalOdds,
          ev,
          evPercent: evPercentage,
          profitIfWin100: potentialProfit,
          expectedProfit100: expectedProfit,
          quality,
          marketType: "futures",
          timeframe: "futures",
          category,
        });
      } else {
        opportunities.push({
          id: `pm-only-${pmEvent.id}-${market.id}-${outcomeName}`,
          sport,
          league,
          matchup: title || "Outright",
          outcome: outcomeName,
          eventTime: pmEvent.endDate || pmEvent.startDate || "",
          polymarketPrice,
          polymarketImpliedProb: polymarketPriceCents,
          polymarketUrl: getPolymarketUrl(pmEvent),
          polymarketEventId: pmEvent.id,
          polymarketMarketId: market.id,
          polymarketQuestion: market.question || "",
          marketType: "futures",
          timeframe: "futures",
          category,
        });
      }
    }
  }

  return opportunities.sort((a, b) => (b.evPercent ?? -999) - (a.evPercent ?? -999));
}

export function matchPolymarketOnlyOutrights(
  polymarketEvents: PolymarketEvent[],
  sport: string,
  league?: string
): MatchedOpportunity[] {
  const opportunities: MatchedOpportunity[] = [];

  for (const pmEvent of polymarketEvents) {
    const title = pmEvent.title || "";
    const category = getMarketCategory(title);
    const timeframe = getTimeframe(pmEvent.endDate || pmEvent.startDate);

    if (category === "games" || category === "win_totals") continue;
    if (timeframe !== "futures") continue;
    if (!hasOddsApiMatch(title)) continue;

    for (const market of pmEvent.markets || []) {
      const outcomeName =
        market.groupItemTitle || extractTeamOrPlayerFromQuestion(market.question);
      if (!outcomeName) continue;

      const outcomes = parseMarketOutcomes(market);
      const yesOutcome = outcomes.find((o) => o.name.toLowerCase() === "yes");
      if (!yesOutcome || yesOutcome.price <= 0) continue;

      const polymarketPrice = yesOutcome.price;
      const polymarketPriceCents = polymarketPrice * 100;
      if (polymarketPriceCents < 1) continue;

      opportunities.push({
        id: `pm-only-${pmEvent.id}-${market.id}-${outcomeName}`,
        sport,
        league,
        matchup: title || "Outright",
        outcome: outcomeName,
        eventTime: pmEvent.endDate || pmEvent.startDate || "",
        polymarketPrice,
        polymarketImpliedProb: polymarketPriceCents,
        polymarketUrl: getPolymarketUrl(pmEvent),
        polymarketEventId: pmEvent.id,
        polymarketMarketId: market.id,
        polymarketQuestion: market.question || "",
        marketType: getMarketType(market.question || title),
        timeframe: "futures",
        category,
      });
    }
  }

  return opportunities;
}

function extractTeamFromQuestion(question: string): string | null {
  const match = question.match(/Will (?:the )?([^?]+) win/);
  return match ? match[1].trim() : null;
}

function extractTeamOrPlayerFromQuestion(question: string): string | null {
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

function extractTeamsFromTitle(title: string): { team1: string; team2: string } | null {
  const clean = title.trim();
  const vsMatch = clean.match(/^(.+?)\s+(?:vs\.?|v\.?|-)\s+(.+)$/i);
  if (vsMatch) return { team1: vsMatch[1].trim(), team2: vsMatch[2].trim() };
  return null;
}

function extractTeamsFromGameQuestion(question: string): { team1: string; team2: string } | null {
  const q = question.toLowerCase();
  const beatMatch = q.match(/will\s+(?:the\s+)?([^?]+?)\s+(?:beat|defeat)\s+(?:the\s+)?([^?]+?)\s*\??/);
  if (beatMatch) return { team1: beatMatch[1].trim(), team2: beatMatch[2].trim() };
  const winAgainstMatch = q.match(/will\s+(?:the\s+)?([^?]+?)\s+win\s+against\s+(?:the\s+)?([^?]+?)\s*\??/);
  if (winAgainstMatch) return { team1: winAgainstMatch[1].trim(), team2: winAgainstMatch[2].trim() };
  return null;
}

function extractTeamFromWinQuestion(question: string): string | null {
  const match = question.match(/will\s+(?:the\s+)?([^?]+?)\s+win\s*\??/i);
  return match ? match[1].trim() : null;
}

export function matchH2HGames(
  polymarketEvents: PolymarketEvent[],
  oddsEvents: OddsApiEvent[],
  sport: string,
  options?: { includeWithoutSportsbook?: boolean }
): MatchedOpportunity[] {
  const opportunities: MatchedOpportunity[] = [];
  const includeWithoutSportsbook = options?.includeWithoutSportsbook ?? false;

  for (const pmEvent of polymarketEvents) {
    const title = (pmEvent.title || "").toLowerCase();
    const isGameLevel =
      title.includes("beat") ||
      title.includes("defeat") ||
      title.includes("win against") ||
      title.includes(" vs") ||
      title.includes(" v ");

    for (const market of pmEvent.markets || []) {
      const question = market.question || "";
      const qLower = question.toLowerCase();
      
      const isPlayerProp =
        qLower.includes("points") ||
        qLower.includes("assists") ||
        qLower.includes("rebounds") ||
        qLower.includes("steals") ||
        qLower.includes("blocks") ||
        qLower.includes("threes") ||
        qLower.includes("3-pointers") ||
        qLower.includes("turnovers") ||
        qLower.includes("minutes") ||
        qLower.includes("goals") ||
        qLower.includes("saves") ||
        qLower.includes("shots") ||
        qLower.includes("hits") ||
        qLower.includes("strikeouts") ||
        qLower.includes("home runs") ||
        qLower.includes("rbi") ||
        qLower.includes("aces") ||
        qLower.includes("double faults") ||
        qLower.includes("o/u") ||
        qLower.includes("over/under") ||
        qLower.includes("spread:") ||
        qLower.includes("total:") ||
        qLower.match(/\d+\.\d+/);
      
      if (isPlayerProp) continue;
      
      const isPartialGame =
        qLower.includes("1h ") ||
        qLower.includes("2h ") ||
        qLower.includes("1st half") ||
        qLower.includes("2nd half") ||
        qLower.includes("first half") ||
        qLower.includes("second half") ||
        qLower.includes("1st quarter") ||
        qLower.includes("2nd quarter") ||
        qLower.includes("3rd quarter") ||
        qLower.includes("4th quarter") ||
        qLower.includes("1st period") ||
        qLower.includes("2nd period") ||
        qLower.includes("3rd period");
      
      if (isPartialGame) continue;
      
      const isGameQuestion =
        qLower.includes("beat") ||
        qLower.includes("defeat") ||
        qLower.includes("win against") ||
        (qLower.includes("will") && qLower.includes("win")) ||
        qLower.includes(" vs") ||
        qLower.includes(" v ") ||
        qLower.includes("moneyline");
      if (!isGameLevel && !isGameQuestion) continue;

      let teams = extractTeamsFromGameQuestion(question);
      let yesMeansTeam1 = !!teams;
      if (!teams) {
        teams = extractTeamsFromTitle(question);
      }
      if (!teams) {
        const teamsFromTitle = extractTeamsFromTitle(pmEvent.title || "");
        if (teamsFromTitle) {
          if (qLower.includes("will") && qLower.includes("win")) {
            const teamFromQ = extractTeamFromWinQuestion(question);
            if (teamFromQ) {
              if (teamNamesMatch(teamFromQ, teamsFromTitle.team1)) {
                teams = teamsFromTitle;
                yesMeansTeam1 = true;
              } else if (teamNamesMatch(teamFromQ, teamsFromTitle.team2)) {
                teams = { team1: teamsFromTitle.team2, team2: teamsFromTitle.team1 };
                yesMeansTeam1 = true;
              }
            }
          }
          if (!teams) {
            teams = teamsFromTitle;
          }
        }
      }
      if (!teams) continue;

      const { team1, team2 } = teams;

      const outcomes = parseMarketOutcomes(market);
      let polymarketPrice: number | null = null;
      const team1Outcome = outcomes.find((o) => teamNamesMatch(o.name, team1));
      const yesOutcome = outcomes.find((o) => o.name.toLowerCase() === "yes");

      if (team1Outcome && team1Outcome.price > 0) {
        polymarketPrice = team1Outcome.price;
      } else if (yesOutcome && yesOutcome.price > 0 && yesMeansTeam1) {
        polymarketPrice = yesOutcome.price;
      }
      
      if (!polymarketPrice || polymarketPrice <= 0) continue;

      const polymarketPriceCents = polymarketPrice * 100;
      const polymarketImpliedProb = polymarketPriceCents;

      if (polymarketPriceCents < 1) continue;

      const gameStartTime = market.gameStartTime || null;

      let matched = false;
      for (const oddsEvent of oddsEvents) {
        const eventTime = gameStartTime || oddsEvent.commence_time || pmEvent.startDate || pmEvent.endDate || "";
        const timeframeDate = gameStartTime || oddsEvent.commence_time || pmEvent.startDate || pmEvent.endDate;
        const matchesTeams =
          (teamNamesMatch(oddsEvent.home_team, team1) && teamNamesMatch(oddsEvent.away_team, team2)) ||
          (teamNamesMatch(oddsEvent.home_team, team2) && teamNamesMatch(oddsEvent.away_team, team1));

        if (!matchesTeams) continue;

        matched = true;
        const bestBook = getBestBookmakerForTeam(oddsEvent, team1, "h2h");
        if (!bestBook) {
          if (includeWithoutSportsbook) {
            opportunities.push({
              id: `${pmEvent.id}-${market.id}-h2h-nobook`,
              sport,
              matchup: `${oddsEvent.home_team} vs ${oddsEvent.away_team}`,
              outcome: team1,
              eventTime,
              polymarketPrice,
              polymarketImpliedProb,
              polymarketUrl: getPolymarketUrl(pmEvent),
              polymarketEventId: pmEvent.id,
              polymarketMarketId: market.id,
              polymarketQuestion: market.question || "",
              marketType: "game",
              timeframe: getTimeframe(timeframeDate),
              category: "games",
            });
          }
          continue;
        }

        const decimalOdds = bestBook.decimalOdds;
        const sportsbookImpliedPct = (1 / decimalOdds) * 100;
        if (
          polymarketImpliedProb < 45 &&
          sportsbookImpliedPct > 55
        ) {
          continue;
        }
        if (
          polymarketImpliedProb > 55 &&
          sportsbookImpliedPct < 45
        ) {
          continue;
        }

        const stake = 100;
        const { ev, evPercentage, potentialProfit, expectedProfit } = calculateEV(
          stake,
          polymarketPrice,
          bestBook.outcome.price
        );

        const quality: MatchedOpportunity["quality"] =
          evPercentage >= 5 ? "excellent" : evPercentage >= 2 ? "good" : "marginal";

        opportunities.push({
          id: `${pmEvent.id}-${market.id}-h2h`,
          sport,
          matchup: `${team1} vs ${team2}`,
          outcome: team1,
          eventTime,
          polymarketPrice,
          polymarketImpliedProb,
          polymarketUrl: getPolymarketUrl(pmEvent),
          polymarketEventId: pmEvent.id,
          polymarketMarketId: market.id,
          polymarketQuestion: market.question || "",
          sportsbookName: bestBook.bookmaker.title,
          sportsbookOdds: bestBook.outcome.price,
          sportsbookImpliedProb: sportsbookImpliedPct,
          trueProbability: 1 / decimalOdds,
          ev,
          evPercent: evPercentage,
          profitIfWin100: potentialProfit,
          expectedProfit100: expectedProfit,
          quality,
          marketType: "game",
          timeframe: getTimeframe(timeframeDate),
          category: "games",
        });
      }

      if (includeWithoutSportsbook && !matched) {
        const pmOnlyEventTime = gameStartTime || pmEvent.startDate || pmEvent.endDate || "";
        const pmOnlyTimeframeDate = gameStartTime || pmEvent.startDate || pmEvent.endDate;
        
        opportunities.push({
          id: `${pmEvent.id}-${market.id}-h2h-pmonly`,
          sport,
          matchup: `${team1} vs ${team2}`,
          outcome: team1,
          eventTime: pmOnlyEventTime,
          polymarketPrice,
          polymarketImpliedProb,
          polymarketUrl: getPolymarketUrl(pmEvent),
          polymarketEventId: pmEvent.id,
          polymarketMarketId: market.id,
          polymarketQuestion: market.question || "",
          marketType: "game",
          timeframe: getTimeframe(pmOnlyTimeframeDate),
          category: "games",
        });
      }
    }
  }

  const deduplicated = new Map<string, MatchedOpportunity>();
  for (const opp of opportunities) {
    const key = `${opp.matchup}|${opp.outcome}`;
    const existing = deduplicated.get(key);
    if (!existing) {
      deduplicated.set(key, opp);
    } else {
      const existingTime = new Date(existing.eventTime || 0).getTime();
      const oppTime = new Date(opp.eventTime || 0).getTime();
      if (oppTime < existingTime || (oppTime === existingTime && (opp.evPercent ?? -999) > (existing.evPercent ?? -999))) {
        deduplicated.set(key, opp);
      }
    }
  }

  return Array.from(deduplicated.values()).sort((a, b) => {
    const timeA = new Date(a.eventTime || 0).getTime();
    const timeB = new Date(b.eventTime || 0).getTime();
    return timeA - timeB;
  });
}

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

      for (const oddsEvent of oddsEvents) {
        const matchesTeam =
          teamNamesMatch(oddsEvent.home_team, teamName) ||
          teamNamesMatch(oddsEvent.away_team, teamName);

        if (!matchesTeam) continue;

        let bestBook: { bookmaker: OddsApiBookmaker; outcome: { price: number }; decimalOdds: number } | null = null;

        for (const bookmaker of oddsEvent.bookmakers) {
          const totalsMarket = bookmaker.markets.find((m) => m.key === "totals");
          if (!totalsMarket) continue;

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
          polymarketPrice,
          bestBook.outcome.price
        );

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

function americanToDecimalFromPrice(american: number): number {
  return american > 0 ? 1 + american / 100 : 1 + 100 / Math.abs(american);
}

function getBestBookmakerForSoccerOutcome(
  event: OddsApiEvent,
  outcomeName: string
): { bookmaker: OddsApiBookmaker; outcome: { price: number }; decimalOdds: number } | null {
  const marketKeys: ("h2h_3_way" | "h2h")[] = ["h2h_3_way", "h2h"];
  let best: { bookmaker: OddsApiBookmaker; outcome: { price: number }; decimalOdds: number } | null =
    null;

  for (const bookmaker of event.bookmakers) {
    for (const marketKey of marketKeys) {
      const market = bookmaker.markets.find((m) => m.key === marketKey);
      if (!market) continue;

      const isDraw = outcomeName.toLowerCase() === "draw";
      let outcome: { name: string; price: number } | undefined;
      if (isDraw) {
        outcome = market.outcomes.find(
          (o) => o.name === "Draw" || o.name.toLowerCase() === "tie"
        );
      } else {
        outcome = market.outcomes.find((o) => {
          if (o.name === "Draw") return false;
          if (o.name === "Home") return soccerTeamNamesMatch(event.home_team, outcomeName);
          if (o.name === "Away") return soccerTeamNamesMatch(event.away_team, outcomeName);
          return soccerTeamNamesMatch(o.name, outcomeName);
        });
      }

      if (!outcome) continue;

      const decimalOdds = americanToDecimalFromPrice(outcome.price);
      if (!best || decimalOdds > best.decimalOdds) {
        best = { bookmaker, outcome, decimalOdds };
      }
      break;
    }
  }
  return best;
}

function extractTeamsFromSoccerTitle(title: string): { team1: string; team2: string } | null {
  const clean = title.replace(/\s*-\s*More Markets\s*$/i, "").trim();
  const match = clean.match(/^(.+?)\s+(?:vs\.?|v\.?|-)\s+(.+)$/i);
  return match ? { team1: match[1].trim(), team2: match[2].trim() } : null;
}

function extractTeamFromSoccerWinQuestion(question: string): string | null {
  const match = question.match(/Will\s+(.+?)\s+win\s+on/i);
  return match ? match[1].trim() : null;
}

function getSoccerOutcomePrice(
  market: PolymarketMarket,
  outcomeName: string,
  team1: string,
  team2: string
): number | null {
  const outcomes = parseMarketOutcomes(market);
  if (outcomes.length === 0) return null;

  const yesOutcome = outcomes.find((o) => o.name.toLowerCase() === "yes");
  if (yesOutcome != null && yesOutcome.price > 0) {
    const matchesThisMarket =
      outcomeName === "Draw" ||
      soccerTeamNamesMatch(outcomeName, team1) ||
      soccerTeamNamesMatch(outcomeName, team2);
    if (matchesThisMarket) return yesOutcome.price;
  }

  const drawOutcome = outcomes.find(
    (o) => o.name.toLowerCase() === "draw" || o.name.toLowerCase().includes("draw")
  );
  if (outcomeName === "Draw" && drawOutcome != null && drawOutcome.price > 0)
    return drawOutcome.price;

  for (const o of outcomes) {
    if (o.name.toLowerCase() === "yes" || o.name.toLowerCase() === "no") continue;
    if (soccerTeamNamesMatch(o.name, outcomeName) && o.price > 0) return o.price;
  }
  return null;
}

export function matchSoccerH2H(
  polymarketEvents: PolymarketEvent[],
  oddsEvents: OddsApiEvent[],
  sport: string,
  league: string,
  options?: { includeWithoutSportsbook?: boolean }
): MatchedOpportunity[] {
  const opportunities: MatchedOpportunity[] = [];
  const includeWithoutSportsbook = options?.includeWithoutSportsbook ?? false;

  for (const pmEvent of polymarketEvents) {
    const title = pmEvent.title || "";
    const teams = extractTeamsFromSoccerTitle(title);
    if (!teams) continue;

    const { team1, team2 } = teams;

    for (const market of pmEvent.markets || []) {
      const question = market.question || "";
      const qLower = question.toLowerCase();
      
      const isPartialGame =
        qLower.includes("1h ") ||
        qLower.includes("2h ") ||
        qLower.includes("1st half") ||
        qLower.includes("2nd half") ||
        qLower.includes("first half") ||
        qLower.includes("second half");
      
      if (isPartialGame) continue;
      
      const outcomes = parseMarketOutcomes(market);

      const teamWinMatch = qLower.match(/will\s+.+?\s+win\s+on/);
      const drawMatch = qLower.includes("end in a draw") || qLower.includes("end in draw");

      const outcomeCandidates: { outcomeName: string; price: number }[] = [];

      if (teamWinMatch || drawMatch) {
        let outcomeName: string;
        if (teamWinMatch) {
          const team = extractTeamFromSoccerWinQuestion(question);
          if (!team) continue;
          outcomeName = team;
        } else {
          outcomeName = "Draw";
        }
        const outcomeMatchesEvent =
          outcomeName === "Draw" ||
          soccerTeamNamesMatch(outcomeName, team1) ||
          soccerTeamNamesMatch(outcomeName, team2);
        if (!outcomeMatchesEvent) continue;
        const price = getSoccerOutcomePrice(market, outcomeName, team1, team2);
        if (price != null && price > 0 && price * 100 >= 1)
          outcomeCandidates.push({ outcomeName, price });
      } else {
        for (const o of outcomes) {
          if (o.name.toLowerCase() === "yes" || o.name.toLowerCase() === "no") continue;
          if (o.price <= 0 || o.price * 100 < 1) continue;
          const isDraw =
            o.name.toLowerCase() === "draw" || o.name.toLowerCase().includes("draw");
          const isTeam1 = !isDraw && soccerTeamNamesMatch(o.name, team1);
          const isTeam2 = !isDraw && soccerTeamNamesMatch(o.name, team2);
          if (isDraw) outcomeCandidates.push({ outcomeName: "Draw", price: o.price });
          else if (isTeam1) outcomeCandidates.push({ outcomeName: team1, price: o.price });
          else if (isTeam2) outcomeCandidates.push({ outcomeName: team2, price: o.price });
        }
      }

      for (const { outcomeName, price: polymarketPrice } of outcomeCandidates) {
        const polymarketPriceCents = polymarketPrice * 100;
        const polymarketImpliedProb = polymarketPriceCents;
        const gameStartTime = market.gameStartTime || null;
        let matched = false;

        for (const oddsEvent of oddsEvents) {
        const eventTime = gameStartTime || oddsEvent.commence_time || pmEvent.startDate || pmEvent.endDate || "";
        const timeframeDate = gameStartTime || oddsEvent.commence_time || pmEvent.startDate || pmEvent.endDate;
        const matchesTeams =
          (soccerTeamNamesMatch(oddsEvent.home_team, team1) &&
            soccerTeamNamesMatch(oddsEvent.away_team, team2)) ||
          (soccerTeamNamesMatch(oddsEvent.home_team, team2) &&
            soccerTeamNamesMatch(oddsEvent.away_team, team1));

        if (!matchesTeams) continue;

        const bestBook = getBestBookmakerForSoccerOutcome(oddsEvent, outcomeName);
        if (!bestBook) {
          if (includeWithoutSportsbook) {
            const eventTime = gameStartTime || oddsEvent.commence_time || pmEvent.startDate || pmEvent.endDate || "";
            const timeframeDate = gameStartTime || oddsEvent.commence_time || pmEvent.startDate || pmEvent.endDate;
            const displayOutcome =
              outcomeName === "Draw" ? "Draw" : outcomeName;
            opportunities.push({
              id: `${pmEvent.id}-${market.id}-soccer-nobook-${outcomeName}`,
              sport,
              league,
              matchup: `${oddsEvent.home_team} vs ${oddsEvent.away_team}`,
              outcome: displayOutcome,
              eventTime,
              polymarketPrice,
              polymarketImpliedProb,
              polymarketUrl: getPolymarketUrl(pmEvent),
              polymarketEventId: pmEvent.id,
              polymarketMarketId: market.id,
              polymarketQuestion: market.question || "",
              marketType: "game",
              timeframe: getTimeframe(timeframeDate),
              category: "games",
            });
            matched = true;
          }
          continue;
        }

        const displayOutcome =
          outcomeName === "Draw"
            ? "Draw"
            : soccerTeamNamesMatch(outcomeName, oddsEvent.home_team)
              ? oddsEvent.home_team
              : oddsEvent.away_team;

        const stake = 100;
        const { ev, evPercentage, potentialProfit, expectedProfit } = calculateEV(
          stake,
          polymarketPrice,
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
          outcome: displayOutcome,
          eventTime,
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
          timeframe: getTimeframe(timeframeDate),
          category: "games",
        });
        matched = true;
        }

        if (includeWithoutSportsbook && !matched) {
          const eventTime = gameStartTime || pmEvent.startDate || pmEvent.endDate || "";
          const timeframeDate = gameStartTime || pmEvent.startDate || pmEvent.endDate;
          const displayOutcome = outcomeName === "Draw" ? "Draw" : outcomeName;
          opportunities.push({
            id: `${pmEvent.id}-${market.id}-soccer-pmonly-${outcomeName}`,
            sport,
            league,
            matchup: `${team1} vs ${team2}`,
            outcome: displayOutcome,
            eventTime,
            polymarketPrice,
            polymarketImpliedProb,
            polymarketUrl: getPolymarketUrl(pmEvent),
            polymarketEventId: pmEvent.id,
            polymarketMarketId: market.id,
            polymarketQuestion: market.question || "",
            marketType: "game",
            timeframe: getTimeframe(timeframeDate),
            category: "games",
          });
        }
      }
    }
  }

  const byKey = new Map<string, MatchedOpportunity>();
  for (const opp of opportunities) {
    const key = `${opp.matchup}|${opp.outcome}`;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, opp);
    } else {
      const existingTime = new Date(existing.eventTime || 0).getTime();
      const oppTime = new Date(opp.eventTime || 0).getTime();
      if (oppTime < existingTime || (oppTime === existingTime && (opp.polymarketPrice ?? 0) > (existing.polymarketPrice ?? 0))) {
        byKey.set(key, opp);
      }
    }
  }
  return Array.from(byKey.values()).sort(
    (a, b) => new Date(a.eventTime || 0).getTime() - new Date(b.eventTime || 0).getTime()
  );
}
