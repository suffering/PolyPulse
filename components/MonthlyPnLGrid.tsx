"use client";

interface MonthlyPnLGridProps {
  year: number;
  monthlyData: Record<string, number>;
  onYearChange: (year: number) => void;
  minYear: number;
  maxYear: number;
}

const MONTHS = [
  { key: "01", label: "JAN" },
  { key: "02", label: "FEB" },
  { key: "03", label: "MAR" },
  { key: "04", label: "APR" },
  { key: "05", label: "MAY" },
  { key: "06", label: "JUN" },
  { key: "07", label: "JUL" },
  { key: "08", label: "AUG" },
  { key: "09", label: "SEP" },
  { key: "10", label: "OCT" },
  { key: "11", label: "NOV" },
  { key: "12", label: "DEC" },
];

function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) return "$0";
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

export function MonthlyPnLGrid({
  year,
  monthlyData,
  onYearChange,
  minYear,
  maxYear,
}: MonthlyPnLGridProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">Monthly P&L</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onYearChange(year - 1)}
            disabled={year <= minYear}
            className="px-3 py-1 rounded border border-slate-600 bg-slate-800 text-slate-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700"
          >
            ←
          </button>
          <span className="text-white font-mono text-sm min-w-[60px] text-center">
            {year}
          </span>
          <button
            type="button"
            onClick={() => onYearChange(year + 1)}
            disabled={year >= maxYear}
            className="px-3 py-1 rounded border border-slate-600 bg-slate-800 text-slate-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700"
          >
            →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {MONTHS.map((month) => {
          const monthKey = `${year}-${month.key}`;
          const value = monthlyData[monthKey] || 0;
          const hasData = monthlyData[monthKey] !== undefined;
          const isPositive = value >= 0;
          const isZero = Math.abs(value) < 0.01;

          const bgClass = !hasData
            ? "bg-slate-800/30"
            : isZero
            ? "bg-slate-800/50"
            : isPositive
            ? "bg-emerald-500/20"
            : "bg-red-500/20";

          const textClass = !hasData
            ? "text-slate-600"
            : isZero
            ? "text-slate-500"
            : isPositive
            ? "text-emerald-400"
            : "text-red-400";

          const borderClass = !hasData
            ? "border-slate-700/30"
            : isZero
            ? "border-slate-700/50"
            : isPositive
            ? "border-emerald-500/30"
            : "border-red-500/30";

          return (
            <div
              key={month.key}
              className={`border rounded-lg p-3 ${bgClass} ${borderClass}`}
            >
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                {month.label}
              </div>
              <div className={`text-sm font-bold ${textClass}`}>
                {!hasData ? "—" : formatCurrency(value)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
