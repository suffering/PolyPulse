"use client";

import { useState } from "react";
import type {
  PortfolioProfile,
  PortfolioStats,
  PortfolioPnLResponse,
  TradeItem,
} from "@/lib/portfolio";
import type { OpenPosition } from "@/lib/leaderboard";
import type { TimeRange } from "@/lib/trader-stats";
import { collectTraderContext } from "@/lib/ai/trader-context";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface TraderAiChatPanelProps {
  walletAddress: string;
  profile: PortfolioProfile | null | undefined;
  stats: PortfolioStats | null | undefined;
  pnl: PortfolioPnLResponse | null | undefined;
  timeRange: TimeRange;
  openPositions: OpenPosition[];
  trades: TradeItem[];
}

function formatTime(ts: Date) {
  return ts.toLocaleTimeString("en-US", { hour12: false });
}

export function TraderAiChatPanel(props: TraderAiChatPanelProps) {
  const { walletAddress, profile, stats, pnl, timeRange, openPositions, trades } =
    props;

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const truncatedWallet =
    walletAddress.length > 10
      ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
      : walletAddress;

  const isAskingAboutClosed = (message: string) => {
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
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    setError(null);

    const now = new Date();
    const userMessage: Message = {
      id: `${now.getTime()}-user`,
      role: "user",
      content: text.trim(),
      timestamp: formatTime(now),
    };

    const historyForApi = [...messages, userMessage].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    const mode: "active" | "closed" = isAskingAboutClosed(userMessage.content)
      ? "closed"
      : "active";

    const context = collectTraderContext({
      walletAddress,
      profile,
      stats,
      pnl,
      timeRange,
      openPositions,
      trades,
      mode,
      dataCollectedAt: new Date().toISOString(),
    });

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: historyForApi,
          context,
        }),
      });

      const json = (await res.json()) as { message?: string; error?: string };

      if (!res.ok || !json.message) {
        setError(
          json.error ??
            "Something went wrong, please try again",
        );
        return;
      }

      const assistantNow = new Date();
      const assistantMessage: Message = {
        id: `${assistantNow.getTime()}-assistant`,
        role: "assistant",
        content: json.message,
        timestamp: formatTime(assistantNow),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("AI chat error:", err);
      setError("Something went wrong, please try again");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggested = (text: string) => {
    void sendMessage(text);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full border border-amber-500/60 bg-amber-500/20 px-4 py-2 text-sm font-medium text-amber-100 shadow-lg backdrop-blur hover:bg-amber-500/30"
      >
        <span className="h-2 w-2 rounded-full bg-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
        Ask AI
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-40 flex items-end justify-end bg-black/30 sm:items-center sm:justify-end">
          <div className="w-full max-w-md rounded-t-2xl border border-slate-700 bg-slate-950/95 shadow-2xl sm:mr-4 sm:mb-4 sm:rounded-2xl">
            <header className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
              <div>
                <div className="text-sm font-semibold text-slate-100">
                  AI Trading Analyst
                </div>
                <div className="text-xs text-slate-400">
                  Analyzing {truncatedWallet}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800"
              >
                Close
              </button>
            </header>

            <div className="flex max-h-[60vh] flex-col">
              <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3 text-xs">
                {messages.length === 0 && (
                  <div className="mb-3 text-[11px] text-slate-400">
                    Ask about this trader&apos;s portfolio, risk, and performance.
                  </div>
                )}

                {messages.length === 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {[
                      "Rate my portfolio out of 10",
                      "Where did I go wrong on my losing trades?",
                      "Which open positions should I consider exiting?",
                      "What patterns do you see in my winning trades?",
                    ].map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => handleSuggested(prompt)}
                        className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-[11px] text-slate-200 hover:bg-slate-800"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                )}

                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${
                      m.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-md px-3 py-2 ${
                        m.role === "user"
                          ? "bg-slate-800 text-slate-50"
                          : "bg-slate-900 text-slate-100"
                      }`}
                    >
                      <div className="whitespace-pre-wrap text-[11px]">
                        {m.content}
                      </div>
                      <div className="mt-1 text-[10px] text-slate-500">
                        {m.role === "user" ? "You" : "AI"} · {m.timestamp}
                      </div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
                    <span className="inline-flex h-1.5 w-1.5 animate-pulse rounded-full bg-slate-400" />
                    AI is thinking…
                  </div>
                )}

                {error && (
                  <div className="mt-1 text-[11px] text-red-400">{error}</div>
                )}
              </div>

              <form
                className="flex items-center gap-2 border-t border-slate-800 px-3 py-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  void sendMessage(input);
                }}
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about this trader's performance…"
                  className="flex-1 rounded-md border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/60"
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="rounded-md border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs text-slate-100 hover:bg-slate-700 disabled:opacity-50"
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

