"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowRight, TrendingUp, Activity } from "lucide-react";

interface Stats {
  totalVolume: number;
  weeklyVolume: number;
}

interface TrendingMarket {
  id: string;
  question: string;
  volume24h: number;
  liquidity: number;
  yesPrice: number;
}

async function fetchStats(): Promise<Stats> {
  const res = await fetch("/api/volume");
  const volumeData = await res.json();
  
  // Get volume from the polymarket stats
  const totalVolume = volumeData.polymarket?.volume24h || 0;
  const weeklyVolume = volumeData.polymarket?.week || 0;
  
  return {
    totalVolume,
    weeklyVolume,
  };
}

async function fetchTrendingMarkets(): Promise<TrendingMarket[]> {
  const res = await fetch("/api/markets?limit=5");
  if (!res.ok) return [];
  const data = await res.json();
  
  return (data.markets || [])
    .slice(0, 3)
    .map((m: any) => {
      // Parse outcome prices to get Yes price
      let yesPrice = 0.5;
      try {
        const prices = JSON.parse(m.outcomePrices || "[]");
        if (prices.length > 0) yesPrice = parseFloat(prices[0]) || 0.5;
      } catch {
        yesPrice = 0.5;
      }
      
      return {
        id: m.id || m.conditionId,
        question: m.question || m.groupItemTitle || "Market",
        volume24h: m.volume24hr || m.volume24h || 0,
        liquidity: m.liquidityNum || m.liquidity || 0,
        yesPrice,
      };
    });
}

function formatVolume(volume: number): string {
  if (volume >= 1000000000) return `$${(volume / 1000000000).toFixed(1)}B`;
  if (volume >= 1000000) return `$${(volume / 1000000).toFixed(0)}M`;
  if (volume >= 1000) return `$${(volume / 1000).toFixed(0)}K`;
  return `$${volume.toFixed(0)}`;
}

function StatCard({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-card/50 border border-border rounded-lg">
      <Icon className="w-[20px] h-[20px] text-primary" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-mono font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}

function MarketPreviewCard({ market }: { market: TrendingMarket }) {
  return (
    <div className="p-2 bg-card border border-border rounded-lg hover:border-primary/30 transition-colors duration-150 card-hover">
      <p className="text-sm text-foreground line-clamp-2 mb-1.5">{market.question}</p>
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="font-mono">Yes: {(market.yesPrice * 100).toFixed(0)}c</span>
          <span className="text-border">|</span>
          <span className="font-mono">No: {((1 - market.yesPrice) * 100).toFixed(0)}c</span>
        </div>
        {market.volume24h > 0 && (
          <span className="text-success font-mono">
            ${market.volume24h >= 1000000 
              ? `${(market.volume24h / 1000000).toFixed(1)}M` 
              : market.volume24h >= 1000 
                ? `${(market.volume24h / 1000).toFixed(0)}K` 
                : market.volume24h.toFixed(0)} vol
          </span>
        )}
      </div>
    </div>
  );
}

export function HeroSection() {
  const { data: stats } = useQuery({
    queryKey: ["hero-stats"],
    queryFn: fetchStats,
    staleTime: 60000,
  });

  const { data: trendingMarkets } = useQuery({
    queryKey: ["hero-trending"],
    queryFn: fetchTrendingMarkets,
    staleTime: 60000,
  });

  return (
    <section className="relative min-h-[600px] pt-[100px] pb-10 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 grid-pattern" />
      <div className="absolute inset-0 radial-gradient-overlay" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-3">
        <div className="grid lg:grid-cols-2 gap-6 items-center">
          {/* Left side - Text content */}
          <div>
            {/* Live indicator */}
            <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-success/10 border border-success/30 rounded-full mb-3">
              <span className="w-[8px] h-[8px] bg-success rounded-full animate-pulse-dot" />
              <span className="text-xs text-success font-medium">Live Data</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-3 text-balance">
              Polymarket Intelligence
              <span className="text-primary"> Platform</span>
            </h1>

            <p className="text-lg text-muted-foreground mb-4 max-w-xl text-pretty">
              Real-time analytics, +EV opportunities, and market intelligence for serious Polymarket traders. 
              Find edge before the market does.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-2 mb-5">
              <Link
                href="/ev"
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors glow-primary"
              >
                Find +EV Bets
                <ArrowRight className="w-[16px] h-[16px]" />
              </Link>
              <Link
                href="/leaderboard"
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-card border border-border text-foreground rounded-lg font-medium hover:bg-card-elevated transition-colors"
              >
                View Leaderboard
              </Link>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap gap-2">
              <StatCard
                label="24h Volume"
                value={stats && stats.totalVolume > 0 ? formatVolume(stats.totalVolume) : "---"}
                icon={TrendingUp}
              />
              <StatCard
                label="7d Volume"
                value={stats && stats.weeklyVolume > 0 ? formatVolume(stats.weeklyVolume) : "---"}
                icon={Activity}
              />
            </div>
          </div>

          {/* Right side - Trending Markets */}
          <div className="lg:pl-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-medium text-foreground">Trending Markets</h2>
              <Link
                href="/extradata"
                className="text-xs text-primary hover:text-primary/80 transition-colors"
              >
                View all
              </Link>
            </div>
            <div className="space-y-2">
              {trendingMarkets && trendingMarkets.length > 0 ? (
                trendingMarkets.map((market) => <MarketPreviewCard key={market.id} market={market} />)
              ) : (
                <>
                  <div className="h-[72px] bg-card border border-border rounded-lg animate-pulse" />
                  <div className="h-[72px] bg-card border border-border rounded-lg animate-pulse" />
                  <div className="h-[72px] bg-card border border-border rounded-lg animate-pulse" />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
