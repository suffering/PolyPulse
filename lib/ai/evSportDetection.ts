import type { MatchedOpportunity } from "@/lib/matching";

export type EvSportKey = "nba" | "mlb" | "nhl" | "tennis" | "mls";

export const SPORT_KEYS: EvSportKey[] = ["nba", "mlb", "nhl", "tennis", "mls"];

export const SPORT_LABELS: Record<EvSportKey, string> = {
  nba: "NBA",
  mlb: "MLB",
  nhl: "NHL",
  tennis: "Tennis",
  mls: "Soccer",
};

const MESSAGE_KEYWORDS: Record<EvSportKey, string[]> = {
  nba: ["nba", "basketball", "hoops"],
  mlb: ["mlb", "baseball"],
  nhl: ["nhl", "hockey", "ice hockey"],
  tennis: ["tennis", "atp", "wta"],
  mls: ["mls", "soccer", "football"],
};

/**
 * Normalize sport string (e.g. "NBA", "Basketball") to EvSportKey or null.
 */
export function opportunitySportToKey(sport: string | null | undefined): EvSportKey | null {
  if (sport == null || typeof sport !== "string") return null;
  const lower = sport.trim().toLowerCase();
  if (SPORT_KEYS.includes(lower as EvSportKey)) return lower as EvSportKey;
  const byLabel: Record<string, EvSportKey> = {
    basketball: "nba",
    baseball: "mlb",
    hockey: "nhl",
    "ice hockey": "nhl",
    soccer: "mls",
    football: "mls",
  };
  return byLabel[lower] ?? null;
}

/**
 * Detect which sport(s) the user is asking about from their message.
 * Returns an array of EvSportKey; if none detected, returns [].
 */
export function detectSportsFromMessage(
  userMessage: string,
  _fullDataset: MatchedOpportunity[] // reserved for future use (e.g. match by market titles)
): EvSportKey[] {
  void _fullDataset;
  const msg = userMessage.trim().toLowerCase();
  const detected: EvSportKey[] = [];
  for (const key of SPORT_KEYS) {
    const keywords = MESSAGE_KEYWORDS[key];
    if (keywords.some((kw) => msg.includes(kw))) detected.push(key);
  }
  return detected;
}
