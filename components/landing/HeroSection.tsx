"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowRight, TrendingUp, Activity } from "lucide-react";

interface Stats {
  totalVolume: number;
  weeklyVolume: number;
}

interface TrendingEvent {
  id: string;
  title: string;
  volume: number;
  liquidity: number;
  slug: string | null;
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

async function fetchTrendingEvents(): Promise<TrendingEvent[]> {
  // Use /api/markets/events which returns active events sorted by volume (highest first)
  const res = await fetch("/api/markets/events?limit=5");
  if (!res.ok) return [];
  const data = await res.json();
  
  // API returns events sorted by volume descending, all active/non-closed
  return (data.events || [])
    .slice(0, 3)
    .map((e: any) => ({
      id: e.id,
      title: e.title || "Market",
      volume: typeof e.volume === "string" ? parseFloat(e.volume) || 0 : (e.volume || 0),
      liquidity: typeof e.liquidity === "string" ? parseFloat(e.liquidity) || 0 : (e.liquidity || 0),
      slug: e.slug || null,
    }));
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

function EventPreviewCard({ event }: { event: TrendingEvent }) {
  const polyUrl = event.slug 
    ? `https://polymarket.com/event/${event.slug}` 
    : `https://polymarket.com/event/${event.id}`;
  
  return (
    <a 
      href={polyUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-2 bg-card border border-border rounded-lg hover:border-primary/30 transition-colors duration-150 card-hover"
    >
      <p className="text-sm text-foreground line-clamp-2 mb-1.5">{event.title}</p>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground font-mono">
          OI: {formatVolume(event.liquidity)}
        </span>
        {event.volume > 0 && (
          <span className="text-success font-mono">
            {formatVolume(event.volume)} vol
          </span>
        )}
      </div>
    </a>
  );
}

export function HeroSection() {
  const { data: stats } = useQuery({
    queryKey: ["hero-stats"],
    queryFn: fetchStats,
    staleTime: 60000,
  });

  const { data: trendingEvents } = useQuery({
    queryKey: ["hero-trending-events"],
    queryFn: fetchTrendingEvents,
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

          {/* Right side - Trending Events */}
          <div className="lg:pl-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-medium text-foreground">Hot Markets</h2>
              <Link
                href="/extradata"
                className="text-xs text-primary hover:text-primary/80 transition-colors"
              >
                View all
              </Link>
            </div>
            <div className="space-y-2">
              {trendingEvents && trendingEvents.length > 0 ? (
                trendingEvents.map((event) => <EventPreviewCard key={event.id} event={event} />)
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
