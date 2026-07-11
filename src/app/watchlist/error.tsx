"use client"

import Link from "next/link"

export default function WatchlistError({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 space-y-4">
      <div className="text-4xl">⚠️</div>
      <h2 className="text-2xl font-serif text-ink">Could not load watchlist</h2>
      <p className="text-ink-muted text-sm max-w-sm text-center">
        {error.message || "An unexpected error occurred while loading your watchlist."}
      </p>
      <div className="flex gap-4">
        <button
          onClick={() => reset()}
          className="px-6 py-2 bg-ink text-paper rounded-sm hover:bg-ink-muted transition-colors font-sans uppercase tracking-widest text-xs font-bold"
        >
          Retry
        </button>
        <Link
          href="/"
          className="px-6 py-2 border border-rule text-ink rounded-sm hover:bg-paper-alt transition-colors font-sans uppercase tracking-widest text-xs font-bold"
        >
          Go Home
        </Link>
      </div>
    </div>
  )
}
