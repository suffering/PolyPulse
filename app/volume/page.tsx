"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatVolume } from "@/lib/volume";
import { useSetPageAiState } from "@/components/ai/PageAiContext";

type VolumeResponse = {
  polymarket: { day: number; month: number; allTime: number; lastUpdated: string; volume24h?: number };
};

async function fetchVolume(): Promise<VolumeResponse> {
  const res = await fetch("/api/volume");
  if (!res.ok) throw new Error("Failed to fetch volume data");
  return res.json();
}

function ExchangeCard({
  title,
  data,
  firstPeriodLabel = "Last Day",
  firstPeriodSublabel = "Last 24 hours",
  showVolume24h = false,
}: {
  title: string;
  data: { day: number; month: number; allTime: number; lastUpdated: string; volume24h?: number };
  firstPeriodLabel?: string;
  firstPeriodSublabel?: string;
  showVolume24h?: boolean;
}) {
  return (
    <section className="border border-slate-700/50 rounded-lg bg-slate-900/30 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <span className="text-xs text-slate-500">
          Last updated: {new Date(data.lastUpdated).toLocaleString()}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {showVolume24h && data.volume24h != null && (
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/30">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Last 24h</p>
            <p className="text-2xl font-bold text-emerald-400">{formatVolume(data.volume24h)}</p>
            <p className="text-xs text-slate-500 mt-1">Last 24 hours</p>
          </div>
        )}
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/30">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">{firstPeriodLabel}</p>
          <p className="text-2xl font-bold text-green-400">{formatVolume(data.day)}</p>
          <p className="text-xs text-slate-500 mt-1">{firstPeriodSublabel}</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/30">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Last Month</p>
          <p className="text-2xl font-bold text-blue-400">{formatVolume(data.month)}</p>
          <p className="text-xs text-slate-500 mt-1">Last 30 days</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/30">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">All-Time</p>
          <p className="text-2xl font-bold text-purple-400">{formatVolume(data.allTime)}</p>
          <p className="text-xs text-slate-500 mt-1">Exchange lifetime</p>
        </div>
      </div>
    </section>
  );
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
    <div className="min-h-screen bg-[#0d1117] text-slate-200 font-mono">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Exchange Volume Dashboard</h1>
              <p className="text-slate-500 text-sm mt-1">
                Last 24h, last week, last 30 days, and all-time volume from Gamma API
              </p>
              <p className="text-slate-600 text-xs mt-1">
                Summed over all active and closed markets
              </p>
            </div>
            <Link
              href="/"
              className="px-4 py-2 rounded-md border border-slate-600 bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 transition-colors text-sm"
            >
              ← Back to EV Engine
            </Link>
          </div>
        </header>

        {isLoading && <div className="text-center py-12 text-slate-500">Loading volume data...</div>}
        {isError && (
          <div className="text-center py-12 text-red-400">
            Error: {error instanceof Error ? error.message : "Failed to load volume data"}
          </div>
        )}

        {!isLoading && !isError && data && (
          <div className="space-y-8">
            <ExchangeCard
              title="Polymarket"
              data={data.polymarket}
              firstPeriodLabel="Last Week"
              firstPeriodSublabel="Last 7 days"
              showVolume24h
            />
          </div>
        )}
      </div>
    </div>
  );
}
