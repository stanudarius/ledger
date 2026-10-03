"use client";

import { ErrorCard } from "@/components/ledger/ErrorCard";

export default function WatchlistError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <ErrorCard
      title="Could not load watchlist"
      message={error.message || "An unexpected error occurred while loading your watchlist."}
      showHomeLink
      reset={reset}
    />
  );
}
