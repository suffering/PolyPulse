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
          const key = `${raw.transactionHash ?? ""}-${raw.outcomeIndex ?? ""}-${raw.timestamp ?? ""}-${raw.size ?? ""}`;
          if (!key || seen.has(key)) continue;
          seen.add(key);

          newTrades.push({
            id: key,
            timestamp: Number(raw.timestamp ?? 0),
            title: String(raw.title ?? "N/A"),
            side: raw.side === "SELL" ? "SELL" : "BUY",
            outcome: String(raw.outcome ?? "N/A"),
            price: Number(raw.price ?? 0),
            size: Number(raw.size ?? 0),
            dollarValue: Number(raw.price ?? 0) * Number(raw.size ?? 0),
            proxyWallet: String(raw.proxyWallet ?? "N/A"),
          });
        }

        if (newTrades.length > 0) {
          setTotalReceived((count) => count + newTrades.length);
          setTrades((prev) => [...newTrades, ...prev].slice(0, MAX_ROWS));
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
    <main className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-lg font-semibold text-slate-100">Live Trade Feed</div>
          <div className="text-sm text-slate-400">
            Status:{" "}
            {status === "DISCONNECTED"
              ? "DISCONNECTED — retrying every 3s"
              : status === "LIVE"
                ? `LIVE — ${totalReceived} trades`
                : status}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          className="rounded-md border border-slate-600 bg-slate-800/50 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-700/60 transition-colors"
        >
          {paused ? "Resume" : "Pause"}
        </button>
      </div>

      <section className="rounded-lg border border-slate-800 bg-slate-950/70 shadow-sm">
        <header className="grid grid-cols-[90px,minmax(0,1.7fr),70px,minmax(0,1fr),80px,80px,110px,150px] gap-2 border-b border-slate-800 bg-slate-900/60 px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-slate-400">
          <div>Time</div>
          <div>Market</div>
          <div>Side</div>
          <div>Outcome</div>
          <div>Price</div>
          <div>Size</div>
          <div>Value (USD)</div>
          <div>Trader</div>
        </header>
        <div className="h-[480px] overflow-y-auto text-xs font-mono text-slate-200">
          {trades.length === 0 ? (
            <div className="flex h-full items-center justify-center text-slate-500">
              Waiting for live trades...
            </div>
          ) : (
            <ul className="divide-y divide-slate-800/80">
              {trades.map((trade) => (
                <li
                  key={trade.id}
                  className="grid grid-cols-[90px,minmax(0,1.7fr),70px,minmax(0,1fr),80px,80px,110px,150px] gap-2 px-3 py-1.5 hover:bg-slate-900/60"
                >
                  <div className="truncate">{formatTime(trade.timestamp)}</div>
                  <div className="truncate" title={trade.title}>
                    {trade.title}
                  </div>
                  <div
                    className={
                      trade.side === "BUY"
                        ? "text-emerald-400"
                        : "text-rose-400"
                    }
                  >
                    {trade.side}
                  </div>
                  <div className="truncate">{trade.outcome}</div>
                  <div>{(trade.price * 100).toFixed(1)}c</div>
                  <div>{trade.size.toFixed(2)}</div>
                  <div>${trade.dollarValue.toFixed(2)}</div>
                  <div className="truncate" title={trade.proxyWallet}>
                    {formatAddress(trade.proxyWallet)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}

