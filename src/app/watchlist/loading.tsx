export default function WatchlistLoading() {
  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 animate-pulse">
      {/* Header skeleton */}
      <div className="flex justify-between items-end border-b border-rule pb-4 mb-4">
        <div className="space-y-3">
          <div className="h-3 bg-paper-alt rounded-sm w-32" />
          <div className="h-8 bg-paper-alt rounded-sm w-48" />
        </div>
        <div className="h-9 bg-paper-alt rounded-sm w-44" />
      </div>

      {/* Table skeleton */}
      <div className="border border-rule-dashed rounded-sm overflow-hidden">
        <div className="bg-paper-alt h-10 border-b border-rule" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 p-4 border-b border-rule-dashed last:border-0">
            <div className="w-20 space-y-2">
              <div className="h-5 bg-paper-alt rounded-sm" />
              <div className="h-3 bg-paper-alt rounded-sm w-16" />
            </div>
            <div className="w-28 space-y-2">
              <div className="h-3 bg-paper-alt rounded-sm w-12" />
              <div className="h-4 bg-paper-alt rounded-sm w-20" />
            </div>
            <div className="h-4 bg-paper-alt rounded-sm flex-1" />
            <div className="h-4 bg-paper-alt rounded-sm w-16" />
            <div className="h-4 bg-paper-alt rounded-sm w-20" />
            <div className="h-4 bg-paper-alt rounded-sm w-20" />
            <div className="h-6 bg-paper-alt rounded-full w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
