"use client";

import { ErrorCard } from "@/components/ledger/ErrorCard";

export default function CompareError({ error: _error, reset }: { error: Error; reset: () => void }) {
  return (
    <ErrorCard
      title="Comparison Unavailable"
      message="Unable to load comparison data. Please try again."
      showHomeLink
      reset={reset}
    />
  );
}
