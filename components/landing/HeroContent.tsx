"use client";

import Link from "next/link";
import Image from "next/image";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface TrendingEvent {
  id: string;
  title: string;
  volume: number;
  slug: string | null;
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

function formatVolume(num: number): string {
  if (num >= 1000000000) return `$${(num / 1000000000).toFixed(1)}B`;
  if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`;
  return `$${num.toFixed(0)}`;
}

export function HeroContent() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { data: events } = useQuery({
    queryKey: ["hero-events"],
    queryFn: fetchTrendingEvents,
    staleTime: 60000,
  });

  const slides = [
    { id: 1, title: "EV Engine", description: "Find +EV opportunities" },
    { id: 2, title: "Leaderboard", description: "Top traders on Polymarket" },
    { id: 3, title: "Live Feed", description: "Real-time market activity" },
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* Search Bar */}
      <div className="pt-8 pb-6 px-8">
        <div className="relative max-w-[300px]">
          <input
            type="text"
            placeholder="Search"
            className="w-full bg-[#111] border border-[#222] rounded-md px-4 py-2 text-sm text-white placeholder:text-[#555] focus:outline-none focus:border-[#333]"
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
        </div>
      </div>

      {/* Main Hero Content */}
      <div className="px-8 pb-12">
        <div className="flex items-start justify-between gap-8">
          {/* Left - Text Content */}
          <div className="max-w-[600px]">
            {/* Main Headline */}
            <h1 className="text-5xl md:text-6xl font-bold text-white leading-[1.1] mb-4">
              Polymarket,<br />
              unlocked.
            </h1>
            
            {/* Accent Tagline */}
            <p className="text-lg md:text-xl font-semibold text-primary mb-6">
              {"<"}Heartbeat first. Headlines second. Edge always.{">"}
            </p>
            
            {/* Description */}
            <p className="text-[#888] text-base leading-relaxed mb-8 max-w-[500px]">
              Polymarket intelligence platform. Powered by traders. Made for traders.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex gap-4">
              <Link
                href="/ev"
                className="inline-flex items-center justify-center min-w-[160px] px-8 py-3 bg-[#111] border border-[#333] text-white text-sm font-medium rounded-[4px] hover:bg-[#1a1a1a] hover:border-[#444] transition-colors"
              >
                Find +EV Bets
              </Link>
              <Link
                href="/extradata"
                className="inline-flex items-center justify-center min-w-[160px] px-8 py-3 bg-transparent border border-[#333] text-[#888] text-sm font-medium rounded-[4px] hover:text-white hover:border-[#444] transition-colors"
              >
                Explore Markets
              </Link>
            </div>
          </div>
          
          {/* Right - Pulse/Heartbeat Animation */}
          <div className="hidden lg:block">
            <div className="w-[280px] h-[140px] relative">
              {/* Animated Pulse Line */}
              <svg
                viewBox="0 0 280 140"
                className="w-full h-full"
                preserveAspectRatio="none"
              >
                {/* Glow filter */}
                <defs>
                  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <linearGradient id="pulseGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#4B4BF7" stopOpacity="0.1" />
                    <stop offset="50%" stopColor="#4B4BF7" stopOpacity="1" />
                    <stop offset="100%" stopColor="#4B4BF7" stopOpacity="0.1" />
                  </linearGradient>
                </defs>
                
                {/* Background grid lines */}
                {Array.from({ length: 6 }).map((_, i) => (
                  <line
                    key={`h-${i}`}
                    x1="0"
                    y1={i * 28}
                    x2="280"
                    y2={i * 28}
                    stroke="#1a1a1a"
                    strokeWidth="1"
                  />
                ))}
                {Array.from({ length: 8 }).map((_, i) => (
                  <line
                    key={`v-${i}`}
                    x1={i * 40}
                    y1="0"
                    x2={i * 40}
                    y2="140"
                    stroke="#1a1a1a"
                    strokeWidth="1"
                  />
                ))}
                
                {/* Main pulse line */}
                <path
                  d="M 0 70 L 40 70 L 60 70 L 80 70 L 100 70 L 110 30 L 120 110 L 130 50 L 140 90 L 150 70 L 180 70 L 200 70 L 220 70 L 280 70"
                  fill="none"
                  stroke="url(#pulseGradient)"
                  strokeWidth="2"
                  filter="url(#glow)"
                  className="animate-pulse-line"
                />
                
                {/* Animated dot that follows the line */}
                <circle r="4" fill="#4B4BF7" filter="url(#glow)">
                  <animateMotion
                    dur="2s"
                    repeatCount="indefinite"
                    path="M 0 70 L 40 70 L 60 70 L 80 70 L 100 70 L 110 30 L 120 110 L 130 50 L 140 90 L 150 70 L 180 70 L 200 70 L 220 70 L 280 70"
                  />
                </circle>
                
                {/* Secondary faint pulse */}
                <path
                  d="M 0 70 L 40 70 L 60 70 L 80 70 L 100 70 L 110 30 L 120 110 L 130 50 L 140 90 L 150 70 L 180 70 L 200 70 L 220 70 L 280 70"
                  fill="none"
                  stroke="#4B4BF7"
                  strokeWidth="1"
                  strokeOpacity="0.2"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Product Showcase / Carousel */}
      <div className="px-8 pb-16">
        <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 via-purple-500/20 to-pink-500/20 p-1">
          <div className="bg-black rounded-lg p-6">
            {/* Hot Markets Display */}
            <div className="mb-4">
              <h3 className="text-white text-lg font-semibold mb-1">Hot Markets</h3>
              <p className="text-[#666] text-sm">Highest volume events on Polymarket</p>
            </div>
            
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
                    <span className="text-primary font-mono text-sm whitespace-nowrap">
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
