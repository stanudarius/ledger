"use client";

import { ErrorCard } from "@/components/ledger/ErrorCard";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <ErrorCard
      title="Data Unavailable"
      message="We could not load the financial data for this ticker. It may be unavailable or rate-limited."
      reset={reset}
    />
  );
}
