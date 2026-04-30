"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { 
  TrendingUp, 
  Trophy, 
  Users, 
  Radio, 
  BarChart3, 
  Wallet,
  ArrowRight,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";

function recordFromUnknown(v: unknown): Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
}

// Shared types
interface LeaderboardEntry {
  rank: number;
  name: string;
  address: string;
  profit: number;
  volume: number;
}

interface Creator {
  id: string;
  name: string;
  marketsCreated: number;
  totalVolume: number;
}

interface LiveTrade {
  id: string;
  market: string;
  side: "BUY" | "SELL";
  price: number;
  size: number;
  timestamp: string;
}

interface VolumeData {
  volume24h: number;
  week: number;
  month: number;
  allTime: number;
}

// Data fetching functions
async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const res = await fetch("/api/leaderboard?limit=5&orderBy=PNL&timePeriod=MONTH");
  if (!res.ok) return [];
  const data = (await res.json()) as Record<string, unknown>;
  const raw = Array.isArray(data.entries) ? data.entries : [];
  // API returns { entries: [...] } with proxyWallet, userName, vol, pnl, rank
  return raw.slice(0, 5).map((entry: unknown, idx: number) => {
    const e = recordFromUnknown(entry);
    const rankRaw = e.rank;
    const rank =
      typeof rankRaw === "number" && Number.isFinite(rankRaw)
        ? rankRaw
        : typeof rankRaw === "string"
          ? parseInt(rankRaw, 10) || idx + 1
          : idx + 1;
    const nameRaw = e.userName;
    const name =
      typeof nameRaw === "string" && nameRaw ? nameRaw : `Trader ${idx + 1}`;
    const profitRaw = e.pnl;
    const profit =
      typeof profitRaw === "number" && Number.isFinite(profitRaw)
        ? profitRaw
        : typeof profitRaw === "string"
          ? parseFloat(profitRaw) || 0
          : 0;
    const volRaw = e.vol;
    const volume =
      typeof volRaw === "number" && Number.isFinite(volRaw)
        ? volRaw
        : typeof volRaw === "string"
          ? parseFloat(volRaw) || 0
          : 0;
    return {
      rank,
      name,
      address: typeof e.proxyWallet === "string" ? e.proxyWallet : "",
      profit,
      volume,
    };
  });
}

async function fetchCreators(): Promise<Creator[]> {
  const res = await fetch("/api/creators");
  if (!res.ok) return [];
  const data = (await res.json()) as Record<string, unknown>;
  const raw = Array.isArray(data.creators) ? data.creators : [];
  // API returns { creators: [...] } with id, name, totalMarkets, totalVolume
  return raw.slice(0, 5).map((c: unknown) => {
    const o = recordFromUnknown(c);
    const marketsRaw = o.totalMarkets;
    const marketsCreated =
      typeof marketsRaw === "number" && Number.isFinite(marketsRaw)
        ? marketsRaw
        : typeof marketsRaw === "string"
          ? parseInt(marketsRaw, 10) || 0
          : 0;
    const volRaw = o.totalVolume;
    const totalVolume =
      typeof volRaw === "number" && Number.isFinite(volRaw)
        ? volRaw
        : typeof volRaw === "string"
          ? parseFloat(volRaw) || 0
          : 0;
    const name =
      typeof o.name === "string" && o.name
        ? o.name
        : typeof o.handle === "string" && o.handle
          ? o.handle
          : "Creator";
    return {
      id: typeof o.id === "string" ? o.id : String(o.id ?? ""),
      name,
      marketsCreated,
      totalVolume,
    };
  });
}

async function fetchLiveTrades(): Promise<LiveTrade[]> {
  const res = await fetch("/api/live/trades?limit=8");
  if (!res.ok) return [];
  const data = (await res.json()) as Record<string, unknown>;
  const raw = Array.isArray(data.trades) ? data.trades : [];
  // API returns { trades: [...] } with title, side, outcome, price, size, timestamp, transactionHash
  return raw.slice(0, 8).map((t: unknown, idx: number) => {
    const o = recordFromUnknown(t);
    const hash = o.transactionHash;
    const ts = o.timestamp;
    const id =
      typeof hash === "string" && hash
        ? hash
        : `${String(ts ?? "")}-${idx}`;
    const title = o.title;
    const sideRaw = o.side;
    const price = Number(o.price) || 0;
    const size = Number(o.size) || 0;
    const timestamp =
      ts != null && ts !== ""
        ? new Date(Number(ts) * 1000).toISOString()
        : new Date().toISOString();
    return {
      id,
      market: typeof title === "string" && title ? title : "Unknown Market",
      side: sideRaw === "SELL" ? "SELL" : "BUY",
      price,
      size,
      timestamp,
    };
  });
}

async function fetchVolumeData(): Promise<VolumeData | null> {
  const res = await fetch("/api/volume");
  if (!res.ok) return null;
  const data = (await res.json()) as Record<string, unknown>;
  // API returns { polymarket: { volume24h, week, month, allTime } }
  const pm = recordFromUnknown(data.polymarket);
  const num = (v: unknown) =>
    typeof v === "number" && Number.isFinite(v)
      ? v
      : typeof v === "string"
        ? parseFloat(v) || 0
        : 0;
  return {
    volume24h: num(pm.volume24h),
    week: num(pm.week),
    month: num(pm.month),
    allTime: num(pm.allTime),
  };
}

// Utility functions
function formatCurrency(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return `${Math.floor(diff / 3600000)}h ago`;
}

// Section wrapper component
function SectionWrapper({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("py-8 border-t border-border", className)}>
      <div className="max-w-7xl mx-auto px-3">{children}</div>
    </section>
  );
}

function SectionHeader({
  title,
  description,
  href,
  icon: Icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
}) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-start gap-2">
        <div className="p-1.5 bg-primary/10 rounded-lg">
          <Icon className="w-[20px] h-[20px] text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <Link
        href={href}
        className="inline-flex items-center gap-0.5 text-sm text-primary hover:text-primary/80 transition-colors"
      >
        View all
        <ArrowRight className="w-[14px] h-[14px]" />
      </Link>
    </div>
  );
}

// EV Engine Section
export function EVEngineSection() {
  return (
    <SectionWrapper>
      <SectionHeader
        title="+EV Engine"
        description="Find positive expected value bets by comparing sportsbook odds to Polymarket prices"
        href="/ev"
        icon={TrendingUp}
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {["NBA", "Soccer", "MLB", "NHL"].map((sport) => (
          <Link
            key={sport}
            href={`/ev?sport=${sport.toLowerCase()}`}
            className="p-3 bg-card border border-border rounded-lg hover:border-primary/30 hover:bg-card-elevated transition-all duration-150 group"
          >
            <p className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
              {sport}
            </p>
            <p className="text-xs text-muted-foreground">
              Find +EV opportunities
            </p>
          </Link>
        ))}
      </div>
    </SectionWrapper>
  );
}

// Leaderboard Section
export function LeaderboardSection() {
  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ["landing-leaderboard"],
    queryFn: fetchLeaderboard,
    staleTime: 120000,
  });

  return (
    <SectionWrapper className="bg-card/30">
      <SectionHeader
        title="Top Traders"
        description="The most profitable traders on Polymarket"
        href="/leaderboard"
        icon={Trophy}
      />
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-muted-foreground border-b border-border">
              <th className="pb-1.5 font-medium">Rank</th>
              <th className="pb-1.5 font-medium">Trader</th>
              <th className="pb-1.5 font-medium text-right">Profit</th>
              <th className="pb-1.5 font-medium text-right">Volume</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-1.5">
                    <div className="h-[16px] w-[24px] bg-muted animate-pulse rounded" />
                  </td>
                  <td className="py-1.5">
                    <div className="h-[16px] w-[100px] bg-muted animate-pulse rounded" />
                  </td>
                  <td className="py-1.5 text-right">
                    <div className="h-[16px] w-[60px] bg-muted animate-pulse rounded ml-auto" />
                  </td>
                  <td className="py-1.5 text-right">
                    <div className="h-[16px] w-[60px] bg-muted animate-pulse rounded ml-auto" />
                  </td>
                </tr>
              ))
            ) : leaderboard && leaderboard.length > 0 ? (
              leaderboard.map((entry) => (
                <tr key={entry.address} className="border-b border-border/50 hover:bg-card-elevated/50">
                  <td className="py-1.5">
                    <span
                      className={cn(
                        "font-mono font-semibold",
                        entry.rank === 1 && "text-warning",
                        entry.rank === 2 && "text-muted-foreground",
                        entry.rank === 3 && "text-orange-400"
                      )}
                    >
                      #{entry.rank}
                    </span>
                  </td>
                  <td className="py-1.5">
                    <Link
                      href={`/traders/${entry.address}`}
                      className="text-sm text-foreground hover:text-primary transition-colors"
                    >
                      {entry.name}
                    </Link>
                  </td>
                  <td className="py-1.5 text-right">
                    <span
                      className={cn(
                        "font-mono text-sm",
                        entry.profit >= 0 ? "text-success" : "text-destructive"
                      )}
                    >
                      {entry.profit >= 0 ? "+" : ""}
                      {formatCurrency(entry.profit)}
                    </span>
                  </td>
                  <td className="py-1.5 text-right font-mono text-sm text-muted-foreground">
                    {formatCurrency(entry.volume)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-4 text-center text-sm text-muted-foreground">
                  No leaderboard data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </SectionWrapper>
  );
}

// Creators Section
export function CreatorsSection() {
  const { data: creators, isLoading } = useQuery({
    queryKey: ["landing-creators"],
    queryFn: fetchCreators,
    staleTime: 300000,
  });

  return (
    <SectionWrapper>
      <SectionHeader
        title="Top Creators"
        description="Market creators driving liquidity and engagement"
        href="/creators"
        icon={Users}
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-2">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="p-2 bg-card border border-border rounded-lg animate-pulse"
              >
                <div className="h-[16px] w-3/4 bg-muted rounded mb-1" />
                <div className="h-[12px] w-1/2 bg-muted rounded" />
              </div>
            ))
          : creators && creators.length > 0
          ? creators.map((creator) => (
              <Link
                key={creator.id}
                href={`/creators?id=${creator.id}`}
                className="p-2 bg-card border border-border rounded-lg hover:border-primary/30 hover:bg-card-elevated transition-all duration-150"
              >
                <p className="text-sm font-medium text-foreground truncate">
                  {creator.name}
                </p>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                  <span>{creator.marketsCreated} markets</span>
                  <span className="text-border">|</span>
                  <span>{formatCurrency(creator.totalVolume)}</span>
                </div>
              </Link>
            ))
          : (
            <div className="col-span-full text-center py-4 text-sm text-muted-foreground">
              No creators data available
            </div>
          )}
      </div>
    </SectionWrapper>
  );
}

// Live Feed Section
export function LiveFeedSection() {
  const { data: trades, isLoading } = useQuery({
    queryKey: ["landing-live-trades"],
    queryFn: fetchLiveTrades,
    refetchInterval: 5000,
    staleTime: 3000,
  });

  return (
    <SectionWrapper className="bg-card/30">
      <SectionHeader
        title="Live Feed"
        description="Real-time trades happening on Polymarket"
        href="/live"
        icon={Radio}
      />
      <div className="space-y-1">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-1.5 bg-card border border-border rounded-lg animate-pulse"
            >
              <div className="h-[16px] w-[200px] bg-muted rounded" />
              <div className="h-[16px] w-[60px] bg-muted rounded" />
            </div>
          ))
        ) : trades && trades.length > 0 ? (
          trades.map((trade) => (
            <div
              key={trade.id}
              className="flex items-center justify-between p-1.5 bg-card border border-border rounded-lg hover:bg-card-elevated transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span
                  className={cn(
                    "text-xs font-mono font-semibold px-1 py-0.5 rounded",
                    trade.side === "BUY"
                      ? "bg-success/20 text-success"
                      : "bg-destructive/20 text-destructive"
                  )}
                >
                  {trade.side}
                </span>
                <span className="text-sm text-foreground truncate">
                  {trade.market.length > 50
                    ? trade.market.substring(0, 50) + "..."
                    : trade.market}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-mono text-sm text-foreground">
                  {(trade.price * 100).toFixed(0)}c
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  ${trade.size.toFixed(0)}
                </span>
                <span className="text-xs text-muted-foreground w-[60px] text-right">
                  {formatTime(trade.timestamp)}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-4 text-sm text-muted-foreground">
            No live trades available
          </div>
        )}
      </div>
    </SectionWrapper>
  );
}

// Volume Dashboard Section
export function VolumeDashboardSection() {
  const { data: volumeData, isLoading } = useQuery({
    queryKey: ["landing-volume"],
    queryFn: fetchVolumeData,
    staleTime: 300000,
  });

  return (
    <SectionWrapper>
      <SectionHeader
        title="Volume Dashboard"
        description="Trading volume across Polymarket"
        href="/volume"
        icon={BarChart3}
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="p-3 bg-card border border-border rounded-lg animate-pulse"
            >
              <div className="h-[12px] w-1/2 bg-muted rounded mb-2" />
              <div className="h-[24px] w-3/4 bg-muted rounded" />
            </div>
          ))
        ) : volumeData ? (
          <>
            <div className="p-3 bg-card border border-border rounded-lg">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">24h Volume</p>
              <p className="text-xl font-bold font-mono text-success">{formatCurrency(volumeData.volume24h)}</p>
            </div>
            <div className="p-3 bg-card border border-border rounded-lg">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">7d Volume</p>
              <p className="text-xl font-bold font-mono text-primary">{formatCurrency(volumeData.week)}</p>
            </div>
            <div className="p-3 bg-card border border-border rounded-lg">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">30d Volume</p>
              <p className="text-xl font-bold font-mono text-foreground">{formatCurrency(volumeData.month)}</p>
            </div>
            <div className="p-3 bg-card border border-border rounded-lg">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">All-Time</p>
              <p className="text-xl font-bold font-mono text-foreground">{formatCurrency(volumeData.allTime)}</p>
            </div>
          </>
        ) : (
          <div className="col-span-full text-center py-4 text-sm text-muted-foreground">
            No volume data available
          </div>
        )}
      </div>
    </SectionWrapper>
  );
}

// Wallet Analyzer Section
export function WalletAnalyzerSection() {
  return (
    <SectionWrapper className="bg-card/30">
      <SectionHeader
        title="Wallet Analyzer"
        description="Deep dive into any trader's portfolio and performance"
        href="/search"
        icon={Wallet}
      />
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="p-3 bg-card border border-border rounded-lg">
          <h3 className="text-sm font-medium text-foreground mb-1.5">Search Any Wallet</h3>
          <p className="text-xs text-muted-foreground mb-2">
            Enter a Polymarket address to view their complete trading history, open positions, and P&L.
          </p>
          <Link
            href="/search"
            className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
          >
            Search wallets
            <ArrowRight className="w-[14px] h-[14px]" />
          </Link>
        </div>
        <div className="p-3 bg-card border border-border rounded-lg">
          <h3 className="text-sm font-medium text-foreground mb-1.5">Connect Your Wallet</h3>
          <p className="text-xs text-muted-foreground mb-2">
            Connect your wallet to track your own portfolio, see unrealized P&L, and get personalized insights.
          </p>
          <Link
            href="/portfolio"
            className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
          >
            View portfolio
            <ArrowRight className="w-[14px] h-[14px]" />
          </Link>
        </div>
      </div>
    </SectionWrapper>
  );
}

// Markets Section
export function MarketsSection() {
  return (
    <SectionWrapper>
      <SectionHeader
        title="Explore Markets"
        description="Browse active markets and upcoming events"
        href="/markets"
        icon={ExternalLink}
      />
      <div className="grid sm:grid-cols-3 gap-2">
        <Link
          href="/markets?category=politics"
          className="p-3 bg-card border border-border rounded-lg hover:border-primary/30 hover:bg-card-elevated transition-all duration-150"
        >
          <p className="text-lg font-semibold text-foreground">Politics</p>
          <p className="text-xs text-muted-foreground">Elections, policy, global events</p>
        </Link>
        <Link
          href="/markets?category=sports"
          className="p-3 bg-card border border-border rounded-lg hover:border-primary/30 hover:bg-card-elevated transition-all duration-150"
        >
          <p className="text-lg font-semibold text-foreground">Sports</p>
          <p className="text-xs text-muted-foreground">Games, championships, player props</p>
        </Link>
        <Link
          href="/markets?category=crypto"
          className="p-3 bg-card border border-border rounded-lg hover:border-primary/30 hover:bg-card-elevated transition-all duration-150"
        >
          <p className="text-lg font-semibold text-foreground">Crypto</p>
          <p className="text-xs text-muted-foreground">Prices, events, protocol updates</p>
        </Link>
      </div>
    </SectionWrapper>
  );
}
