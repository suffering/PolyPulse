"use client";

import { useMemo, useRef } from "react";
import { usePathname } from "next/navigation";
import { AiChatPanel, type BuildContextResult } from "@/components/ai/AiChatPanel";
import { usePageAiState } from "@/components/ai/PageAiContext";
import { getCurrentPageContext } from "@/lib/ai/pageContextCollectors";
import { collectTraderContext } from "@/lib/ai/trader-context";

function isTraderState(value: any): boolean {
  return (
    value &&
    typeof value === "object" &&
    typeof value.walletAddress === "string" &&
    "openPositions" in value &&
    "trades" in value
  );
}

function isAskingAboutClosed(message: string) {
  const closedKeywords = [
    "closed",
    "resolved",
    "past",
    "lost",
    "losing",
    "losses",
    "history",
    "wrong",
    "expired",
    "finished",
    "completed",
    "won",
    "wins",
    "biggest win",
    "biggest loss",
    "went wrong",
    "trade history",
    "past bets",
    "past trades",
    "what did i lose",
    "what have i won",
  ];
  const lower = message.toLowerCase();
  return closedKeywords.some((k) => lower.includes(k));
}

export function UniversalAiAssistant() {
  const pathname = usePathname() ?? "/";
  const pageAiState = usePageAiState();

  // Cache leaderboard context up to 60s when filters unchanged
  const leaderboardCacheRef = useRef<{
    filterSig: string;
    collectedAt: number;
    context: unknown;
  } | null>(null);

  const panelConfig = useMemo(() => {
    if (pathname.includes("leaderboard")) {
      return {
        title: "AI — Leaderboard Analysis",
        subtitle: null,
        suggestedPrompts: [
          "What do the top 3 traders have in common?",
          "Who has the best win rate on the leaderboard?",
          "Compare the #1 and #2 traders",
          "Which trader has the best risk-adjusted returns?",
        ],
      };
    }
    if (pathname.includes("live")) {
      return {
        title: "AI — Live Feed Analysis",
        subtitle: null,
        suggestedPrompts: [
          "What markets are being traded most right now?",
          "Are there any whale trades in the recent activity?",
          "What outcome are people mostly buying right now?",
          "Which trader has been most active in this session?",
        ],
      };
    }
    if (pathname.includes("volume")) {
      return {
        title: "AI — Volume Analysis",
        subtitle: null,
        suggestedPrompts: [
          "Which markets have the highest volume?",
          "Are there any unusual volume spikes?",
          "What does the volume data tell us?",
          "What should I infer about liquidity from this?",
        ],
      };
    }
    if (pathname.includes("extra")) {
      return {
        title: "AI — Extra Data Analysis",
        subtitle: null,
        suggestedPrompts: [
          "Summarize what stands out on this page",
          "What are the highest open interest markets visible?",
          "Which markets have the highest volume visible?",
          "What should I search for to find something interesting?",
        ],
      };
    }
    if (pathname === "/" || pathname.includes("ev")) {
      return {
        title: "AI — EV Analysis",
        subtitle: null,
        suggestedPrompts: [
          "Which bet has the highest expected value right now?",
          "Which sport has the most EV opportunities?",
          "Explain the top 3 bets to me",
          "Are any of these bets particularly high risk?",
        ],
      };
    }
    if (pathname.includes("search") || pathname.includes("portfolio")) {
      const trader = pageAiState.kind === "trader" && isTraderState(pageAiState.state)
        ? pageAiState.state
        : null;
      const wallet = trader?.walletAddress;
      const truncated = wallet && wallet.length > 10 ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}` : wallet;
      return {
        title: "AI Trading Analyst",
        subtitle: truncated ? `Analyzing ${truncated}` : "Analyzing wallet",
        suggestedPrompts: [
          "Rate my portfolio out of 10",
          "Where did I go wrong on my losing trades?",
          "Which open positions should I consider exiting?",
          "What patterns do you see in my winning trades?",
        ],
      };
    }

    return {
      title: "AI — Page Analysis",
      subtitle: null,
      suggestedPrompts: ["Summarize what is currently on screen"],
    };
  }, [pathname, pageAiState]);

  const buildContextForMessage = (userMessage: string): BuildContextResult => {
    // Trader pages: build via existing collectTraderContext, with intent detection
    if (pathname.includes("search") || pathname.includes("portfolio")) {
      const trader = pageAiState.kind === "trader" && isTraderState(pageAiState.state)
        ? pageAiState.state
        : null;

      const mode: "active" | "closed" = isAskingAboutClosed(userMessage) ? "closed" : "active";

      const context = trader
        ? collectTraderContext({
            ...(trader as any),
            mode,
            dataCollectedAt: new Date().toISOString(),
          })
        : { dataCollectedAt: new Date().toISOString(), page: "trader", note: "No trader data published yet." };

      return { context, pathname };
    }

    // Leaderboard: cache for 60s unless filters changed
    if (pathname.includes("leaderboard") && pageAiState.kind === "leaderboard") {
      const filterSig = JSON.stringify((pageAiState.state as any)?.filters ?? pageAiState.state ?? {});
      const now = Date.now();
      const cached = leaderboardCacheRef.current;
      if (cached && cached.filterSig === filterSig && now - cached.collectedAt < 60_000) {
        return { context: cached.context, pathname };
      }
      const ctx = getCurrentPageContext(pathname, pageAiState.state);
      leaderboardCacheRef.current = { filterSig, collectedAt: now, context: ctx };
      return { context: ctx, pathname };
    }

    // Other pages: always rebuild on send
    const ctx =
      pageAiState.kind === "none"
        ? { dataCollectedAt: new Date().toISOString(), page: "unknown", note: "No page data published yet." }
        : getCurrentPageContext(pathname, pageAiState.state);

    return { context: ctx, pathname };
  };

  return (
    <AiChatPanel
      resetKey={pathname}
      title={panelConfig.title}
      subtitle={panelConfig.subtitle}
      suggestedPrompts={panelConfig.suggestedPrompts}
      buildContextForMessage={buildContextForMessage}
    />
  );
}

