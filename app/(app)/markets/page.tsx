"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { PolymarketEvent, PolymarketMarket } from "@/lib/polymarket";
import { useSetPageAiState } from "@/components/ai/PageAiContext";

const PAGE_SIZE = 100;
const INITIAL_DISPLAY = 10;
const LOAD_MORE_INCREMENT = 10;

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
  if (value == null || !Number.isFinite(value)) return "$0";
  return `$${Math.round(value).toLocaleString("en-US")}`;
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
  const [hasMoreEvents, setHasMoreEvents] = useState(true);
  const [hasMoreMarkets, setHasMoreMarkets] = useState(true);
  const [offsetEvents, setOffsetEvents] = useState(0);
  const [offsetMarkets, setOffsetMarkets] = useState(0);
  // Shared display count — both columns always show the same number of rows.
  const [displayCount, setDisplayCount] = useState(INITIAL_DISPLAY);

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

  // Both columns slice from the same displayCount so row counts stay in sync.
  const pageEvents = useMemo(
    () => filteredEvents.slice(0, displayCount),
    [filteredEvents, displayCount]
  );
  const pageMarkets = useMemo(
    () => filteredMarkets.slice(0, displayCount),
    [filteredMarkets, displayCount]
  );

  const canShowMore =
    displayCount < totalFilteredEvents ||
    displayCount < totalFilteredMarkets ||
    hasMoreEvents ||
    hasMoreMarkets;

  const loadMore = useCallback(() => {
    const nextCount = displayCount + LOAD_MORE_INCREMENT;
    setDisplayCount(nextCount);
    // Fetch more from API if we're approaching the end of loaded data.
    if (nextCount > loadedEvents.length - LOAD_MORE_INCREMENT && hasMoreEvents) {
      setOffsetEvents(loadedEvents.length);
    }
    if (nextCount > loadedMarkets.length - LOAD_MORE_INCREMENT && hasMoreMarkets) {
      setOffsetMarkets(loadedMarkets.length);
    }
  }, [displayCount, loadedEvents.length, loadedMarkets.length, hasMoreEvents, hasMoreMarkets]);

  const isLoading = eventsLoading || marketsLoading;
  const isFetching = eventsFetching || marketsFetching;
  const isError = eventsError || marketsError;
  const error = eventsError ? eventsErr : marketsErr;
  const showFooter = !isError && (loadedEvents.length > 0 || loadedMarkets.length > 0 || isLoading);
  const setPageAiState = useSetPageAiState();

  useEffect(() => {
    setPageAiState({
      kind: "extra",
      state: {
        searchQuery,
        displayCount,
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
        canShowMore,
      },
    });
  }, [
    setPageAiState,
    searchQuery,
    displayCount,
    pageEvents,
    pageMarkets,
    totalFilteredEvents,
    totalFilteredMarkets,
    canShowMore,
  ]);

  return (
    <div className="min-h-screen bg-[#04040a]">
      <main className="min-h-screen bg-[#04040a] px-6 py-6 flex flex-col">
        {isError && (
          <div className="text-center py-12 text-red-400">
            Error: {error instanceof Error ? error.message : "Failed to load data"}
          </div>
        )}

        {!isError && (
          <div className="flex-1 w-full max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
            {/* Active Markets Table */}
            <section className="bg-[#0d0d14] border border-[#1a1a2e] rounded-xl overflow-hidden flex flex-col min-h-0 p-4">
              <div className="flex items-center gap-3 px-2 pb-4 shrink-0">
                <div className="w-1 h-5 bg-[#4B4BF7]"></div>
                <h2 className="text-base font-medium text-white">
                  Polymarket Active Markets
                </h2>
              </div>

              {eventsLoading && offsetEvents === 0 ? (
                <div className="p-8 text-center text-white/40 text-sm">Loading...</div>
              ) : pageEvents.length === 0 ? (
                <div className="p-8 text-center text-white/40 text-sm">No markets found</div>
              ) : (
                <div className="overflow-y-auto flex-1 min-h-0">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-[#0d0d14] z-10">
                      <tr className="border-b border-[#1a1a2e]">
                        <th className="px-4 py-3 text-[11px] font-medium text-[#4B4BF7] uppercase tracking-[0.15em]">
                          Question
                        </th>
                        <th className="px-4 py-3 text-[11px] font-medium text-[#4B4BF7] uppercase tracking-[0.15em] text-right">
                          Open Interest
                        </th>
                        <th className="px-4 py-3 text-[11px] font-medium text-[#4B4BF7] uppercase tracking-[0.15em] text-right">
                          Notional Volume
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageEvents.map((event) => (
                        <tr
                          key={event.id}
                          className="border-b border-[#1a1a2e]"
                        >
                          <td className="px-4 py-4 align-top">
                            <a
                              href={getEventUrl(event)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#4B4BF7] hover:opacity-70 transition-opacity text-sm break-words"
                            >
                              {event.title ?? event.id}
                            </a>
                          </td>
                          <td className="px-4 py-4 text-[#4ade80] text-sm text-right font-mono whitespace-nowrap align-top">
                            {formatCurrency(toNumber(event.liquidity))}
                          </td>
                          <td className="px-4 py-4 text-[#4ade80] text-sm text-right font-mono whitespace-nowrap align-top">
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
            <section className="bg-[#0d0d14] border border-[#1a1a2e] rounded-xl overflow-hidden flex flex-col min-h-0 p-4">
              <div className="flex items-center gap-3 px-2 pb-4 shrink-0">
                <div className="w-1 h-5 bg-[#4B4BF7]"></div>
                <h2 className="text-base font-medium text-white">
                  Polymarket Active Questions
                </h2>
              </div>

              {marketsLoading && offsetMarkets === 0 ? (
                <div className="p-8 text-center text-white/40 text-sm">Loading...</div>
              ) : pageMarkets.length === 0 ? (
                <div className="p-8 text-center text-white/40 text-sm">No questions found</div>
              ) : (
                <div className="overflow-y-auto flex-1 min-h-0">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-[#0d0d14] z-10">
                      <tr className="border-b border-[#1a1a2e]">
                        <th className="px-4 py-3 text-[11px] font-medium text-[#4B4BF7] uppercase tracking-[0.15em]">
                          Market
                        </th>
                        <th className="px-4 py-3 text-[11px] font-medium text-[#4B4BF7] uppercase tracking-[0.15em] text-right">
                          Open Interest
                        </th>
                        <th className="px-4 py-3 text-[11px] font-medium text-[#4B4BF7] uppercase tracking-[0.15em] text-right">
                          Notional Volume
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageMarkets.map((market) => (
                        <tr
                          key={market.id}
                          className="border-b border-[#1a1a2e]"
                        >
                          <td className="px-4 py-4 align-top">
                            <a
                              href={getMarketUrl(market)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#4B4BF7] hover:opacity-70 transition-opacity text-sm break-words"
                            >
                              {market.question ?? market.groupItemTitle ?? market.id}
                            </a>
                          </td>
                          <td className="px-4 py-4 text-[#4ade80] text-sm text-right font-mono whitespace-nowrap align-top">
                            {formatCurrency(market.liquidityNum)}
                          </td>
                          <td className="px-4 py-4 text-[#4ade80] text-sm text-right font-mono whitespace-nowrap align-top">
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

        {/* Footer */}
        {showFooter && (
          <div className="mt-6 w-full max-w-[1600px] mx-auto flex items-center justify-between gap-4 px-4 py-3 border border-[#1a1a2e] rounded-xl bg-[#0d0d14] shrink-0">
            <div className="text-white/40 text-xs font-mono">
              Showing {pageEvents.length} of {totalFilteredEvents.toLocaleString("en-US")} markets · {pageMarkets.length} of {totalFilteredMarkets.toLocaleString("en-US")} questions
            </div>
            {canShowMore && (
              <button
                type="button"
                onClick={loadMore}
                disabled={isFetching}
                className="px-3 py-1.5 rounded-md border border-[#1a1a2e] text-[#4B4BF7] hover:border-[#4B4BF7]/40 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium transition-colors"
              >
                {isFetching ? "Loading..." : `Load ${LOAD_MORE_INCREMENT} more`}
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
