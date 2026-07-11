"use client"

import Link from "next/link"

export default function CompareError({ error: _error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 space-y-4">
      <h2 className="text-2xl font-serif text-ink">Comparison Unavailable</h2>
      <p className="text-ink-muted text-sm text-center">Unable to load comparison data. Please try again.</p>
      <div className="flex gap-4">
        <button onClick={() => reset()} className="px-6 py-2 bg-ink text-paper rounded-sm hover:bg-ink-muted transition-colors font-sans uppercase tracking-widest text-xs font-bold">Retry</button>
        <Link href="/" className="px-6 py-2 border border-rule text-ink rounded-sm hover:bg-paper-alt transition-colors font-sans uppercase tracking-widest text-xs font-bold">Go Home</Link>
      </div>
    </div>
  )
}
