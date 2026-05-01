"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatVolume } from "@/lib/volume";
import { useSetPageAiState } from "@/components/ai/PageAiContext";

type VolumeResponse = {
  polymarket: { volume24h?: number; week?: number; month: number; allTime: number; lastUpdated: string };
};

async function fetchVolume(): Promise<VolumeResponse> {
  const res = await fetch("/api/volume");
  if (!res.ok) throw new Error("Failed to fetch volume data");
  return res.json();
}

export default function VolumePage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["exchange-volume-day-month-all-time"],
    queryFn: fetchVolume,
    refetchInterval: 5 * 60 * 1000,
  });
  const setPageAiState = useSetPageAiState();

  useEffect(() => {
    if (!data?.polymarket) return;
    setPageAiState({
      kind: "volume",
      state: {
        polymarket: data.polymarket,
      },
    });
  }, [setPageAiState, data?.polymarket]);

  return (
    <div className="min-h-screen bg-[#04040a]">
      <div className="max-w-7xl mx-auto px-6 pt-6 pb-10">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-[#4B4BF7] rounded-full" />
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Exchange Volume Dashboard
            </h1>
          </div>
        </header>

        {/* Error State */}
        {isError && (
          <div className="text-center py-12 text-red-400 text-sm">
            Error: {error instanceof Error ? error.message : "Failed to load volume data"}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12 text-white/40 text-sm font-mono">
            Loading volume data...
          </div>
        )}

        {/* Content */}
        {!isLoading && !isError && data?.polymarket && (
          <div className="border border-[#1a1a2e] rounded-xl bg-[#0d0d14] p-6">
            {/* Top Row: Source badge + Timestamp */}
            <div className="flex items-center justify-between mb-6 pb-6 border-b border-[#1a1a2e]">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 rounded-full bg-[#4B4BF7]" />
                <span className="text-[11px] uppercase tracking-widest font-semibold text-white/50">
                  Polymarket
                </span>
              </div>
              <span className="text-[11px] font-mono text-white/25">
                Updated {new Date(data.polymarket.lastUpdated).toLocaleString()}
              </span>
            </div>

            {/* Stat Tiles */}
            <div className="grid grid-cols-4 gap-4">
              {/* Last 24h */}
              {data.polymarket.volume24h != null && (
                <div className="bg-[#0b0b12] rounded-lg p-4 border border-white/[0.07]">
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-white/35 mb-2">
                    Last 24h
                  </p>
                  <p className="text-xl font-bold font-mono text-[#4ade80] mb-2">
                    {formatVolume(data.polymarket.volume24h)}
                  </p>
                  <p className="text-[10px] font-mono text-white/25">Last 24 hours</p>
                </div>
              )}

              {/* Last Week */}
              {data.polymarket.week != null && (
                <div className="bg-[#0b0b12] rounded-lg p-4 border border-white/[0.07]">
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-white/35 mb-2">
                    Last Week
                  </p>
                  <p className="text-xl font-bold font-mono text-[#4ade80] mb-2">
                    {formatVolume(data.polymarket.week)}
                  </p>
                  <p className="text-[10px] font-mono text-white/25">Last 7 days</p>
                </div>
              )}

              {/* Last Month */}
              <div className="bg-[#0b0b12] rounded-lg p-4 border border-white/[0.07]">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-white/35 mb-2">
                  Last Month
                </p>
                <p className="text-xl font-bold font-mono text-[#4ade80] mb-2">
                  {formatVolume(data.polymarket.month)}
                </p>
                <p className="text-[10px] font-mono text-white/25">Last 30 days</p>
              </div>

              {/* All-Time (Indigo) */}
              <div className="bg-[#0b0b12] rounded-lg p-4 border border-white/[0.07]">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-white/35 mb-2">
                  All-Time
                </p>
                <p className="text-xl font-bold font-mono text-[#4B4BF7] mb-2">
                  {formatVolume(data.polymarket.allTime)}
                </p>
                <p className="text-[10px] font-mono text-white/25">Exchange lifetime</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
