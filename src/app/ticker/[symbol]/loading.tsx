export default function TickerLoading() {
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 grid grid-cols-1 md:grid-cols-4 gap-6 animate-pulse">
      <div className="md:col-span-1 space-y-6">
        <div>
          <div className="h-10 bg-paper-alt rounded-sm w-3/4 mb-2" />
          <div className="h-3 bg-paper-alt rounded-sm w-1/2" />
        </div>
        <div className="border border-rule-dashed rounded-sm p-4 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="py-2 border-b border-rule-dashed last:border-0">
              <div className="h-2 bg-paper-alt rounded-sm w-1/3 mb-2" />
              <div className="h-8 bg-paper-alt rounded-sm w-1/2" />
            </div>
          ))}
        </div>
        <div className="space-y-3">
          <div className="h-2 bg-paper-alt rounded-sm w-1/3" />
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-paper-alt flex-shrink-0" />
            <div className="space-y-1 flex-1">
              <div className="h-3 bg-paper-alt rounded-sm w-2/3" />
              <div className="h-2 bg-paper-alt rounded-sm w-1/3" />
            </div>
          </div>
        </div>
      </div>

      <div className="md:col-span-3 space-y-8">
        <div className="h-72 bg-paper-alt rounded-sm border border-rule-dashed" />
        {[1, 2, 3].map((section) => (
          <div key={section} className="space-y-4">
            <div className="h-8 bg-paper-alt rounded-sm w-1/3 border-b border-rule pb-2" />
            <div className="h-4 bg-paper-alt rounded-sm w-full" />
            <div className="h-4 bg-paper-alt rounded-sm w-5/6" />
            <div className="h-64 bg-paper-alt rounded-sm" />
          </div>
        ))}
      </div>
    </div>
  );
}
