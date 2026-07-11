"use client"

export default function Error({ reset }: { reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 space-y-4">
      <h2 className="text-2xl font-serif text-negative">Data Unavailable</h2>
      <p className="text-ink-muted">We could not load the financial data for this ticker. It may be unavailable or rate-limited.</p>
      <button 
        onClick={() => reset()} 
        className="px-6 py-2 bg-ink text-paper rounded-sm hover:bg-ink-muted transition-colors font-sans uppercase tracking-widest text-xs font-bold"
      >
        Retry
      </button>
    </div>
  )
}
