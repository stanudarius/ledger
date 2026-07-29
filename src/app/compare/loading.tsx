export default function CompareLoading() {
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6 animate-pulse">
      <div className="h-10 bg-paper-alt rounded-sm w-1/3" />
      <div className="h-4 bg-paper-alt rounded-sm w-1/2" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="border border-rule-dashed rounded-sm p-6 space-y-3">
            <div className="h-4 bg-paper-alt rounded-sm w-2/3" />
            <div className="h-8 bg-paper-alt rounded-sm w-1/3" />
            <div className="h-3 bg-paper-alt rounded-sm w-full" />
            <div className="h-3 bg-paper-alt rounded-sm w-4/5" />
          </div>
        ))}
      </div>
    </div>
  );
}
