export default function DiscoverLoading() {
  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6 animate-pulse">
      <div className="border-b border-rule pb-4 space-y-3">
        <div className="h-10 bg-paper-alt rounded-sm w-80" />
        <div className="h-4 bg-paper-alt rounded-sm w-96" />
      </div>
      <div className="h-6 bg-paper-alt rounded-sm w-24" />
      <div className="border border-rule-dashed rounded-sm overflow-hidden">
        <div className="bg-paper-alt h-10 border-b border-rule" />
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="flex items-center gap-4 p-4 border-b border-rule-dashed last:border-0"
          >
            <div className="w-20 space-y-2">
              <div className="h-5 bg-paper-alt rounded-sm" />
              <div className="h-3 bg-paper-alt rounded-sm w-16" />
            </div>
            <div className="h-3 bg-paper-alt rounded-sm w-16" />
            <div className="h-4 bg-paper-alt rounded-sm w-16" />
            <div className="h-3 bg-paper-alt rounded-sm flex-1" />
            <div className="h-3 bg-paper-alt rounded-sm w-12" />
            <div className="h-3 bg-paper-alt rounded-sm w-12" />
            <div className="h-3 bg-paper-alt rounded-sm w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}
