"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { PolymarketEvent, PolymarketMarket } from "@/lib/polymarket";
import { useSetPageAiState } from "@/components/ai/PageAiContext";

const PAGE_SIZE = 100;
const ROWS_PER_PAGE = 25;

type EventsResponse = {
  events: PolymarketEvent[];
  hasMore: boolean;
};

type MarketsResponse = {
  markets: PolymarketMarket[];
  hasMore: boolean;
};

async function fetchEventsPage(offset: number): Promise<EventsResponse> {
  const res = await fetch(
    `/api/markets/events?limit=${PAGE_SIZE}&offset=${offset}`
  );
  if (!res.ok) throw new Error("Failed to fetch events");
  return res.json();
}

async function fetchMarketsPage(offset: number): Promise<MarketsResponse> {
  const res = await fetch(
    `/api/markets?limit=${PAGE_SIZE}&offset=${offset}`
  );
  if (!res.ok) throw new Error("Failed to fetch markets");
  return res.json();
}

function formatCurrency(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "$0.0";
  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}`;
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function getEventUrl(event: PolymarketEvent): string {
  const slug = event.slug ?? event.id;
  return `https://polymarket.com/event/${slug}`;
}

function getMarketUrl(market: PolymarketMarket): string {
  const slug = market.slug ?? market.id;
  return `https://polymarket.com/event/${slug}?market=${market.id}`;
}

const tableScrollClass = "overflow-y-auto overflow-x-auto min-h-0";
const tableContainerHeight = "max-h-[45vh]";
const denseCell = "px-2 py-1 text-xs whitespace-nowrap";

export default function ExtradataPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [loadedEvents, setLoadedEvents] = useState<PolymarketEvent[]>([]);
  const [loadedMarkets, setLoadedMarkets] = useState<PolymarketMarket[]>([]);
  const [clientPage, setClientPage] = useState(1);
  const [hasMoreEvents, setHasMoreEvents] = useState(true);
  const [hasMoreMarkets, setHasMoreMarkets] = useState(true);
  const [offsetEvents, setOffsetEvents] = useState(0);
  const [offsetMarkets, setOffsetMarkets] = useState(0);

  const { data: eventsData, isLoading: eventsLoading, isFetching: eventsFetching, isError: eventsError, error: eventsErr } = useQuery({
    queryKey: ["polymarket-events", offsetEvents],
    queryFn: () => fetchEventsPage(offsetEvents),
    enabled:
      (offsetEvents === 0 && loadedEvents.length === 0) ||
      (offsetEvents > 0 && loadedEvents.length === offsetEvents),
    refetchInterval: 5 * 60 * 1000,
  });

  const { data: marketsData, isLoading: marketsLoading, isFetching: marketsFetching, isError: marketsError, error: marketsErr } = useQuery({
    queryKey: ["polymarket-markets", offsetMarkets],
    queryFn: () => fetchMarketsPage(offsetMarkets),
    enabled:
      (offsetMarkets === 0 && loadedMarkets.length === 0) ||
      (offsetMarkets > 0 && loadedMarkets.length === offsetMarkets),
    refetchInterval: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!eventsData?.events?.length) return;
    if (offsetEvents === 0) {
      setLoadedEvents(eventsData.events);
      setHasMoreEvents(eventsData.hasMore);
    } else {
      setLoadedEvents((prev) => [...prev, ...eventsData.events]);
      setHasMoreEvents(eventsData.hasMore);
    }
  }, [eventsData, offsetEvents]);

  useEffect(() => {
    if (!marketsData?.markets?.length) return;
    if (offsetMarkets === 0) {
      setLoadedMarkets(marketsData.markets);
      setHasMoreMarkets(marketsData.hasMore);
    } else {
      setLoadedMarkets((prev) => [...prev, ...marketsData.markets]);
      setHasMoreMarkets(marketsData.hasMore);
    }
  }, [marketsData, offsetMarkets]);

  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return loadedEvents;
    const q = searchQuery.trim().toLowerCase();
    return loadedEvents.filter(
      (e) => (e.title ?? "").toLowerCase().includes(q)
    );
  }, [loadedEvents, searchQuery]);

  const filteredMarkets = useMemo(() => {
    let list = loadedMarkets;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (m) => m.question?.toLowerCase().includes(q) || (m.groupItemTitle ?? "").toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => (b.volumeNum ?? 0) - (a.volumeNum ?? 0));
  }, [loadedMarkets, searchQuery]);

  const totalFilteredEvents = filteredEvents.length;
  const totalFilteredMarkets = filteredMarkets.length;
  const totalPages = Math.max(
    1,
    Math.max(
      Math.ceil(totalFilteredEvents / ROWS_PER_PAGE),
      Math.ceil(totalFilteredMarkets / ROWS_PER_PAGE)
    )
  );
  const page = Math.min(clientPage, totalPages);
  const start = (page - 1) * ROWS_PER_PAGE;
  const pageEvents = useMemo(
    () => filteredEvents.slice(start, start + ROWS_PER_PAGE),
    [filteredEvents, start]
  );
  const pageMarkets = useMemo(
    () => filteredMarkets.slice(start, start + ROWS_PER_PAGE),
    [filteredMarkets, start]
  );

  const loadMore = useCallback(() => {
    setOffsetEvents(loadedEvents.length);
    setOffsetMarkets(loadedMarkets.length);
  }, [loadedEvents.length, loadedMarkets.length]);

  const goToPage = useCallback((p: number) => {
    setClientPage(Math.max(1, Math.min(p, totalPages)));
  }, [totalPages]);

  const isLoading = eventsLoading || marketsLoading;
  const isFetching = eventsFetching || marketsFetching;
  const isError = eventsError || marketsError;
  const error = eventsError ? eventsErr : marketsErr;
  const hasMoreGlobal = hasMoreEvents || hasMoreMarkets;
  const showFooter = !isError && (loadedEvents.length > 0 || loadedMarkets.length > 0 || isLoading);
  const setPageAiState = useSetPageAiState();

  useEffect(() => {
    setPageAiState({
      kind: "extra",
      state: {
        searchQuery,
        page,
        totalPages,
        eventsVisible: pageEvents.map((e) => ({
          id: e.id,
          title: e.title ?? null,
          liquidity: e.liquidity,
          volume: e.volume,
        })),
        marketsVisible: pageMarkets.map((m) => ({
          id: m.id,
          question: m.question ?? null,
          groupItemTitle: m.groupItemTitle ?? null,
          liquidityNum: m.liquidityNum ?? 0,
          volumeNum: m.volumeNum ?? 0,
        })),
        totalFilteredEvents,
        totalFilteredMarkets,
        hasMore: hasMoreGlobal,
      },
    });
  }, [
    setPageAiState,
    searchQuery,
    page,
    totalPages,
    pageEvents,
    pageMarkets,
    totalFilteredEvents,
    totalFilteredMarkets,
    hasMoreGlobal,
  ]);

  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-200 font-mono">
      <div className="max-w-[1600px] mx-auto px-4 py-6 grid grid-cols-1 gap-4">
        <header className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white tracking-tight">
            Markets
          </h1>
          <Link
            href="/"
            className="px-3 py-1.5 rounded border border-slate-600 bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 transition-colors text-sm"
          >
            ← Back to EV Engine
          </Link>
        </header>

        {isError && (
          <div className="text-center py-8 text-red-400">
            Error: {error instanceof Error ? error.message : "Failed to load data"}
          </div>
        )}

        {!isError && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Polymarket Active Questions — EVENT-level (title, OI, notional volume) */}
            <section className="border border-slate-700/50 rounded-lg bg-slate-900/30 overflow-hidden flex flex-col flex-1 min-w-0">
              <h2 className="px-3 py-2 text-sm font-semibold text-white border-b border-slate-700/50 shrink-0">
                Polymarket Active Markets
              </h2>
              {eventsLoading && offsetEvents === 0 ? (
                <div className="p-6 text-center text-slate-500 text-sm">Loading...</div>
              ) : (
                <div className={`${tableScrollClass} ${tableContainerHeight} shrink min-h-0`}>
                  <table className="w-full text-left border-collapse min-w-[900px]">
                    <thead className="sticky top-0 bg-slate-800/30 border-b border-slate-700/50 z-10">
                      <tr>
                        <th className={`${denseCell} text-slate-400 font-medium uppercase tracking-wider min-w-[220px]`}>
                          Question
                        </th>
                        <th className={`${denseCell} text-slate-400 font-medium uppercase tracking-wider`}>
                          Open Interest
                        </th>
                        <th className={`${denseCell} text-slate-400 font-medium uppercase tracking-wider`}>
                          Notional Volume
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageEvents.map((event) => (
                        <tr
                          key={event.id}
                          className="border-b border-slate-700/30 hover:bg-slate-800/30 transition-colors"
                        >
                          <td className={`${denseCell} min-w-[220px] whitespace-nowrap`}>
                            <a
                              href={getEventUrl(event)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 underline"
                            >
                              {event.title ?? event.id}
                            </a>
                          </td>
                          <td className={`${denseCell} text-slate-200`}>
                            {formatCurrency(toNumber(event.liquidity))}
                          </td>
                          <td className={`${denseCell} text-slate-200`}>
                            {formatCurrency(toNumber(event.volume))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Polymarket Active Markets — MARKET-level (market, OI, notional vol, volume, unique traders) */}
            <section className="border border-slate-700/50 rounded-lg bg-slate-900/30 overflow-hidden flex flex-col flex-1 min-w-0">
              <h2 className="px-3 py-2 text-sm font-semibold text-white border-b border-slate-700/50 shrink-0">
                Polymarket Active Questions
              </h2>
              {marketsLoading && offsetMarkets === 0 ? (
                <div className="p-6 text-center text-slate-500 text-sm">Loading...</div>
              ) : (
                <div className={`${tableScrollClass} ${tableContainerHeight} shrink min-h-0`}>
                  <table className="w-full text-left border-collapse min-w-[900px]">
                    <thead className="sticky top-0 bg-slate-800/30 border-b border-slate-700/50 z-10">
                      <tr>
                        <th className={`${denseCell} text-slate-400 font-medium uppercase tracking-wider min-w-[220px]`}>
                          Market
                        </th>
                        <th className={`${denseCell} text-slate-400 font-medium uppercase tracking-wider`}>
                          Open Interest
                        </th>
                        <th className={`${denseCell} text-slate-400 font-medium uppercase tracking-wider`}>
                          Notional Volume
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageMarkets.map((market) => (
                        <tr
                          key={market.id}
                          className="border-b border-slate-700/30 hover:bg-slate-800/30 transition-colors"
                        >
                          <td className={`${denseCell} min-w-[220px] whitespace-nowrap`}>
                            <a
                              href={getMarketUrl(market)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 underline break-words"
                            >
                              {market.question ?? market.groupItemTitle ?? market.id}
                            </a>
                          </td>
                          <td className={`${denseCell} text-slate-200`}>
                            {formatCurrency(market.liquidityNum)}
                          </td>
                          <td className={`${denseCell} text-slate-200`}>
                            {formatCurrency(market.volumeNum)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}

        {/* Shared footer: row count, search, pagination */}
        {showFooter && (
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 py-2 border border-slate-700/50 rounded-lg bg-slate-800/20">
            <span className="text-slate-500 text-sm">
              {totalFilteredEvents.toLocaleString("en-US")} events, {totalFilteredMarkets.toLocaleString("en-US")} markets
            </span>
            <input
              type="search"
              placeholder="Q Search..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setClientPage(1);
              }}
              className="w-44 px-2 py-1.5 rounded border border-slate-600 bg-slate-800/50 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 text-sm"
            />
            <div className="flex items-center justify-end gap-2">
              {hasMoreGlobal && (
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={isFetching}
                  className="px-2 py-1 rounded border border-slate-600 bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 disabled:opacity-50 text-sm"
                >
                  {isFetching ? "Loading..." : "Load more"}
                </button>
              )}
              <span className="text-slate-500 text-sm inline-flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1}
                  className="p-1 rounded border border-slate-600 text-slate-400 hover:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Previous page"
                >
                  ←
                </button>
                {page} … {totalPages}
                <button
                  type="button"
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= totalPages}
                  className="p-1 rounded border border-slate-600 text-slate-400 hover:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Next page"
                >
                  →
                </button>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
