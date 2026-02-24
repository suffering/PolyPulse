import { buildSystemPrompt, type TraderContext } from "@/lib/ai/trader-context";

function isTraderContext(value: any): value is TraderContext {
  return (
    value &&
    typeof value === "object" &&
    typeof value.walletAddress === "string" &&
    typeof value.dataCollectedAt === "string" &&
    typeof value.profile === "object"
  );
}

export function buildPageAwareSystemPrompt(context: unknown, pathname: string): string {
  // Trader pages reuse the existing trader-specific prompt
  if (isTraderContext(context)) {
    return buildSystemPrompt(context);
  }

  const collectedAt =
    (context as any)?.dataCollectedAt && typeof (context as any).dataCollectedAt === "string"
      ? (context as any).dataCollectedAt
      : new Date().toISOString();

  const shared = [
    "You are a Polymarket data analyst.",
    "Be specific, use the exact numbers from the data provided, and be direct.",
    "Do not give generic advice. Every answer must reference specific data points from the context provided.",
    `The data provided was collected at ${collectedAt}.`,
    "",
  ];

  const additions: string[] = [];

  if (pathname === "/" || pathname.includes("ev")) {
    additions.push(
      "You are analyzing the PolyPulse +EV engine data. You have access to all current positive expected value betting opportunities being displayed.",
      "You can help the user identify the best bets, understand EV calculations, compare sportsbook odds vs Polymarket prices, and decide which opportunities are worth acting on.",
      "All EV calculations are pre-computed and provided in the data.",
      "",
    );
  } else if (pathname.includes("leaderboard")) {
    additions.push(
      "You are analyzing the Polymarket leaderboard data. You have the complete rankings, PNL figures, and volume data for all displayed traders.",
      "You can compare traders, identify what top performers have in common, analyze ranking movements, and help the user understand what separates top traders from the rest.",
      "",
    );
  } else if (pathname.includes("live")) {
    additions.push(
      "You are analyzing a live stream of Polymarket trades. You have the last 100 trades that occurred on the platform.",
      "You can identify whale activity (large trades), trending markets being heavily traded, patterns in what outcomes are being bought, and unusual activity.",
      "Data is from the current live session and may be seconds old.",
      "",
    );
  } else if (pathname.includes("volume")) {
    additions.push(
      "You are analyzing Polymarket volume data. You have access to all volume metrics currently displayed.",
      "You can identify which markets are seeing the most activity, spot unusual volume spikes, and help the user understand market liquidity.",
      "",
    );
  } else if (pathname.includes("extra")) {
    additions.push(
      "You are analyzing additional Polymarket data metrics.",
      "Answer questions about the data currently displayed on this page.",
      "",
    );
  } else {
    additions.push(
      "You are analyzing the data currently displayed on this page.",
      "",
    );
  }

  const json = JSON.stringify(context ?? {}, null, 2);

  return [
    ...shared,
    ...additions,
    "Here is the complete data currently on screen:",
    json,
    "",
    "Keep responses concise and structured.",
    "Use bullet points for lists.",
    "Bold key numbers and names.",
    "Maximum response length is 400 words unless the user asks for a detailed breakdown.",
  ].join("\n");
}

