"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { PolymarketEvent } from "@/lib/polymarket";
import {
  buildEventMarketRows,
  getMarketLiquidityUsd,
  getMarketVolume24h,
  getMarketVolumeUsd,
  getPolymarketUrl,
} from "@/lib/polymarket";
import { useSetPageAiState } from "@/components/ai/PageAiContext";

const PAGE_SIZE = 100;
const INITIAL_DISPLAY = 10;
const LOAD_MORE_INCREMENT = 10;

type EventsResponse = {
  events: PolymarketEvent[];
  hasMore: boolean;
};

async function fetchEventsPage(offset: number): Promise<EventsResponse> {
  const res = await fetch(
    `/api/markets/events?limit=${PAGE_SIZE}&offset=${offset}`
  );
  if (!res.ok) throw new Error("Failed to fetch events");
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

export default function MarketsPage() {
  const [searchQuery] = useState("");
  const [loadedEvents, setLoadedEvents] = useState<PolymarketEvent[]>([]);
  const [hasMoreEvents, setHasMoreEvents] = useState(true);
  const [offsetEvents, setOffsetEvents] = useState(0);
  const [displayCount, setDisplayCount] = useState(INITIAL_DISPLAY);

  const {
    data: eventsData,
    isLoading: eventsLoading,
    isFetching: eventsFetching,
    isError: eventsError,
    error: eventsErr,
  } = useQuery({
    queryKey: ["polymarket-events", offsetEvents],
    queryFn: () => fetchEventsPage(offsetEvents),
    enabled:
      (offsetEvents === 0 && loadedEvents.length === 0) ||
      (offsetEvents > 0 && loadedEvents.length === offsetEvents),
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

  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return loadedEvents;
    const q = searchQuery.trim().toLowerCase();
    return loadedEvents.filter((e) => {
      if ((e.title ?? "").toLowerCase().includes(q)) return true;
      return (e.markets ?? []).some(
        (m) =>
          (m.question ?? "").toLowerCase().includes(q) ||
          (m.groupItemTitle ?? "").toLowerCase().includes(q)
      );
    });
  }, [loadedEvents, searchQuery]);

  /** All active outcome rows across loaded events, sorted by notional volume (highest first). */
  const allMarketRows = useMemo(
    () =>
      buildEventMarketRows(filteredEvents, searchQuery, {
        rowOrder: "volume-global",
      }),
    [filteredEvents, searchQuery]
  );

  const totalFilteredEvents = filteredEvents.length;
  const totalFilteredMarkets = allMarketRows.length;

  const pageEvents = useMemo(
    () => filteredEvents.slice(0, displayCount),
    [filteredEvents, displayCount]
  );

  const pageMarketRows = useMemo(
    () => allMarketRows.slice(0, displayCount),
    [allMarketRows, displayCount]
  );

  const canShowMore =
    displayCount < totalFilteredEvents ||
    displayCount < totalFilteredMarkets ||
    hasMoreEvents;

  const loadMore = useCallback(() => {
    const nextCount = displayCount + LOAD_MORE_INCREMENT;
    setDisplayCount(nextCount);
    if (nextCount > loadedEvents.length - LOAD_MORE_INCREMENT && hasMoreEvents) {
      setOffsetEvents(loadedEvents.length);
    }
  }, [displayCount, loadedEvents.length, hasMoreEvents]);

  const isLoading = eventsLoading;
  const isFetching = eventsFetching;
  const isError = eventsError;
  const error = eventsErr;
  const showFooter = !isError && (loadedEvents.length > 0 || isLoading);
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
                        marketsVisible: pageMarketRows.map(({ event: e, market: m }) => ({
                          id: m.id,
                          eventId: e.id,
                          question: m.question ?? null,
                          groupItemTitle: m.groupItemTitle ?? null,
                          liquidityNum: getMarketLiquidityUsd(m),
                          volumeNum: getMarketVolumeUsd(m),
                          volume24h: getMarketVolume24h(m),
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
    pageMarketRows,
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
                <div className="overflow-y-auto overflow-x-hidden flex-1 min-h-0">
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
                        <tr key={event.id} className="border-b border-[#1a1a2e]">
                          <td className="px-4 py-4 align-top">
                            <a
                              href={getPolymarketUrl(event)}
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

            <section className="bg-[#0d0d14] border border-[#1a1a2e] rounded-xl overflow-hidden flex flex-col min-h-0 p-4">
              <div className="flex items-center gap-3 px-2 pb-4 shrink-0">
                <div className="w-1 h-5 bg-[#4B4BF7]"></div>
                <h2 className="text-base font-medium text-white">
                  Polymarket Active Questions
                </h2>
              </div>

              {eventsLoading && offsetEvents === 0 ? (
                <div className="p-8 text-center text-white/40 text-sm">Loading...</div>
              ) : pageMarketRows.length === 0 ? (
                <div className="p-8 text-center text-white/40 text-sm">No questions found</div>
              ) : (
                <div className="overflow-y-auto overflow-x-hidden flex-1 min-h-0">
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
                          24h Volume
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageMarketRows.map(({ event, market }) => (
                        <tr key={`${event.id}-${market.id}`} className="border-b border-[#1a1a2e]">
                          <td className="px-4 py-4 align-top">
                            <a
                              href={getPolymarketUrl(event, market)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#4B4BF7] hover:opacity-70 transition-opacity text-sm break-words"
                            >
                              {market.question ?? market.groupItemTitle ?? market.id}
                            </a>
                          </td>
                          <td className="px-4 py-4 text-[#4ade80] text-sm text-right font-mono whitespace-nowrap align-top">
                            {formatCurrency(getMarketLiquidityUsd(market))}
                          </td>
                          <td className="px-4 py-4 text-[#4ade80] text-sm text-right font-mono whitespace-nowrap align-top">
                            {formatCurrency(getMarketVolume24h(market))}
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

        {showFooter && (
          <div className="mt-6 w-full max-w-[1600px] mx-auto flex items-center justify-between gap-4 px-4 py-3 border border-[#1a1a2e] rounded-xl bg-[#0d0d14] shrink-0">
            <div className="text-white/40 text-xs font-mono">
              Showing {pageEvents.length} of {totalFilteredEvents.toLocaleString("en-US")} markets ·{" "}
              {pageMarketRows.length} of {totalFilteredMarkets.toLocaleString("en-US")} questions
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
