"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { PolymarketEvent, PolymarketMarket } from "@/lib/polymarket";
import { useSetPageAiState } from "@/components/ai/PageAiContext";

const PAGE_SIZE = 100;
const ROWS_PER_PAGE = 50;

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

export default function MarketsPage() {
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
    <div className="min-h-screen bg-[#000000]">
      <main className="ml-[200px] min-h-screen bg-[#000000] px-8 py-8 flex flex-col">
        {/* Search Bar */}
        <div className="mb-8">
          <input
            type="search"
            placeholder="Search markets..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setClientPage(1);
            }}
            className="w-full px-4 py-3 rounded-lg border border-white/8 bg-[#0d0d0d] text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 text-base"
          />
        </div>

        {isError && (
          <div className="text-center py-12 text-red-400">
            Error: {error instanceof Error ? error.message : "Failed to load data"}
          </div>
        )}

        {!isError && (
          <div className="flex-1 flex flex-col gap-8">
            {/* Active Markets Table */}
            <section className="border border-white/8 rounded-lg bg-[#0a0a0a] overflow-hidden flex flex-col flex-1 min-h-0">
              <div className="px-6 py-4 border-b border-white/5 bg-[#0d0d0d] shrink-0">
                <h2 className="text-base font-semibold text-white">
                  Polymarket Active Markets
                </h2>
              </div>
              {eventsLoading && offsetEvents === 0 ? (
                <div className="p-8 text-center text-gray-500">Loading...</div>
              ) : pageEvents.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No markets found</div>
              ) : (
                <div className="overflow-y-auto flex-1 min-h-0">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-[#0d0d0d] border-b border-white/5 z-10">
                      <tr>
                        <th className="px-6 py-3 text-sm font-semibold text-gray-400 uppercase tracking-wider">
                          Question
                        </th>
                        <th className="px-6 py-3 text-sm font-semibold text-gray-400 uppercase tracking-wider text-right">
                          Open Interest
                        </th>
                        <th className="px-6 py-3 text-sm font-semibold text-gray-400 uppercase tracking-wider text-right">
                          Notional Volume
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {pageEvents.map((event) => (
                        <tr
                          key={event.id}
                          className="hover:bg-white/5 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <a
                              href={getEventUrl(event)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 underline text-base break-words"
                            >
                              {event.title ?? event.id}
                            </a>
                          </td>
                          <td className="px-6 py-4 text-white text-base text-right font-mono">
                            {formatCurrency(toNumber(event.liquidity))}
                          </td>
                          <td className="px-6 py-4 text-white text-base text-right font-mono">
                            {formatCurrency(toNumber(event.volume))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Active Questions Table */}
            <section className="border border-white/8 rounded-lg bg-[#0a0a0a] overflow-hidden flex flex-col flex-1 min-h-0">
              <div className="px-6 py-4 border-b border-white/5 bg-[#0d0d0d] shrink-0">
                <h2 className="text-base font-semibold text-white">
                  Polymarket Active Questions
                </h2>
              </div>
              {marketsLoading && offsetMarkets === 0 ? (
                <div className="p-8 text-center text-gray-500">Loading...</div>
              ) : pageMarkets.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No questions found</div>
              ) : (
                <div className="overflow-y-auto flex-1 min-h-0">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-[#0d0d0d] border-b border-white/5 z-10">
                      <tr>
                        <th className="px-6 py-3 text-sm font-semibold text-gray-400 uppercase tracking-wider">
                          Market
                        </th>
                        <th className="px-6 py-3 text-sm font-semibold text-gray-400 uppercase tracking-wider text-right">
                          Open Interest
                        </th>
                        <th className="px-6 py-3 text-sm font-semibold text-gray-400 uppercase tracking-wider text-right">
                          Notional Volume
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {pageMarkets.map((market) => (
                        <tr
                          key={market.id}
                          className="hover:bg-white/5 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <a
                              href={getMarketUrl(market)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 underline text-base break-words"
                            >
                              {market.question ?? market.groupItemTitle ?? market.id}
                            </a>
                          </td>
                          <td className="px-6 py-4 text-white text-base text-right font-mono">
                            {formatCurrency(market.liquidityNum)}
                          </td>
                          <td className="px-6 py-4 text-white text-base text-right font-mono">
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

        {/* Footer Pagination */}
        {showFooter && (
          <div className="mt-8 flex items-center justify-between gap-4 px-6 py-4 border border-white/8 rounded-lg bg-[#0d0d0d] shrink-0">
            <div className="text-gray-500 text-sm">
              {totalFilteredEvents.toLocaleString("en-US")} markets, {totalFilteredMarkets.toLocaleString("en-US")} questions
            </div>
            <div className="flex items-center gap-3">
              {hasMoreGlobal && (
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={isFetching}
                  className="px-4 py-2 rounded-lg border border-white/8 bg-white/5 text-white hover:bg-white/10 disabled:opacity-50 text-sm font-medium transition-colors"
                >
                  {isFetching ? "Loading..." : "Load more"}
                </button>
              )}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1}
                  className="p-2 rounded-lg border border-white/8 text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Previous page"
                >
                  ←
                </button>
                <span className="text-gray-500 text-sm">
                  {page} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= totalPages}
                  className="p-2 rounded-lg border border-white/8 text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Next page"
                >
                  →
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
