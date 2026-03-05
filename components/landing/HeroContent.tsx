"use client";

import Link from "next/link";
import Image from "next/image";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

interface TrendingEvent {
  id: string;
  title: string;
  volume: number;
  slug: string | null;
}

interface TopTrader {
  id: string;
  address: string;
  pnl: number;
  wins: number;
  trades: number;
}

interface ExchangeVolume {
  volume24h: number;
  week: number;
  month: number;
  allTime: number;
}

async function fetchTrendingEvents(): Promise<TrendingEvent[]> {
  const res = await fetch("/api/markets/events?limit=5");
  if (!res.ok) return [];
  const data = await res.json();
  return (data.events || []).slice(0, 5).map((e: any) => ({
    id: e.id,
    title: e.title || "Market",
    volume: typeof e.volume === "string" ? parseFloat(e.volume) || 0 : (e.volume || 0),
    slug: e.slug || null,
  }));
}

async function fetchTopTraders(): Promise<TopTrader[]> {
  try {
    const res = await fetch("/api/leaderboard?category=OVERALL&timePeriod=ALL&orderBy=PNL&limit=5");
    if (!res.ok) return [];
    const data = await res.json();
    const entries = data.entries || [];
    return entries.map((entry: any, index: number) => ({
      id: entry.proxyWallet,
      address: entry.userName || entry.proxyWallet,
      pnl: entry.pnl || 0,
      wins: 0, // Not available from API, set to 0
      trades: entry.totalTrades || 0,
    }));
  } catch (error) {
    console.error("Failed to fetch top traders:", error);
    return [];
  }
}

async function fetchExchangeVolume(): Promise<ExchangeVolume | null> {
  try {
    const res = await fetch("/api/volume");
    if (!res.ok) return null;
    const data = await res.json();
    const polymarket = data.polymarket || {};
    return {
      volume24h: polymarket.volume24h || 0,
      week: polymarket.week || 0,
      month: polymarket.month || 0,
      allTime: polymarket.allTime || 0,
    };
  } catch (error) {
    console.error("Failed to fetch volume:", error);
    return null;
  }
}

function formatVolume(num: number): string {
  if (num >= 1000000000) return `$${(num / 1000000000).toFixed(1)}B`;
  if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`;
  return `$${num.toFixed(0)}`;
}

function formatPnL(num: number): string {
  if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `$${(num / 1000).toFixed(1)}K`;
  return `$${num.toFixed(0)}`;
}

export function HeroContent() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const taglineText = "Heartbeat first. Headlines second. Edge always.";

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index <= taglineText.length) {
        setDisplayedText(taglineText.slice(0, index));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 40);

    return () => clearInterval(interval);
  }, []);

  const { data: events } = useQuery({
    queryKey: ["hero-events"],
    queryFn: fetchTrendingEvents,
    staleTime: 60000,
  });

  const { data: traders } = useQuery({
    queryKey: ["top-traders"],
    queryFn: fetchTopTraders,
    staleTime: 60000,
  });

  const { data: volume } = useQuery({
    queryKey: ["exchange-volume"],
    queryFn: fetchExchangeVolume,
    staleTime: 60000,
  });

  const slides = [
    { id: 0, type: "markets", title: "Hot Markets", description: "Highest volume events on Polymarket" },
    { id: 1, type: "traders", title: "Top Traders", description: "Best performing traders all-time" },
    { id: 2, type: "volume", title: "Polymarket Volume", description: "24H, weekly, monthly, and all-time volume" },
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* Main Hero Content */}
      <div className="px-8 pt-8 pb-4">
        <div className="flex items-start justify-between gap-8">
          {/* Left - Text Content */}
          <div className="max-w-[600px]">
            {/* Main Headline */}
            <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight mb-2">
              Polymarket,<br />
              unlocked.
            </h1>
            
            {/* Accent Tagline */}
            <p className="text-lg md:text-xl font-semibold text-primary mb-3 h-[28px]">
              {displayedText}
            </p>
            
            {/* Description */}
            <p className="text-[#888] text-base leading-snug mb-6 max-w-[500px]">
              Polymarket intelligence platform. Powered by traders. Made for traders.
            </p>
          </div>
          
          {/* Right - Pulse/Heartbeat Animation */}
          <div className="hidden lg:block">
            <div className="w-[400px] h-[100px] relative">
              {/* Animated Pulse Line */}
              <svg
                viewBox="0 0 400 100"
                className="w-full h-full"
                preserveAspectRatio="none"
              >
                {/* Subtle glow filter */}
                <defs>
                  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <linearGradient id="pulseGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#4B4BF7" stopOpacity="0" />
                    <stop offset="20%" stopColor="#4B4BF7" stopOpacity="0.4" />
                    <stop offset="50%" stopColor="#4B4BF7" stopOpacity="0.6" />
                    <stop offset="80%" stopColor="#4B4BF7" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#4B4BF7" stopOpacity="0" />
                  </linearGradient>
                </defs>
                
                {/* Main pulse line - longer and more subtle */}
                <path
                  d="M 0 50 L 80 50 L 120 50 L 160 50 L 180 50 L 195 20 L 210 80 L 225 35 L 240 65 L 255 50 L 300 50 L 340 50 L 400 50"
                  fill="none"
                  stroke="url(#pulseGradient)"
                  strokeWidth="1.5"
                  filter="url(#glow)"
                  className="animate-pulse-line"
                />
                
                {/* Animated dot that follows the line */}
                <circle r="3" fill="#4B4BF7" fillOpacity="0.8" filter="url(#glow)">
                  <animateMotion
                    dur="3s"
                    repeatCount="indefinite"
                    path="M 0 50 L 80 50 L 120 50 L 160 50 L 180 50 L 195 20 L 210 80 L 225 35 L 240 65 L 255 50 L 300 50 L 340 50 L 400 50"
                  />
                </circle>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Product Showcase / Carousel */}
      <div className="px-8 pb-16">
        <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 via-purple-500/20 to-pink-500/20 p-1">
          <div className="bg-black rounded-lg p-6">
            {/* Slide Header */}
            <div className="mb-4">
              <h3 className="text-white text-lg font-semibold mb-1">{slides[currentSlide].title}</h3>
              <p className="text-[#666] text-sm">{slides[currentSlide].description}</p>
            </div>
            
            {/* Hot Markets Slide */}
            {slides[currentSlide].type === "markets" && (
              <div className="grid gap-3">
                {events && events.length > 0 ? (
                  events.map((event) => (
                    <a
                      key={event.id}
                      href={event.slug ? `https://polymarket.com/event/${event.slug}` : `https://polymarket.com/event/${event.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg hover:border-[#333] transition-colors"
                    >
                      <p className="text-white text-sm line-clamp-1 flex-1 mr-4">{event.title}</p>
                      <span className="text-green-400 font-mono text-sm whitespace-nowrap">
                        {formatVolume(event.volume)}
                      </span>
                    </a>
                  ))
                ) : (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-[52px] bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg animate-pulse" />
                  ))
                )}
              </div>
            )}
            
            {/* Top Traders Slide */}
            {slides[currentSlide].type === "traders" && (
              <div className="grid gap-3">
                {traders && traders.length > 0 ? (
                  traders.map((trader, index) => (
                    <div
                      key={trader.id}
                      className="flex items-center justify-between p-3 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg hover:border-[#333] transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-[#666] text-sm font-medium w-6">#{index + 1}</span>
                        <div className="flex-1">
                          <p className="text-white text-sm font-mono">{trader.address}</p>
                          <p className="text-[#666] text-xs">
                            {trader.trades} total trades
                          </p>
                        </div>
                      </div>
                      <span className="text-green-400 font-mono text-sm whitespace-nowrap">
                        +{formatPnL(trader.pnl)}
                      </span>
                    </div>
                  ))
                ) : (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-[60px] bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg animate-pulse" />
                  ))
                )}
              </div>
            )}
            
            {/* Exchange Volume Slide */}
            {slides[currentSlide].type === "volume" && (
              <div className="grid grid-cols-2 gap-3">
                {volume ? (
                  <>
                    <div className="p-4 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg">
                      <p className="text-[#666] text-xs mb-2">Last 24H</p>
                      <p className="text-green-400 font-mono text-lg font-semibold">
                        {formatVolume(volume.volume24h)}
                      </p>
                    </div>
                    <div className="p-4 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg">
                      <p className="text-[#666] text-xs mb-2">Last Week</p>
                      <p className="text-green-400 font-mono text-lg font-semibold">
                        {formatVolume(volume.week)}
                      </p>
                    </div>
                    <div className="p-4 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg">
                      <p className="text-[#666] text-xs mb-2">Last Month</p>
                      <p className="text-green-400 font-mono text-lg font-semibold">
                        {formatVolume(volume.month)}
                      </p>
                    </div>
                    <div className="p-4 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg">
                      <p className="text-[#666] text-xs mb-2">All-Time</p>
                      <p className="text-green-400 font-mono text-lg font-semibold">
                        {formatVolume(volume.allTime)}
                      </p>
                    </div>
                  </>
                ) : (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-[100px] bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg animate-pulse" />
                  ))
                )}
              </div>
            )}
            
            {/* Carousel Controls */}
            <div className="flex justify-center gap-4 mt-6">
              <button
                onClick={() => setCurrentSlide((prev) => Math.max(0, prev - 1))}
                className="w-10 h-10 rounded-full bg-[#111] border border-[#222] flex items-center justify-center text-[#666] hover:text-white hover:border-[#333] transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentSlide((prev) => Math.min(slides.length - 1, prev + 1))}
                className="w-10 h-10 rounded-full bg-[#111] border border-[#222] flex items-center justify-center text-[#666] hover:text-white hover:border-[#333] transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
