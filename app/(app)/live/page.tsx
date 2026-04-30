"use client";

import { useEffect, useRef, useState } from "react";
import { useSetPageAiState } from "@/components/ai/PageAiContext";

type ConnectionStatus = "CONNECTING" | "LIVE" | "DISCONNECTED";

type Trade = {
  id: string;
  timestamp: number;
  title: string;
  side: "BUY" | "SELL";
  outcome: string;
  price: number;
  size: number;
  dollarValue: number;
  proxyWallet: string;
  isNew?: boolean;
};

type LiveTradeRaw = {
  transactionHash?: unknown;
  outcomeIndex?: unknown;
  timestamp?: unknown;
  size?: unknown;
  title?: unknown;
  side?: unknown;
  outcome?: unknown;
  price?: unknown;
  proxyWallet?: unknown;
};

const MAX_ROWS = 100;

export default function LivePage() {
  const [status, setStatus] = useState<ConnectionStatus>("CONNECTING");
  const [trades, setTrades] = useState<Trade[]>([]);
  const [paused, setPaused] = useState(false);
  const [totalReceived, setTotalReceived] = useState(0);
  const setPageAiState = useSetPageAiState();

  const unmountedRef = useRef(false);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const pausedRef = useRef(false);

  useEffect(() => {
    unmountedRef.current = false;

    const fetchTrades = async () => {
      if (unmountedRef.current || pausedRef.current) return;

      try {
        const res = await fetch("/api/live/trades?limit=100", { cache: "no-store" });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const payload = (await res.json()) as { trades?: unknown[] };
        const data = Array.isArray(payload.trades) ? payload.trades : [];

        setStatus("LIVE");
        const seen = seenIdsRef.current;
        const newTrades: Trade[] = [];

        for (const raw of data) {
          const r = raw as LiveTradeRaw;
          const key = `${r.transactionHash ?? ""}-${r.outcomeIndex ?? ""}-${r.timestamp ?? ""}-${r.size ?? ""}`;
          if (!key || seen.has(key)) continue;
          seen.add(key);

          newTrades.push({
            id: key,
            timestamp: Number(r.timestamp ?? 0),
            title: String(r.title ?? "N/A"),
            side: r.side === "SELL" ? "SELL" : "BUY",
            outcome: String(r.outcome ?? "N/A"),
            price: Number(r.price ?? 0),
            size: Number(r.size ?? 0),
            dollarValue: Number(r.price ?? 0) * Number(r.size ?? 0),
            proxyWallet: String(r.proxyWallet ?? "N/A"),
            isNew: true,
          });
        }

        if (newTrades.length > 0) {
          setTotalReceived((count) => count + newTrades.length);
          setTrades((prev) =>
            [...newTrades, ...prev].slice(0, MAX_ROWS).map((t, i) => ({
              ...t,
              isNew: i < newTrades.length,
            }))
          );
        }
      } catch (error) {
        console.warn("Failed to fetch trades", error);
        setStatus("DISCONNECTED");
      }
    };

    setStatus("CONNECTING");
    void fetchTrades();
    const intervalId = setInterval(fetchTrades, 3000);

    return () => {
      unmountedRef.current = true;
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    setPageAiState({
      kind: "live",
      state: {
        lastTrades: trades.slice(0, 100),
        totalReceived,
        status,
      },
    });
  }, [setPageAiState, trades, totalReceived, status]);

  const formatTime = (unixSeconds: number) => {
    if (!unixSeconds) return "N/A";
    const d = new Date(unixSeconds * 1000);
    return d.toLocaleTimeString("en-US", { hour12: false });
  };

  const formatAddress = (address: string) => {
    if (!address || address.length < 12) return address || "N/A";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <main className="min-h-screen bg-[#04040a] px-6 py-6 flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Live Trade Feed
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          className="px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/80 text-sm font-medium hover:bg-white/15 hover:border-white/30 transition-all duration-150"
        >
          {paused ? "Resume" : "Pause"}
        </button>
      </div>

      {/* Data Table */}
      <div className="flex-1 flex flex-col border border-[#1a1a2e] bg-[#0d0d14] overflow-hidden">
        {/* Header Row */}
        <div className="grid grid-cols-[100px,2fr,70px,1fr,80px,80px,110px,1fr] gap-4 px-4 py-3 bg-[#0e0e1a] border-b border-[#1a1a2e] text-[10px] uppercase tracking-widest font-semibold text-white/40 shrink-0">
          <div>Time</div>
          <div>Market</div>
          <div>Side</div>
          <div>Outcome</div>
          <div>Price</div>
          <div>Size</div>
          <div>Value (USD)</div>
          <div>Trader</div>
        </div>

        {/* Rows */}
        <div className="flex-1 overflow-y-auto">
          {trades.length === 0 ? (
            <div className="flex h-full items-center justify-center text-white/30 text-sm">
              Waiting for live trades...
            </div>
          ) : (
            <div className="divide-y divide-[#1a1a2e]">
              {trades.map((trade, idx) => (
                <div
                  key={trade.id}
                  className={`grid grid-cols-[100px,2fr,70px,1fr,80px,80px,110px,1fr] gap-4 px-4 py-2 font-mono text-xs transition-colors duration-300 ${
                    idx % 2 === 0 ? "bg-[#0d0d14]" : "bg-[#09090f]"
                  } ${
                    trade.isNew ? "animate-slide-in bg-indigo-950/20" : ""
                  }`}
                >
                  <div className="truncate text-white/40">
                    {formatTime(trade.timestamp)}
                  </div>
                  <div className="truncate text-white" title={trade.title}>
                    {trade.title}
                  </div>
                  <div
                    className={`font-bold ${
                      trade.side === "BUY"
                        ? "text-[#4ade80]"
                        : "text-[#f87171]"
                    }`}
                  >
                    {trade.side}
                  </div>
                  <div className="truncate text-white/50">{trade.outcome}</div>
                  <div className="text-white/60">{(trade.price * 100).toFixed(1)}c</div>
                  <div className="text-white/60">{trade.size.toFixed(2)}</div>
                  <div className="text-white">${trade.dollarValue.toFixed(2)}</div>
                  <div
                    className="truncate text-white/50"
                    title={trade.proxyWallet}
                  >
                    {formatAddress(trade.proxyWallet)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes fadeOut {
          from {
            background-color: rgba(79, 39, 245, 0.2);
          }
          to {
            background-color: transparent;
          }
        }
        
        .animate-slide-in {
          animation: slideIn 200ms ease-out, fadeOut 600ms ease-out 200ms;
        }
      `}</style>
    </main>
  );
}
