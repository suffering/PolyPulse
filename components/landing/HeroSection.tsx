"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowRight, TrendingUp, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface Stats {
  totalVolume: number;
  weeklyVolume: number;
}

interface EVOpportunity {
  id: string;
  title: string;
  evPercent: number;
  polyPrice: number;
  sport: string;
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

async function fetchTopEV(): Promise<EVOpportunity[]> {
  const res = await fetch("/api/ev?sport=nba");
  if (!res.ok) return [];
  const data = await res.json();
  
  return (data.opportunities || [])
    .filter((opp: any) => opp.evPercent > 0)
    .slice(0, 3)
    .map((opp: any) => ({
      id: opp.id,
      title: opp.polymarketTitle || opp.question || "Market",
      evPercent: opp.evPercent || 0,
      polyPrice: opp.polyPrice || 0.5,
      sport: opp.sport || "Sports",
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

function EVPreviewCard({ opportunity }: { opportunity: EVOpportunity }) {
  return (
    <div className="p-2 bg-card border border-border rounded-lg hover:border-primary/30 transition-colors duration-150 card-hover">
      <div className="flex items-start justify-between gap-2 mb-1">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {opportunity.sport}
        </span>
        <span
          className={cn(
            "text-xs font-mono font-semibold px-1 py-0.5 rounded",
            opportunity.evPercent >= 5
              ? "bg-success/20 text-success"
              : opportunity.evPercent >= 2
              ? "bg-primary/20 text-primary"
              : "bg-warning/20 text-warning"
          )}
        >
          +{opportunity.evPercent.toFixed(1)}% EV
        </span>
      </div>
      <p className="text-sm text-foreground line-clamp-2 mb-1">{opportunity.title}</p>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Poly: {(opportunity.polyPrice * 100).toFixed(0)}c</span>
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

  const { data: topEV } = useQuery({
    queryKey: ["hero-ev"],
    queryFn: fetchTopEV,
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

          {/* Right side - EV Preview Cards */}
          <div className="lg:pl-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-medium text-foreground">Top +EV Opportunities</h2>
              <Link
                href="/ev"
                className="text-xs text-primary hover:text-primary/80 transition-colors"
              >
                View all
              </Link>
            </div>
            <div className="space-y-2">
              {topEV && topEV.length > 0 ? (
                topEV.map((opp) => <EVPreviewCard key={opp.id} opportunity={opp} />)
              ) : (
                <>
                  <div className="h-[80px] bg-card border border-border rounded-lg animate-pulse" />
                  <div className="h-[80px] bg-card border border-border rounded-lg animate-pulse" />
                  <div className="h-[80px] bg-card border border-border rounded-lg animate-pulse" />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
