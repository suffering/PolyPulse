"use client";

interface QuotaTrackerProps {
  quotaRemaining: number | null;
  lastUpdated: string;
  onRefresh?: () => void;
  isLoading?: boolean;
  rateLimited?: boolean;
}

export function QuotaTracker({
  quotaRemaining,
  lastUpdated,
  onRefresh,
  isLoading,
  rateLimited,
}: QuotaTrackerProps) {
  const formattedTime = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "—";

  return (
    <div className="flex items-center gap-4 text-xs text-slate-500 font-mono">
      {rateLimited && (
        <span className="text-amber-400" title="Odds API returned 429 Too Many Requests">
          Odds API: rate limited — try again later
        </span>
      )}
      {!rateLimited && quotaRemaining !== null && (
        <span>
          Odds API: <span className="text-slate-400">{quotaRemaining}</span> requests left
        </span>
      )}
      <span>Updated: {formattedTime}</span>
      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="text-cyan-500 hover:text-cyan-400 disabled:opacity-50"
        >
          {isLoading ? "Refreshing..." : "Refresh"}
        </button>
      )}
    </div>
  );
}
