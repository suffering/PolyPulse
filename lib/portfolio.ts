"use client";

import { useQuery } from "@tanstack/react-query";
import type { TimeRange } from "./trader-stats";
import type { PnLDataPoint } from "./leaderboard";
import type { OpenPosition, ClosedPosition } from "./leaderboard";

const STALE_TIME_MS = 2 * 60 * 1000;
const TRADES_STALE_MS = 60 * 1000;

export interface PortfolioProfile {
  profileImage: string | null;
  displayUsernamePublic: string | null;
  name: string | null;
  pseudonym: string | null;
  xUsername: string | null;
  bio: string | null;
  proxyWallet: string;
}

export interface PortfolioStats {
  tradingVolume: number;
  portfolioValue: number;
  marketsTraded: number;
  totalPnl: number;
  userName: string | null;
  profileImage: string | null;
  xUsername: string | null;
  openInterest: number;
  winRate: number | null;
  winRateWins: number;
  winRateTotal: number;
  lastUpdated: string;
}

export interface PortfolioPnLResponse {
  address: string;
  range: TimeRange;
  data: PnLDataPoint[];
  summaryPnl: number;
  lastUpdated: string;
}

export interface PortfolioPositionsResponse {
  positions: OpenPosition[];
  lastUpdated: string;
}

export interface PortfolioClosedPositionsResponse {
  closedPositions: ClosedPosition[];
  hasMore: boolean;
  lastUpdated: string;
}

export interface TradeItem {
  proxyWallet?: string;
  side?: string;
  asset?: string;
  conditionId?: string;
  size?: number;
  price?: number;
  timestamp?: number;
  title?: string;
  slug?: string;
  eventSlug?: string;
  outcome?: string;
  outcomeIndex?: number;
  transactionHash?: string;
  [key: string]: unknown;
}

export interface PortfolioTradesResponse {
  trades: TradeItem[];
  hasMore: boolean;
  lastUpdated: string;
}

function ensureAddress(address: string | null): address is string {
  return Boolean(address && /^0x[a-fA-F0-9]{40}$/.test(address));
}

async function fetchProfile(address: string): Promise<PortfolioProfile> {
  const res = await fetch(
    `/api/portfolio/profile?address=${encodeURIComponent(address)}`
  );
  if (!res.ok) throw new Error("Failed to load profile");
  return res.json();
}

async function fetchStats(address: string): Promise<PortfolioStats> {
  const res = await fetch(
    `/api/portfolio/stats?address=${encodeURIComponent(address)}`
  );
  if (!res.ok) throw new Error("Failed to load stats");
  return res.json();
}

async function fetchPnL(
  address: string,
  range: TimeRange
): Promise<PortfolioPnLResponse> {
  const res = await fetch(
    `/api/portfolio/pnl?address=${encodeURIComponent(address)}&range=${range}`
  );
  if (!res.ok) throw new Error("Failed to load P&L history");
  return res.json();
}

async function fetchPositions(
  address: string
): Promise<PortfolioPositionsResponse> {
  const res = await fetch(
    `/api/portfolio/positions?address=${encodeURIComponent(address)}`
  );
  if (!res.ok) throw new Error("Failed to load positions");
  return res.json();
}

async function fetchTrades(
  address: string,
  limit: number,
  offset: number
): Promise<PortfolioTradesResponse> {
  const res = await fetch(
    `/api/portfolio/trades?address=${encodeURIComponent(address)}&limit=${limit}&offset=${offset}`
  );
  if (!res.ok) throw new Error("Failed to load trades");
  return res.json();
}

async function fetchClosedPositionsPage(
  address: string,
  limit: number,
  offset: number
): Promise<PortfolioClosedPositionsResponse> {
  const res = await fetch(
    `/api/portfolio/closed-positions?address=${encodeURIComponent(
      address
    )}&limit=${limit}&offset=${offset}`
  );
  if (!res.ok) throw new Error("Failed to load closed positions");
  return res.json();
}

export function usePortfolioProfile(address: string | null) {
  return useQuery({
    queryKey: ["portfolio", "profile", address],
    queryFn: () => fetchProfile(address!),
    enabled: ensureAddress(address),
    staleTime: STALE_TIME_MS,
  });
}

export function usePortfolioStats(address: string | null) {
  return useQuery({
    queryKey: ["portfolio", "stats", address],
    queryFn: () => fetchStats(address!),
    enabled: ensureAddress(address),
    staleTime: STALE_TIME_MS,
  });
}

export function usePortfolioPnL(address: string | null, range: TimeRange) {
  return useQuery({
    queryKey: ["portfolio", "pnl", address, range],
    queryFn: () => fetchPnL(address!, range),
    enabled: ensureAddress(address),
    staleTime: STALE_TIME_MS,
  });
}

export function usePortfolioPositions(address: string | null) {
  return useQuery({
    queryKey: ["portfolio", "positions", address],
    queryFn: () => fetchPositions(address!),
    enabled: ensureAddress(address),
    staleTime: 30 * 1000,
  });
}

export function usePortfolioTrades(
  address: string | null,
  limit: number,
  offset: number
) {
  return useQuery({
    queryKey: ["portfolio", "trades", address, limit, offset],
    queryFn: () => fetchTrades(address!, limit, offset),
    enabled: ensureAddress(address),
    staleTime: TRADES_STALE_MS,
  });
}

export function usePortfolioClosedPositions(
  address: string | null,
  limit: number,
  offset: number
) {
  return useQuery({
    queryKey: ["portfolio", "closed-positions", address, limit, offset],
    queryFn: () => fetchClosedPositionsPage(address!, limit, offset),
    enabled: ensureAddress(address),
    staleTime: TRADES_STALE_MS,
  });
}

