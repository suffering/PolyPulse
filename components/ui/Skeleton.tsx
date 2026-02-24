export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-slate-800/50 rounded ${className}`}
      aria-hidden="true"
    />
  );
}

export function TableSkeleton({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[900px]">
        <thead className="border-b border-slate-700/60">
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="px-3 py-2">
                <Skeleton className="h-4 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <tr key={rowIdx} className="border-b border-slate-800/70">
              {Array.from({ length: cols }).map((_, colIdx) => (
                <td key={colIdx} className="px-3 py-2">
                  <Skeleton className={`h-4 ${colIdx === 0 ? "w-32" : "w-16"}`} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ProfileHeaderSkeleton() {
  return (
    <header className="border border-slate-700/50 rounded-lg bg-slate-900/30 p-6 mb-6">
      <div className="flex flex-col sm:flex-row gap-6 items-start">
        <div className="flex-shrink-0">
          <Skeleton className="h-24 w-24 rounded-full" />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-40" />
          <div className="flex flex-wrap gap-2 mt-4">
            <Skeleton className="h-9 w-32" />
          </div>
        </div>
      </div>
    </header>
  );
}

export function StatCardsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
        {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
          <div key={i} className="border border-slate-700/50 rounded-lg bg-slate-900/30 p-4">
            <Skeleton className="h-3 w-24 mb-2" />
            <Skeleton className="h-6 w-20" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {Array.from({ length: Math.min(count - 3, 3) }).map((_, i) => (
          <div key={i} className="border border-slate-700/50 rounded-lg bg-slate-900/30 p-4">
            <Skeleton className="h-3 w-24 mb-2" />
            <Skeleton className="h-6 w-20" />
          </div>
        ))}
      </div>
    </>
  );
}

export function ChartSkeleton() {
  return (
    <div className="border border-slate-700/50 rounded-lg bg-slate-900/30 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <Skeleton className="h-3 w-16 mb-1" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-7 w-10" />
          ))}
        </div>
      </div>
      <div className="h-64 flex items-center justify-center">
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  );
}
