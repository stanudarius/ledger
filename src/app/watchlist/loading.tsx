export default function WatchlistLoading() {
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 grid grid-cols-1 md:grid-cols-4 gap-6 animate-pulse">
      <div className="md:col-span-3 space-y-6">
        <div>
          <div className="h-10 bg-paper-alt rounded-sm w-1/3 mb-2" />
          <div className="h-3 bg-paper-alt rounded-sm w-1/4" />
        </div>
        <div className="border border-rule-dashed rounded-sm overflow-hidden">
          <div className="bg-paper-alt h-10 border-b border-rule" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4 border-b border-rule-dashed">
              <div className="w-24 space-y-1">
                <div className="h-5 bg-paper-alt rounded-sm" />
                <div className="h-3 bg-paper-alt rounded-sm w-3/4" />
              </div>
              <div className="h-5 bg-paper-alt rounded-sm flex-1" />
              <div className="h-5 bg-paper-alt rounded-sm w-16" />
              <div className="h-5 bg-paper-alt rounded-sm w-20" />
              <div className="h-6 bg-paper-alt rounded-full w-24" />
            </div>
          ))}
        </div>
      </div>
      <div className="md:col-span-1 space-y-4">
        <div className="h-6 bg-paper-alt rounded-sm w-1/2" />
        <div className="border border-rule-dashed rounded-sm divide-y divide-rule-dashed">
          {[1, 2].map((i) => (
            <div key={i} className="p-4 space-y-2">
              <div className="h-3 bg-paper-alt rounded-sm w-1/3" />
              <div className="h-4 bg-paper-alt rounded-sm w-full" />
              <div className="h-4 bg-paper-alt rounded-sm w-4/5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
