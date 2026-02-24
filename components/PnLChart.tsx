"use client";

import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

interface PnLChartProps {
  data: { date: string; timestamp: number; pnl: number }[];
  isLoading: boolean;
  currentPnl: number;
}

function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) return "$0.00";
  if (Math.abs(value) >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

export function PnLChart({ data, isLoading, currentPnl }: PnLChartProps) {
  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500">
        Loading chart...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500">
        No P&L data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor={currentPnl >= 0 ? "#10b981" : "#ef4444"}
              stopOpacity={0.3}
            />
            <stop
              offset="95%"
              stopColor={currentPnl >= 0 ? "#10b981" : "#ef4444"}
              stopOpacity={0}
            />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="date"
          tick={false}
          axisLine={{ stroke: "#475569" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#94a3b8", fontSize: 12 }}
          axisLine={{ stroke: "#475569" }}
          tickLine={{ stroke: "#475569" }}
          tickFormatter={(value) => formatCurrency(value)}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1e293b",
            border: "1px solid #475569",
            borderRadius: "6px",
            color: "#e2e8f0",
          }}
          formatter={(value: number) => formatCurrency(value)}
        />
        <Area
          type="monotone"
          dataKey="pnl"
          stroke={currentPnl >= 0 ? "#10b981" : "#ef4444"}
          strokeWidth={2}
          fill="url(#pnlGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
