"use client";

import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface Market {
  id: string;
  question: string;
  slug: string;
  outcomePrices?: string;
  outcomes?: string;
  volume?: string;
  volume24hr?: number;
}

interface MarketTickerItem {
  id: string;
  question: string;
  yesPrice: number;
  volume24h: number;
  slug: string;
}

async function fetchMarkets(): Promise<MarketTickerItem[]> {
  const res = await fetch("/api/markets?limit=20&active=true");
  if (!res.ok) throw new Error("Failed to fetch markets");
  const data = await res.json();
  
  return (data.markets || []).slice(0, 12).map((m: Market) => {
    let yesPrice = 0.5;
    if (m.outcomePrices) {
      try {
        const prices = JSON.parse(m.outcomePrices);
        yesPrice = parseFloat(prices[0]) || 0.5;
      } catch {
        yesPrice = 0.5;
      }
    }
    
    return {
      id: m.id,
      question: m.question,
      yesPrice,
      volume24h: m.volume24hr || 0,
      slug: m.slug,
    };
  });
}

function formatVolume(volume: number): string {
  if (volume >= 1000000) return `$${(volume / 1000000).toFixed(1)}M`;
  if (volume >= 1000) return `$${(volume / 1000).toFixed(0)}K`;
  return `$${volume.toFixed(0)}`;
}

function truncateQuestion(question: string, maxLength: number = 40): string {
  if (question.length <= maxLength) return question;
  return question.substring(0, maxLength - 3) + "...";
}

export function TickerBar() {
  const { data: markets, isLoading } = useQuery({
    queryKey: ["ticker-markets"],
    queryFn: fetchMarkets,
    refetchInterval: 30000, // 30s refresh
    staleTime: 15000,
  });

  if (isLoading || !markets || markets.length === 0) {
    return (
      <div className="h-[36px] bg-card border-b border-border flex items-center justify-center">
        <div className="text-xs text-muted-foreground">Loading live markets...</div>
      </div>
    );
  }

  // Duplicate for seamless loop
  const tickerItems = [...markets, ...markets];

  return (
    <div className="h-[36px] bg-card border-b border-border overflow-hidden">
      <div className="h-full flex items-center animate-ticker whitespace-nowrap">
        {tickerItems.map((market, idx) => (
          <a
            key={`${market.id}-${idx}`}
            href={`https://polymarket.com/event/${market.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2 text-xs hover:bg-card-elevated transition-colors duration-150 h-full"
          >
            <span className="text-muted-foreground">
              {truncateQuestion(market.question, 35)}
            </span>
            <span
              className={cn(
                "font-mono font-medium",
                market.yesPrice >= 0.5 ? "text-success" : "text-destructive"
              )}
            >
              {(market.yesPrice * 100).toFixed(0)}%
            </span>
            <span className="text-muted-foreground/60 text-[10px]">
              {formatVolume(market.volume24h)}
            </span>
            <span className="text-border mx-1">|</span>
          </a>
        ))}
      </div>
    </div>
  );
}
