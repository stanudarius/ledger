"use client";

import * as React from "react";
import { HeaderSnapshot } from "./HeaderSnapshot";
import type { CompanyProfile, Quote, Metrics } from "@/lib/providers";

function readCookieList(key: string): string[] {
  if (typeof document === "undefined") return [];
  try {
    const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${key}=([^;]*)`));
    return match ? match[1].split(",").filter(Boolean) : [];
  } catch {
    return [];
  }
}

export function ClientHeaderSnapshot({
  symbol,
  profile,
  quote,
  metrics,
}: {
  symbol: string;
  profile: CompanyProfile;
  quote: Quote;
  metrics: Metrics;
}) {
  // Read cookies synchronously in useState initializer — no useEffect, no mount-time setState.
  // On server: document is undefined → false/false.
  // On client: reads actual cookie values.
  const [state] = React.useState(() => {
    if (typeof document === "undefined") return { inWatchlist: false, inCompare: false };
    const w = readCookieList("ledger_watchlist");
    const c = readCookieList("ledger_compare");
    return { inWatchlist: w.includes(symbol), inCompare: c.includes(symbol) };
  });

  return (
    <HeaderSnapshot
      symbol={symbol}
      profile={profile}
      quote={quote}
      metrics={metrics}
      initialWatchlist={state.inWatchlist}
      initialCompare={state.inCompare}
    />
  );
}
